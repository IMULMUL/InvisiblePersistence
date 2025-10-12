/**
 * Ethereum MEV Arbitrage Bot - Main Entry Point
 * 
 * This bot monitors multiple DEXes for arbitrage opportunities and executes
 * profitable trades using flashloans from Aave.
 */

require('dotenv').config();
const { ethers } = require('ethers');
const ArbitrageBot = require('./bot/ArbitrageBot');
const logger = require('./utils/logger');
const config = require('./config/config');

/**
 * Initialize and start the arbitrage bot
 */
async function main() {
    try {
        logger.info('🚀 Starting Ethereum MEV Arbitrage Bot...');
        logger.info(`📡 Network: ${config.network.chainId === 1 ? 'Mainnet' : 'Testnet'}`);
        logger.info(`💼 Wallet: ${config.wallet.address}`);
        
        // Create provider
        const provider = new ethers.providers.WebSocketProvider(
            config.network.wssUrl
        );
        
        // Create wallet
        const wallet = new ethers.Wallet(config.wallet.privateKey, provider);
        
        logger.info(`💰 Wallet Balance: ${ethers.utils.formatEther(await wallet.getBalance())} ETH`);
        
        // Initialize bot
        const bot = new ArbitrageBot(wallet, provider, config);
        
        // Start monitoring
        await bot.start();
        
        logger.info('✅ Bot is running and monitoring for opportunities...');
        
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            logger.info('⏹️  Shutting down bot...');
            await bot.stop();
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            logger.info('⏹️  Shutting down bot...');
            await bot.stop();
            process.exit(0);
        });
        
    } catch (error) {
        logger.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

// Start the bot
main().catch((error) => {
    logger.error('❌ Unhandled error:', error);
    process.exit(1);
});

