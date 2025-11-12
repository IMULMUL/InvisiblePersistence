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
        
        // Initialize DEX contracts based on chain configuration
        this.dexContracts = {};
        this.dexConfig = config.dexesFull || {};
        
        // Initialize factory contracts for all DEXes
        Object.keys(this.dexConfig).forEach(dexKey => {
            const dex = this.dexConfig[dexKey];
            if (dex.factory) {
                this.dexContracts[dexKey] = {
                    factory: new ethers.Contract(
                        dex.factory,
                        UNISWAP_V2_FACTORY_ABI,
                        provider
                    ),
                    router: dex.router,
                    quoter: dex.quoter,
                    name: dex.name
                };
            }
        });
        
        // For backward compatibility, also support old structure
        if (config.dexes.uniswapV2Factory) {
            if (!this.dexContracts.uniswapV2) {
                this.dexContracts.uniswapV2 = {
                    factory: new ethers.Contract(
                        config.dexes.uniswapV2Factory,
                        UNISWAP_V2_FACTORY_ABI,
                        provider
                    ),
                    router: config.dexes.uniswapV2Router,
                    name: 'Uniswap V2'
                };
            }
        }
        
        if (config.dexes.sushiswapFactory) {
            if (!this.dexContracts.sushiswap) {
                this.dexContracts.sushiswap = {
                    factory: new ethers.Contract(
                        config.dexes.sushiswapFactory,
                        UNISWAP_V2_FACTORY_ABI,
                        provider
                    ),
                    router: config.dexes.sushiswapRouter,
                    name: 'SushiSwap'
                };
            }
        }
        
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
        const wrappedNativeAddress = this.config.tokens.wrappedNative || this.config.tokens.weth;
        
        try {
            // Fetch prices from all available DEXes
            for (const [dexKey, dexContract] of Object.entries(this.dexContracts)) {
                try {
                    if (dexContract.quoter) {
                        // Uniswap V3 style (has quoter)
                        prices[dexKey] = await this.getUniswapV3StylePrice(
                            tokenAddress,
                            wrappedNativeAddress,
                            dexContract.quoter
                        );
                    } else if (dexContract.factory) {
                        // Uniswap V2 style (has factory)
                        prices[dexKey] = await this.getUniswapV2StylePrice(
                            tokenAddress,
                            wrappedNativeAddress,
                            dexContract.factory
                        );
                    }
                } catch (error) {
                    logger.debug(`Error fetching price from ${dexKey}:`, error.message);
                    prices[dexKey] = null;
                }
            }
            
            // For backward compatibility, also try old methods
            if (!prices.uniswapV2 && this.config.dexes.uniswapV2Factory) {
                prices.uniswapV2 = await this.getUniswapV2Price(
                    tokenAddress,
                    wrappedNativeAddress
                );
            }
            
            if (!prices.sushiswap && this.config.dexes.sushiswapFactory) {
                prices.sushiswap = await this.getSushiSwapPrice(
                    tokenAddress,
                    wrappedNativeAddress
                );
            }
            
            if (!prices.uniswapV3 && this.config.dexes.uniswapV3Quoter) {
                prices.uniswapV3 = await this.getUniswapV3Price(
                    tokenAddress,
                    wrappedNativeAddress
                );
            }
            
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
     * Get price from Uniswap V3 style DEX (PancakeSwap V3, etc.)
     */
    async getUniswapV3StylePrice(tokenAddress, wrappedNativeAddress, quoterAddress) {
        try {
            const quoterContract = new ethers.Contract(
                quoterAddress,
                UNISWAP_V3_QUOTER_ABI,
                this.provider
            );
            
            const amountIn = ethers.utils.parseEther('1');
            
            // Try common fee tiers: 500 (0.05%), 2500 (0.25%), 3000 (0.3%), 10000 (1%)
            const feeTiers = [500, 2500, 3000, 10000];
            
            for (const fee of feeTiers) {
                try {
                    const amountOut = await quoterContract.callStatic.quoteExactInputSingle(
                        tokenAddress,
                        wrappedNativeAddress,
                        fee,
                        amountIn,
                        0
                    );
                    
                    return parseFloat(ethers.utils.formatEther(amountOut));
                } catch (error) {
                    // Try next fee tier
                    continue;
                }
            }
            
            return null;
            
        } catch (error) {
            logger.debug('Error getting Uniswap V3 style price:', error.message);
            return null;
        }
    }
    
    /**
     * Get price from Uniswap V2 style DEX (PancakeSwap V2, Biswap, etc.)
     */
    async getUniswapV2StylePrice(tokenAddress, wrappedNativeAddress, factoryContract) {
        try {
            const pairAddress = await factoryContract.getPair(
                tokenAddress,
                wrappedNativeAddress
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
            logger.debug('Error getting Uniswap V2 style price:', error.message);
            return null;
        }
    }
    
    /**
     * Get price from Uniswap V3 (backward compatibility)
     */
    async getUniswapV3Price(tokenAddress, wethAddress) {
        if (!this.config.dexes.uniswapV3Quoter) {
            return null;
        }
        
        return await this.getUniswapV3StylePrice(
            tokenAddress,
            wethAddress,
            this.config.dexes.uniswapV3Quoter
        );
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

