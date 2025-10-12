/**
 * Price Monitoring Example
 * 
 * This example demonstrates how to monitor prices across multiple DEXes
 */

require('dotenv').config();
const { ethers } = require('ethers');
const PriceFetcher = require('../src/services/PriceFetcher');
const config = require('../src/config/config');

// Token names for display
const TOKEN_NAMES = {
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 'WETH',
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': 'USDC',
    '0x6B175474E89094C44Da98b954EedeAC495271d0F': 'DAI',
    '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': 'WBTC',
    '0x514910771AF9Ca656af840dff83E8264EcF986CA': 'LINK'
};

async function monitorPrices() {
    console.log('📊 Real-time Price Monitoring\n');
    console.log('Press Ctrl+C to stop\n');
    
    const provider = new ethers.providers.JsonRpcProvider(config.network.rpcUrl);
    const priceFetcher = new PriceFetcher(provider, config);
    
    const tokens = config.tokens.watchlist;
    
    // Monitor prices every 5 seconds
    setInterval(async () => {
        console.clear();
        console.log('📊 Real-time Price Monitoring');
        console.log('═'.repeat(80));
        console.log(`Updated: ${new Date().toLocaleTimeString()}\n`);
        
        for (const token of tokens) {
            const tokenName = TOKEN_NAMES[token] || 'Unknown';
            
            try {
                const prices = await priceFetcher.fetchPrices(token);
                
                if (prices) {
                    console.log(`${tokenName} (${token.substring(0, 10)}...)`);
                    console.log('─'.repeat(80));
                    
                    // Display prices
                    const priceEntries = Object.entries(prices).filter(([_, price]) => price !== null);
                    
                    if (priceEntries.length > 0) {
                        // Find min and max prices
                        let minPrice = Infinity;
                        let maxPrice = 0;
                        
                        for (const [dex, price] of priceEntries) {
                            if (price < minPrice) minPrice = price;
                            if (price > maxPrice) maxPrice = price;
                        }
                        
                        // Calculate spread
                        const spread = maxPrice - minPrice;
                        const spreadPercent = (spread / minPrice) * 100;
                        
                        // Display each DEX price
                        for (const [dex, price] of priceEntries) {
                            const isLowest = price === minPrice;
                            const isHighest = price === maxPrice;
                            const indicator = isLowest ? '🟢 LOW ' : isHighest ? '🔴 HIGH' : '⚪     ';
                            
                            console.log(`  ${indicator} ${dex.padEnd(15)} $${price.toFixed(6)}`);
                        }
                        
                        console.log(`\n  Spread: $${spread.toFixed(6)} (${spreadPercent.toFixed(4)}%)`);
                        
                        // Highlight arbitrage opportunities
                        if (spreadPercent > 0.5) {
                            console.log(`  💎 ARBITRAGE OPPORTUNITY!`);
                        }
                    } else {
                        console.log('  No prices available');
                    }
                    
                    console.log('');
                }
            } catch (error) {
                console.log(`${tokenName}: Error fetching prices`);
                console.log('');
            }
        }
        
        console.log('═'.repeat(80));
        console.log('Press Ctrl+C to stop monitoring');
    }, 5000);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n✅ Monitoring stopped');
    process.exit(0);
});

monitorPrices().catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
});

