/**
 * Configuration file for MEV Arbitrage Bot
 */

require('dotenv').config();

module.exports = {
    // Network configuration
    network: {
        rpcUrl: process.env.ETHEREUM_RPC_URL,
        wssUrl: process.env.ETHEREUM_WSS_URL,
        chainId: parseInt(process.env.CHAIN_ID) || 1
    },
    
    // Wallet configuration
    wallet: {
        privateKey: process.env.PRIVATE_KEY,
        address: process.env.WALLET_ADDRESS
    },
    
    // Contract addresses
    contracts: {
        arbitrageContract: process.env.ARBITRAGE_CONTRACT_ADDRESS,
        aaveLendingPool: process.env.AAVE_LENDING_POOL || '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9'
    },
    
    // DEX configuration
    dexes: {
        uniswapV2Router: process.env.UNISWAP_V2_ROUTER || '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        uniswapV2Factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
        uniswapV3Router: process.env.UNISWAP_V3_ROUTER || '0xE592427A0AEce92De3Edee1F18E0157C05861564',
        uniswapV3Quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
        sushiswapRouter: process.env.SUSHISWAP_ROUTER || '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
        sushiswapFactory: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac'
    },
    
    // Token configuration
    tokens: {
        weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        dai: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        watchlist: [
            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
            '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
            '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
            '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
            '0x514910771AF9Ca656af840dff83E8264EcF986CA'  // LINK
        ]
    },
    
    // Bot configuration
    bot: {
        minProfitThreshold: parseFloat(process.env.MIN_PROFIT_THRESHOLD) || 0.01,
        maxGasPrice: parseInt(process.env.MAX_GAS_PRICE) || 100,
        slippageTolerance: parseFloat(process.env.SLIPPAGE_TOLERANCE) || 0.5,
        checkInterval: parseInt(process.env.CHECK_INTERVAL) || 1000,
        maxTradeSize: parseFloat(process.env.MAX_TRADE_SIZE) || 10,
        enableMempoolMonitoring: process.env.ENABLE_MEMPOOL_MONITORING === 'true'
    },
    
    // Telegram configuration
    telegram: {
        enabled: !!process.env.TELEGRAM_BOT_TOKEN,
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID
    },
    
    // Logging configuration
    logging: {
        enabled: process.env.ENABLE_LOGGING !== 'false',
        level: process.env.LOG_LEVEL || 'info'
    }
};

