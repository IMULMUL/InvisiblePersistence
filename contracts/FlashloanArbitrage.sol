// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function getAmountsOut(uint amountIn, address[] calldata path)
        external view returns (uint[] memory amounts);
}

interface IUniswapV3Router {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    
    function exactInputSingle(ExactInputSingleParams calldata params)
        external payable returns (uint256 amountOut);
}

/**
 * @title FlashloanArbitrage
 * @dev Advanced MEV bot contract for executing arbitrage opportunities using Aave flashloans
 * @notice This contract performs cross-DEX arbitrage with flashloans
 */
contract FlashloanArbitrage is FlashLoanSimpleReceiverBase, Ownable {
    
    // State variables
    address public immutable uniswapV2Router;
    address public immutable sushiswapRouter;
    address public immutable uniswapV3Router;
    
    uint256 public minProfitBasisPoints = 10; // 0.1% minimum profit
    uint256 public constant MAX_GAS_PRICE = 500 gwei;
    
    // Events
    event ArbitrageExecuted(
        address indexed token,
        uint256 profit,
        uint256 timestamp
    );
    
    event FlashLoanReceived(
        address indexed asset,
        uint256 amount,
        uint256 premium
    );
    
    event ProfitWithdrawn(
        address indexed token,
        uint256 amount,
        address indexed recipient
    );
    
    // Errors
    error InsufficientProfit();
    error UnauthorizedCaller();
    error ArbitrageFailed();
    error InvalidParameters();
    
    /**
     * @dev Constructor
     * @param _addressProvider Aave lending pool address provider
     * @param _uniswapV2Router Uniswap V2 router address
     * @param _sushiswapRouter SushiSwap router address
     * @param _uniswapV3Router Uniswap V3 router address
     */
    constructor(
        address _addressProvider,
        address _uniswapV2Router,
        address _sushiswapRouter,
        address _uniswapV3Router
    ) FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_addressProvider)) {
        uniswapV2Router = _uniswapV2Router;
        sushiswapRouter = _sushiswapRouter;
        uniswapV3Router = _uniswapV3Router;
    }
    
    /**
     * @dev Execute arbitrage with flashloan
     * @param asset Token address to borrow
     * @param amount Amount to borrow
     * @param params Encoded parameters for arbitrage execution
     */
    function executeArbitrage(
        address asset,
        uint256 amount,
        bytes calldata params
    ) external onlyOwner {
        if (tx.gasprice > MAX_GAS_PRICE) revert InvalidParameters();
        
        // Request flashloan from Aave
        POOL.flashLoanSimple(
            address(this),
            asset,
            amount,
            params,
            0
        );
    }
    
    /**
     * @dev Callback function called by Aave after receiving flashloan
     * @param asset The address of the flash-borrowed asset
     * @param amount The amount of the flash-borrowed asset
     * @param premium The fee of the flash-borrowed asset
     * @param initiator The address of the flashloan initiator
     * @param params The byte-encoded params passed when initiating the flashloan
     * @return True if the execution of the operation succeeds, false otherwise
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        if (msg.sender != address(POOL)) revert UnauthorizedCaller();
        
        emit FlashLoanReceived(asset, amount, premium);
        
        // Decode parameters
        (
            address[] memory path,
            address[] memory routers,
            uint24[] memory fees,
            bool useV3
        ) = abi.decode(params, (address[], address[], uint24[], bool));
        
        // Execute arbitrage trades
        uint256 finalAmount = _executeArbitrageTrades(
            asset,
            amount,
            path,
            routers,
            fees,
            useV3
        );
        
        // Calculate profit
        uint256 totalDebt = amount + premium;
        if (finalAmount <= totalDebt) revert InsufficientProfit();
        
        uint256 profit = finalAmount - totalDebt;
        uint256 minProfit = (amount * minProfitBasisPoints) / 10000;
        
        if (profit < minProfit) revert InsufficientProfit();
        
        // Approve Aave to pull the debt amount
        IERC20(asset).approve(address(POOL), totalDebt);
        
        emit ArbitrageExecuted(asset, profit, block.timestamp);
        
        return true;
    }
    
    /**
     * @dev Internal function to execute arbitrage trades across DEXes
     */
    function _executeArbitrageTrades(
        address asset,
        uint256 amount,
        address[] memory path,
        address[] memory routers,
        uint24[] memory fees,
        bool useV3
    ) internal returns (uint256) {
        uint256 currentAmount = amount;
        
        for (uint256 i = 0; i < routers.length; i++) {
            if (useV3 && i == routers.length - 1) {
                // Use Uniswap V3 for last swap
                currentAmount = _swapV3(
                    path[i],
                    path[i + 1],
                    currentAmount,
                    fees[i],
                    routers[i]
                );
            } else {
                // Use Uniswap V2 compatible router
                currentAmount = _swapV2(
                    path[i],
                    path[i + 1],
                    currentAmount,
                    routers[i]
                );
            }
        }
        
        return currentAmount;
    }
    
    /**
     * @dev Swap tokens using Uniswap V2 compatible router
     */
    function _swapV2(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        address router
    ) internal returns (uint256) {
        IERC20(tokenIn).approve(router, amountIn);
        
        address[] memory swapPath = new address[](2);
        swapPath[0] = tokenIn;
        swapPath[1] = tokenOut;
        
        uint[] memory amounts = IUniswapV2Router(router).swapExactTokensForTokens(
            amountIn,
            0, // Accept any amount (slippage handled by profit check)
            swapPath,
            address(this),
            block.timestamp + 300
        );
        
        return amounts[amounts.length - 1];
    }
    
    /**
     * @dev Swap tokens using Uniswap V3 router
     */
    function _swapV3(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint24 fee,
        address router
    ) internal returns (uint256) {
        IERC20(tokenIn).approve(router, amountIn);
        
        IUniswapV3Router.ExactInputSingleParams memory params = IUniswapV3Router.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: fee,
            recipient: address(this),
            deadline: block.timestamp + 300,
            amountIn: amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });
        
        return IUniswapV3Router(router).exactInputSingle(params);
    }
    
    /**
     * @dev Withdraw profits to owner
     */
    function withdrawProfits(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
        emit ProfitWithdrawn(token, amount, owner());
    }
    
    /**
     * @dev Update minimum profit threshold
     */
    function setMinProfitBasisPoints(uint256 _minProfit) external onlyOwner {
        minProfitBasisPoints = _minProfit;
    }
    
    /**
     * @dev Emergency withdraw function
     */
    function emergencyWithdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance > 0) {
            IERC20(token).transfer(owner(), balance);
        }
    }
    
    /**
     * @dev Get token balance of contract
     */
    function getBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
    
    // Receive ETH
    receive() external payable {}
}

