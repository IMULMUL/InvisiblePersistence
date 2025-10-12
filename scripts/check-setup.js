/**
 * Setup Verification Script
 * 
 * This script checks if the bot is properly configured and ready to run
 */

require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const config = require('../src/config/config');

console.log('🔍 MEV Arbitrage Bot - Setup Verification\n');
console.log('═'.repeat(60));

let errors = [];
let warnings = [];
let checks = 0;
let passed = 0;

function check(name, condition, errorMsg, warnMsg = null) {
    checks++;
    if (condition) {
        console.log(`✅ ${name}`);
        passed++;
        return true;
    } else {
        if (warnMsg) {
            console.log(`⚠️  ${name}: ${warnMsg}`);
            warnings.push(warnMsg);
        } else {
            console.log(`❌ ${name}: ${errorMsg}`);
            errors.push(errorMsg);
        }
        return false;
    }
}

async function verifySetup() {
    // 1. Environment Variables
    console.log('\n📋 Environment Variables');
    console.log('─'.repeat(60));
    
    check(
        'ETHEREUM_RPC_URL',
        !!process.env.ETHEREUM_RPC_URL,
        'RPC URL not set'
    );
    
    check(
        'ETHEREUM_WSS_URL',
        !!process.env.ETHEREUM_WSS_URL,
        'WebSocket URL not set'
    );
    
    check(
        'PRIVATE_KEY',
        !!process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 64,
        'Private key not set or invalid length'
    );
    
    check(
        'WALLET_ADDRESS',
        !!process.env.WALLET_ADDRESS && ethers.utils.isAddress(process.env.WALLET_ADDRESS),
        'Wallet address not set or invalid'
    );
    
    // 2. Network Connectivity
    console.log('\n🌐 Network Connectivity');
    console.log('─'.repeat(60));
    
    try {
        const provider = new ethers.providers.JsonRpcProvider(config.network.rpcUrl);
        const network = await provider.getNetwork();
        check(
            'RPC Connection',
            network.chainId === config.network.chainId,
            `Connected to wrong network (Chain ID: ${network.chainId})`
        );
        
        const blockNumber = await provider.getBlockNumber();
        check(
            'Block Number',
            blockNumber > 0,
            'Unable to fetch block number'
        );
        console.log(`   Current block: ${blockNumber}`);
    } catch (error) {
        check('RPC Connection', false, error.message);
    }
    
    // 3. Wallet Status
    console.log('\n💰 Wallet Status');
    console.log('─'.repeat(60));
    
    try {
        const provider = new ethers.providers.JsonRpcProvider(config.network.rpcUrl);
        const wallet = new ethers.Wallet(config.wallet.privateKey, provider);
        
        const balance = await wallet.getBalance();
        const balanceETH = parseFloat(ethers.utils.formatEther(balance));
        
        console.log(`   Address: ${wallet.address}`);
        console.log(`   Balance: ${balanceETH.toFixed(4)} ETH`);
        
        check(
            'Wallet Balance',
            balanceETH >= 0.1,
            'Insufficient balance for gas fees (< 0.1 ETH)',
            balanceETH < 0.5 ? 'Low balance, consider adding more ETH' : null
        );
    } catch (error) {
        check('Wallet Setup', false, error.message);
    }
    
    // 4. Smart Contract
    console.log('\n📜 Smart Contract');
    console.log('─'.repeat(60));
    
    const contractAddress = process.env.ARBITRAGE_CONTRACT_ADDRESS;
    
    if (contractAddress && ethers.utils.isAddress(contractAddress)) {
        try {
            const provider = new ethers.providers.JsonRpcProvider(config.network.rpcUrl);
            const code = await provider.getCode(contractAddress);
            
            check(
                'Contract Deployed',
                code !== '0x',
                'Contract not deployed at specified address'
            );
            
            console.log(`   Address: ${contractAddress}`);
        } catch (error) {
            check('Contract Verification', false, error.message);
        }
    } else {
        check(
            'Contract Address',
            false,
            'Contract address not set or invalid - Deploy contract first'
        );
    }
    
    // 5. Dependencies
    console.log('\n📦 Dependencies');
    console.log('─'.repeat(60));
    
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const dependencies = Object.keys(packageJson.dependencies);
    
    check(
        'Dependencies Installed',
        fs.existsSync('./node_modules') && dependencies.length > 0,
        'Dependencies not installed - Run: npm install'
    );
    
    // 6. Configuration
    console.log('\n⚙️  Configuration');
    console.log('─'.repeat(60));
    
    check(
        'Min Profit Threshold',
        config.bot.minProfitThreshold > 0 && config.bot.minProfitThreshold < 1,
        'Invalid min profit threshold'
    );
    
    check(
        'Max Gas Price',
        config.bot.maxGasPrice > 0 && config.bot.maxGasPrice < 1000,
        'Invalid max gas price'
    );
    
    check(
        'Check Interval',
        config.bot.checkInterval >= 100,
        'Check interval too low (min 100ms)'
    );
    
    console.log(`   Min Profit: ${config.bot.minProfitThreshold} ETH`);
    console.log(`   Max Gas: ${config.bot.maxGasPrice} gwei`);
    console.log(`   Interval: ${config.bot.checkInterval}ms`);
    
    // 7. Telegram (Optional)
    console.log('\n📱 Telegram Bot (Optional)');
    console.log('─'.repeat(60));
    
    if (config.telegram.enabled) {
        check(
            'Telegram Token',
            !!config.telegram.botToken,
            'Telegram bot token not set'
        );
        
        check(
            'Telegram Chat ID',
            !!config.telegram.chatId,
            'Telegram chat ID not set'
        );
    } else {
        console.log('   Telegram notifications disabled');
    }
    
    // 8. Logs Directory
    console.log('\n📝 Logging');
    console.log('─'.repeat(60));
    
    check(
        'Logs Directory',
        fs.existsSync('./logs'),
        'Logs directory not found - Will be created automatically'
    );
    
    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 Summary');
    console.log('═'.repeat(60));
    console.log(`Total Checks: ${checks}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${errors.length}`);
    console.log(`⚠️  Warnings: ${warnings.length}`);
    
    if (errors.length > 0) {
        console.log('\n❌ Critical Errors:');
        errors.forEach((error, i) => {
            console.log(`   ${i + 1}. ${error}`);
        });
    }
    
    if (warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        warnings.forEach((warning, i) => {
            console.log(`   ${i + 1}. ${warning}`);
        });
    }
    
    console.log('\n' + '═'.repeat(60));
    
    if (errors.length === 0) {
        console.log('✅ Setup verification complete! Bot is ready to run.');
        console.log('\nTo start the bot, run: npm start');
        return true;
    } else {
        console.log('❌ Setup verification failed. Please fix the errors above.');
        console.log('\nFor help, see: docs/SETUP.md');
        return false;
    }
}

verifySetup().then((success) => {
    process.exit(success ? 0 : 1);
}).catch((error) => {
    console.error('\n❌ Verification error:', error);
    process.exit(1);
});

