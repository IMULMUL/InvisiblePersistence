/**
 * Manual Trade Example
 * 
 * This example demonstrates how to manually execute an arbitrage trade
 */

require('dotenv').config();
const { ethers } = require('ethers');
const PriceFetcher = require('../src/services/PriceFetcher');
const GasEstimator = require('../src/services/GasEstimator');
const ProfitCalculator = require('../src/services/ProfitCalculator');
const config = require('../src/config/config');

async function main() {
    console.log('🔍 Manual Trade Example - Finding Arbitrage Opportunities\n');
    
    // Setup
    const provider = new ethers.providers.JsonRpcProvider(config.network.rpcUrl);
    const priceFetcher = new PriceFetcher(provider, config);
    const gasEstimator = new GasEstimator(provider);
    const profitCalculator = new ProfitCalculator(config);
    
    // Token to check (WETH in this example)
    const tokenAddress = config.tokens.weth;
    const tokenName = 'WETH';
    
    console.log(`Checking arbitrage opportunities for ${tokenName}...`);
    console.log(`Token: ${tokenAddress}\n`);
    
    // 1. Fetch prices from all DEXes
    console.log('Step 1: Fetching prices from DEXes...');
    const prices = await priceFetcher.fetchPrices(tokenAddress);
    
    if (!prices) {
        console.error('❌ Failed to fetch prices');
        return;
    }
    
    console.log('\nPrices:');
    for (const [dex, price] of Object.entries(prices)) {
        if (price !== null) {
            console.log(`  ${dex}: $${price.toFixed(2)}`);
        }
    }
    
    // 2. Find arbitrage opportunity
    console.log('\nStep 2: Analyzing for arbitrage opportunities...');
    
    let bestBuy = { dex: null, price: Infinity };
    let bestSell = { dex: null, price: 0 };
    
    for (const [dex, price] of Object.entries(prices)) {
        if (price === null) continue;
        
        if (price < bestBuy.price) {
            bestBuy = { dex, price };
        }
        if (price > bestSell.price) {
            bestSell = { dex, price };
        }
    }
    
    if (bestBuy.dex && bestSell.dex && bestBuy.dex !== bestSell.dex) {
        const profitPercentage = ((bestSell.price - bestBuy.price) / bestBuy.price) * 100;
        
        console.log('\n🎯 Arbitrage Opportunity Found!');
        console.log(`  Buy on:  ${bestBuy.dex} @ $${bestBuy.price.toFixed(2)}`);
        console.log(`  Sell on: ${bestSell.dex} @ $${bestSell.price.toFixed(2)}`);
        console.log(`  Gross Profit: ${profitPercentage.toFixed(4)}%`);
        
        // 3. Check if profitable after fees
        console.log('\nStep 3: Calculating profitability...');
        
        const gasPrice = await gasEstimator.estimateGasPrice();
        console.log(`  Gas Price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);
        
        const opportunity = {
            token: tokenAddress,
            buyDex: bestBuy.dex,
            sellDex: bestSell.dex,
            buyPrice: bestBuy.price,
            sellPrice: bestSell.price,
            profitPercentage,
            timestamp: Date.now()
        };
        
        const isProfitable = await profitCalculator.isProfitable(opportunity, gasPrice);
        
        if (isProfitable) {
            console.log('\n✅ PROFITABLE TRADE!');
            console.log('  This trade would be profitable after all fees.');
            console.log('\n  To execute this trade:');
            console.log('  1. Ensure your smart contract is deployed');
            console.log('  2. Run the bot with: npm start');
            console.log('  3. The bot will automatically detect and execute this opportunity');
        } else {
            console.log('\n❌ NOT PROFITABLE');
            console.log('  After accounting for fees and gas, this trade would result in a loss.');
        }
    } else {
        console.log('\n❌ No arbitrage opportunity found');
        console.log('  Prices are currently aligned across DEXes.');
    }
    
    console.log('\n✅ Analysis complete');
}

main().catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
});

