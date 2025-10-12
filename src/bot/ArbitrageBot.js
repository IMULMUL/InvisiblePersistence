/**
 * ArbitrageBot - Core bot implementation
 * 
 * Monitors DEX prices, calculates arbitrage opportunities,
 * and executes profitable trades using flashloans
 */

const { ethers } = require('ethers');
const BigNumber = require('bignumber.js');
const cron = require('node-cron');

const PriceFetcher = require('../services/PriceFetcher');
const GasEstimator = require('../services/GasEstimator');
const ProfitCalculator = require('../services/ProfitCalculator');
const TelegramNotifier = require('../services/TelegramNotifier');
const logger = require('../utils/logger');

const ARBITRAGE_ABI = require('../abis/FlashloanArbitrage.json');

class ArbitrageBot {
    constructor(wallet, provider, config) {
        this.wallet = wallet;
        this.provider = provider;
        this.config = config;
        
        // Initialize services
        this.priceFetcher = new PriceFetcher(provider, config);
        this.gasEstimator = new GasEstimator(provider);
        this.profitCalculator = new ProfitCalculator(config);
        this.telegramNotifier = new TelegramNotifier(config);
        
        // Initialize contract
        this.arbitrageContract = new ethers.Contract(
            config.contracts.arbitrageContract,
            ARBITRAGE_ABI,
            wallet
        );
        
        // State
        this.isRunning = false;
        this.opportunities = [];
        this.executedTrades = [];
        
        // Statistics
        this.stats = {
            totalOpportunities: 0,
            executedTrades: 0,
            successfulTrades: 0,
            failedTrades: 0,
            totalProfit: new BigNumber(0),
            totalGasSpent: new BigNumber(0)
        };
    }
    
    /**
     * Start the bot
     */
    async start() {
        if (this.isRunning) {
            logger.warn('Bot is already running');
            return;
        }
        
        this.isRunning = true;
        logger.info('🤖 ArbitrageBot started');
        
        // Start monitoring
        this.startMonitoring();
        
        // Schedule periodic tasks
        this.schedulePeriodicTasks();
        
        // Send startup notification
        await this.telegramNotifier.sendMessage(
            '🚀 MEV Arbitrage Bot Started!\n' +
            `Network: ${this.config.network.chainId}\n` +
            `Min Profit: ${this.config.bot.minProfitThreshold} ETH`
        );
    }
    
    /**
     * Stop the bot
     */
    async stop() {
        this.isRunning = false;
        logger.info('🛑 ArbitrageBot stopped');
        
        await this.telegramNotifier.sendMessage(
            '⏹️ MEV Arbitrage Bot Stopped\n' +
            this.getStatsMessage()
        );
    }
    
    /**
     * Start monitoring for arbitrage opportunities
     */
    startMonitoring() {
        logger.info('👀 Starting price monitoring...');
        
        // Monitor every N milliseconds
        setInterval(async () => {
            try {
                await this.scanForOpportunities();
            } catch (error) {
                logger.error('Error scanning for opportunities:', error);
            }
        }, this.config.bot.checkInterval);
        
        // Monitor mempool if enabled
        if (this.config.bot.enableMempoolMonitoring) {
            this.startMempoolMonitoring();
        }
    }
    
    /**
     * Scan for arbitrage opportunities
     */
    async scanForOpportunities() {
        const tokens = this.config.tokens.watchlist;
        
        for (const token of tokens) {
            try {
                // Fetch prices from multiple DEXes
                const prices = await this.priceFetcher.fetchPrices(token);
                
                // Find arbitrage opportunities
                const opportunity = this.findArbitrageOpportunity(token, prices);
                
                if (opportunity) {
                    this.stats.totalOpportunities++;
                    logger.info('💎 Arbitrage opportunity found!', opportunity);
                    
                    // Calculate if profitable after gas
                    const isProfitable = await this.profitCalculator.isProfitable(
                        opportunity,
                        await this.gasEstimator.estimateGasPrice()
                    );
                    
                    if (isProfitable) {
                        await this.executeArbitrage(opportunity);
                    } else {
                        logger.debug('Opportunity not profitable after gas fees');
                    }
                }
            } catch (error) {
                logger.error(`Error processing token ${token}:`, error);
            }
        }
    }
    
    /**
     * Find arbitrage opportunity from price data
     */
    findArbitrageOpportunity(token, prices) {
        // Find lowest and highest prices
        let lowestPrice = Infinity;
        let highestPrice = 0;
        let buyDex = null;
        let sellDex = null;
        
        for (const [dex, price] of Object.entries(prices)) {
            if (price < lowestPrice) {
                lowestPrice = price;
                buyDex = dex;
            }
            if (price > highestPrice) {
                highestPrice = price;
                sellDex = dex;
            }
        }
        
        // Calculate profit percentage
        const profitPercentage = ((highestPrice - lowestPrice) / lowestPrice) * 100;
        
        // Check if profitable
        const minProfit = this.config.bot.minProfitThreshold;
        if (profitPercentage > minProfit) {
            return {
                token,
                buyDex,
                sellDex,
                buyPrice: lowestPrice,
                sellPrice: highestPrice,
                profitPercentage,
                timestamp: Date.now()
            };
        }
        
        return null;
    }
    
    /**
     * Execute arbitrage trade
     */
    async executeArbitrage(opportunity) {
        logger.info('⚡ Executing arbitrage...', opportunity);
        this.stats.executedTrades++;
        
        try {
            // Calculate optimal trade amount
            const tradeAmount = await this.calculateOptimalTradeAmount(opportunity);
            
            // Get DEX router addresses
            const routers = this.getRouterAddresses(opportunity);
            
            // Encode parameters for flashloan
            const params = this.encodeArbitrageParams(opportunity, routers);
            
            // Get current gas price
            const gasPrice = await this.gasEstimator.estimateGasPrice();
            
            // Execute flashloan arbitrage
            const tx = await this.arbitrageContract.executeArbitrage(
                opportunity.token,
                ethers.utils.parseEther(tradeAmount.toString()),
                params,
                {
                    gasPrice: gasPrice,
                    gasLimit: 500000
                }
            );
            
            logger.info(`📝 Transaction submitted: ${tx.hash}`);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            
            if (receipt.status === 1) {
                this.stats.successfulTrades++;
                logger.info('✅ Arbitrage executed successfully!');
                
                // Parse profit from events
                const profit = this.parseProfit(receipt);
                this.stats.totalProfit = this.stats.totalProfit.plus(profit);
                
                // Calculate gas spent
                const gasSpent = receipt.gasUsed.mul(receipt.effectiveGasPrice);
                this.stats.totalGasSpent = this.stats.totalGasSpent.plus(
                    gasSpent.toString()
                );
                
                // Send notification
                await this.telegramNotifier.sendMessage(
                    `✅ Successful Arbitrage!\n` +
                    `Token: ${opportunity.token}\n` +
                    `Profit: ${ethers.utils.formatEther(profit)} ETH\n` +
                    `Gas: ${ethers.utils.formatEther(gasSpent)} ETH\n` +
                    `Tx: ${tx.hash}`
                );
                
                // Store trade
                this.executedTrades.push({
                    ...opportunity,
                    txHash: tx.hash,
                    profit: profit.toString(),
                    gasSpent: gasSpent.toString(),
                    success: true
                });
            } else {
                throw new Error('Transaction failed');
            }
            
        } catch (error) {
            this.stats.failedTrades++;
            logger.error('❌ Arbitrage execution failed:', error);
            
            await this.telegramNotifier.sendMessage(
                `❌ Failed Arbitrage\n` +
                `Token: ${opportunity.token}\n` +
                `Error: ${error.message}`
            );
        }
    }
    
    /**
     * Calculate optimal trade amount based on liquidity
     */
    async calculateOptimalTradeAmount(opportunity) {
        // This is a simplified version
        // In production, you'd want to consider liquidity depth, slippage, etc.
        const maxTradeSize = new BigNumber(this.config.bot.maxTradeSize);
        
        // Start with 1 ETH worth of tokens
        let optimalAmount = new BigNumber(1);
        
        // Don't exceed max trade size
        if (optimalAmount.gt(maxTradeSize)) {
            optimalAmount = maxTradeSize;
        }
        
        return optimalAmount.toFixed(18);
    }
    
    /**
     * Get router addresses for DEXes
     */
    getRouterAddresses(opportunity) {
        const dexConfig = this.config.dexes;
        
        return {
            buyRouter: dexConfig[opportunity.buyDex],
            sellRouter: dexConfig[opportunity.sellDex]
        };
    }
    
    /**
     * Encode parameters for flashloan callback
     */
    encodeArbitrageParams(opportunity, routers) {
        const path = [
            opportunity.token,
            this.config.tokens.weth,
            opportunity.token
        ];
        
        const routerAddresses = [
            routers.buyRouter,
            routers.sellRouter
        ];
        
        const fees = [3000, 3000]; // 0.3% fee tier for Uniswap V3
        
        return ethers.utils.defaultAbiCoder.encode(
            ['address[]', 'address[]', 'uint24[]', 'bool'],
            [path, routerAddresses, fees, false]
        );
    }
    
    /**
     * Parse profit from transaction receipt
     */
    parseProfit(receipt) {
        // Find ArbitrageExecuted event
        const event = receipt.events?.find(
            e => e.event === 'ArbitrageExecuted'
        );
        
        if (event && event.args) {
            return event.args.profit;
        }
        
        return ethers.BigNumber.from(0);
    }
    
    /**
     * Start mempool monitoring for frontrunning opportunities
     */
    startMempoolMonitoring() {
        logger.info('🔍 Starting mempool monitoring...');
        
        this.provider.on('pending', async (txHash) => {
            try {
                const tx = await this.provider.getTransaction(txHash);
                
                if (tx && tx.to) {
                    // Check if transaction is a DEX swap
                    await this.analyzePendingTransaction(tx);
                }
            } catch (error) {
                // Ignore errors for pending transactions
            }
        });
    }
    
    /**
     * Analyze pending transaction for opportunities
     */
    async analyzePendingTransaction(tx) {
        // Check if transaction is interacting with known DEX routers
        const dexRouters = Object.values(this.config.dexes);
        
        if (dexRouters.includes(tx.to.toLowerCase())) {
            // This is a DEX transaction
            // Analyze for sandwich attack or frontrun opportunity
            logger.debug('DEX transaction detected:', tx.hash);
            
            // TODO: Implement sandwich attack logic
            // This requires careful consideration of MEV ethics and regulations
        }
    }
    
    /**
     * Schedule periodic tasks
     */
    schedulePeriodicTasks() {
        // Send stats every hour
        cron.schedule('0 * * * *', async () => {
            await this.telegramNotifier.sendMessage(
                '📊 Hourly Stats\n' + this.getStatsMessage()
            );
        });
        
        // Daily summary at midnight
        cron.schedule('0 0 * * *', async () => {
            await this.telegramNotifier.sendMessage(
                '📈 Daily Summary\n' + this.getStatsMessage()
            );
            
            // Reset daily stats
            this.stats.totalOpportunities = 0;
            this.stats.executedTrades = 0;
            this.stats.successfulTrades = 0;
            this.stats.failedTrades = 0;
        });
    }
    
    /**
     * Get stats message
     */
    getStatsMessage() {
        return `
Opportunities Found: ${this.stats.totalOpportunities}
Trades Executed: ${this.stats.executedTrades}
Successful: ${this.stats.successfulTrades}
Failed: ${this.stats.failedTrades}
Total Profit: ${ethers.utils.formatEther(this.stats.totalProfit.toFixed())} ETH
Total Gas: ${ethers.utils.formatEther(this.stats.totalGasSpent.toFixed())} ETH
Net Profit: ${ethers.utils.formatEther(
            this.stats.totalProfit.minus(this.stats.totalGasSpent).toFixed()
        )} ETH
        `.trim();
    }
}

module.exports = ArbitrageBot;

