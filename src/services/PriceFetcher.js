/**
 * PriceFetcher - Fetches token prices from multiple DEXes
 */

const { ethers } = require('ethers');
const logger = require('../utils/logger');

const UNISWAP_V2_PAIR_ABI = [
    'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
    'function token0() external view returns (address)',
    'function token1() external view returns (address)'
];

const UNISWAP_V2_FACTORY_ABI = [
    'function getPair(address tokenA, address tokenB) external view returns (address pair)'
];

const UNISWAP_V3_QUOTER_ABI = [
    'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)'
];

class PriceFetcher {
    constructor(provider, config) {
        this.provider = provider;
        this.config = config;
        
        // Initialize factory contracts
        this.uniswapV2Factory = new ethers.Contract(
            config.dexes.uniswapV2Factory,
            UNISWAP_V2_FACTORY_ABI,
            provider
        );
        
        this.sushiswapFactory = new ethers.Contract(
            config.dexes.sushiswapFactory,
            UNISWAP_V2_FACTORY_ABI,
            provider
        );
        
        // Price cache
        this.priceCache = new Map();
        this.cacheTimeout = 5000; // 5 seconds
    }
    
    /**
     * Fetch prices for a token from all DEXes
     */
    async fetchPrices(tokenAddress) {
        const cacheKey = `${tokenAddress}_${Date.now()}`;
        
        // Check cache
        if (this.priceCache.has(tokenAddress)) {
            const cached = this.priceCache.get(tokenAddress);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.prices;
            }
        }
        
        const prices = {};
        const wethAddress = this.config.tokens.weth;
        
        try {
            // Fetch from Uniswap V2
            prices.uniswapV2 = await this.getUniswapV2Price(
                tokenAddress,
                wethAddress
            );
            
            // Fetch from SushiSwap
            prices.sushiswap = await this.getSushiSwapPrice(
                tokenAddress,
                wethAddress
            );
            
            // Fetch from Uniswap V3
            prices.uniswapV3 = await this.getUniswapV3Price(
                tokenAddress,
                wethAddress
            );
            
            // Cache the prices
            this.priceCache.set(tokenAddress, {
                prices,
                timestamp: Date.now()
            });
            
            logger.debug(`Prices fetched for ${tokenAddress}:`, prices);
            
            return prices;
            
        } catch (error) {
            logger.error('Error fetching prices:', error);
            return null;
        }
    }
    
    /**
     * Get price from Uniswap V2
     */
    async getUniswapV2Price(tokenAddress, wethAddress) {
        try {
            const pairAddress = await this.uniswapV2Factory.getPair(
                tokenAddress,
                wethAddress
            );
            
            if (pairAddress === ethers.constants.AddressZero) {
                return null;
            }
            
            const pairContract = new ethers.Contract(
                pairAddress,
                UNISWAP_V2_PAIR_ABI,
                this.provider
            );
            
            const [reserve0, reserve1] = await pairContract.getReserves();
            const token0 = await pairContract.token0();
            
            let price;
            if (token0.toLowerCase() === tokenAddress.toLowerCase()) {
                price = reserve1.div(reserve0);
            } else {
                price = reserve0.div(reserve1);
            }
            
            return parseFloat(ethers.utils.formatEther(price));
            
        } catch (error) {
            logger.debug('Error getting Uniswap V2 price:', error.message);
            return null;
        }
    }
    
    /**
     * Get price from SushiSwap
     */
    async getSushiSwapPrice(tokenAddress, wethAddress) {
        try {
            const pairAddress = await this.sushiswapFactory.getPair(
                tokenAddress,
                wethAddress
            );
            
            if (pairAddress === ethers.constants.AddressZero) {
                return null;
            }
            
            const pairContract = new ethers.Contract(
                pairAddress,
                UNISWAP_V2_PAIR_ABI,
                this.provider
            );
            
            const [reserve0, reserve1] = await pairContract.getReserves();
            const token0 = await pairContract.token0();
            
            let price;
            if (token0.toLowerCase() === tokenAddress.toLowerCase()) {
                price = reserve1.div(reserve0);
            } else {
                price = reserve0.div(reserve1);
            }
            
            return parseFloat(ethers.utils.formatEther(price));
            
        } catch (error) {
            logger.debug('Error getting SushiSwap price:', error.message);
            return null;
        }
    }
    
    /**
     * Get price from Uniswap V3
     */
    async getUniswapV3Price(tokenAddress, wethAddress) {
        try {
            const quoterContract = new ethers.Contract(
                this.config.dexes.uniswapV3Quoter,
                UNISWAP_V3_QUOTER_ABI,
                this.provider
            );
            
            const amountIn = ethers.utils.parseEther('1');
            
            const amountOut = await quoterContract.callStatic.quoteExactInputSingle(
                tokenAddress,
                wethAddress,
                3000, // 0.3% fee tier
                amountIn,
                0
            );
            
            return parseFloat(ethers.utils.formatEther(amountOut));
            
        } catch (error) {
            logger.debug('Error getting Uniswap V3 price:', error.message);
            return null;
        }
    }
    
    /**
     * Get token decimals
     */
    async getTokenDecimals(tokenAddress) {
        const tokenContract = new ethers.Contract(
            tokenAddress,
            ['function decimals() view returns (uint8)'],
            this.provider
        );
        
        return await tokenContract.decimals();
    }
    
    /**
     * Clear price cache
     */
    clearCache() {
        this.priceCache.clear();
    }
}

module.exports = PriceFetcher;

