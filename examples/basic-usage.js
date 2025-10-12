/**
 * Basic Usage Example
 * 
 * This example demonstrates the basic setup and usage of the MEV Arbitrage Bot
 */

require('dotenv').config();
const { ethers } = require('ethers');
const ArbitrageBot = require('../src/bot/ArbitrageBot');
const config = require('../src/config/config');
const logger = require('../src/utils/logger');

async function main() {
    console.log('🚀 MEV Arbitrage Bot - Basic Usage Example\n');
    
    // 1. Setup provider and wallet
    console.log('Step 1: Setting up connection to Ethereum...');
    const provider = new ethers.providers.WebSocketProvider(config.network.wssUrl);
    const wallet = new ethers.Wallet(config.wallet.privateKey, provider);
    
    console.log(`✅ Connected to Ethereum (Chain ID: ${config.network.chainId})`);
    console.log(`✅ Wallet: ${wallet.address}`);
    
    // 2. Check wallet balance
    console.log('\nStep 2: Checking wallet balance...');
    const balance = await wallet.getBalance();
    console.log(`💰 Balance: ${ethers.utils.formatEther(balance)} ETH`);
    
    if (balance.lt(ethers.utils.parseEther('0.1'))) {
        console.error('⚠️  Warning: Low balance! Consider adding more ETH for gas fees.');
    }
    
    // 3. Initialize the bot
    console.log('\nStep 3: Initializing bot...');
    const bot = new ArbitrageBot(wallet, provider, config);
    console.log('✅ Bot initialized');
    
    // 4. Start the bot
    console.log('\nStep 4: Starting bot...');
    await bot.start();
    
    console.log('\n✅ Bot is now running!');
    console.log('💡 Monitoring for arbitrage opportunities...');
    console.log('📊 Statistics will be logged periodically');
    console.log('\n⏹️  Press Ctrl+C to stop the bot\n');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n\n⏹️  Shutting down bot...');
        await bot.stop();
        console.log('✅ Bot stopped successfully');
        process.exit(0);
    });
}

// Run the example
main().catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
});

