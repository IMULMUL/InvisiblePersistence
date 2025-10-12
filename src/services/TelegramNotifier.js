/**
 * TelegramNotifier - Sends notifications via Telegram bot
 */

const { Telegraf } = require('telegraf');
const logger = require('../utils/logger');

class TelegramNotifier {
    constructor(config) {
        this.config = config;
        this.enabled = config.telegram?.enabled || false;
        
        if (this.enabled) {
            this.bot = new Telegraf(config.telegram.botToken);
            this.chatId = config.telegram.chatId;
            
            // Initialize bot
            this.initializeBot();
        }
    }
    
    /**
     * Initialize Telegram bot with commands
     */
    initializeBot() {
        try {
            // Start command
            this.bot.command('start', (ctx) => {
                ctx.reply('🤖 MEV Arbitrage Bot\n\nBot is active and monitoring opportunities.');
            });
            
            // Stats command
            this.bot.command('stats', (ctx) => {
                ctx.reply('📊 Fetching statistics...');
                // Stats will be sent by the bot
            });
            
            // Help command
            this.bot.command('help', (ctx) => {
                ctx.reply(
                    '📚 Available Commands:\n\n' +
                    '/start - Start the bot\n' +
                    '/stats - Get current statistics\n' +
                    '/help - Show this help message\n' +
                    '/status - Check bot status'
                );
            });
            
            // Status command
            this.bot.command('status', (ctx) => {
                ctx.reply('✅ Bot is running and monitoring for arbitrage opportunities.');
            });
            
            // Launch bot
            this.bot.launch();
            
            logger.info('✅ Telegram bot initialized');
            
        } catch (error) {
            logger.error('Error initializing Telegram bot:', error);
            this.enabled = false;
        }
    }
    
    /**
     * Send a message to Telegram
     */
    async sendMessage(message) {
        if (!this.enabled) {
            return;
        }
        
        try {
            await this.bot.telegram.sendMessage(this.chatId, message, {
                parse_mode: 'HTML'
            });
            
        } catch (error) {
            logger.error('Error sending Telegram message:', error);
        }
    }
    
    /**
     * Send a formatted opportunity alert
     */
    async sendOpportunityAlert(opportunity) {
        const message = 
            `💎 <b>New Arbitrage Opportunity!</b>\n\n` +
            `Token: <code>${opportunity.token}</code>\n` +
            `Buy: ${opportunity.buyDex} @ ${opportunity.buyPrice.toFixed(6)}\n` +
            `Sell: ${opportunity.sellDex} @ ${opportunity.sellPrice.toFixed(6)}\n` +
            `Profit: ${opportunity.profitPercentage.toFixed(2)}%\n` +
            `Time: ${new Date(opportunity.timestamp).toLocaleString()}`;
        
        await this.sendMessage(message);
    }
    
    /**
     * Send a success notification
     */
    async sendSuccessNotification(trade) {
        const message = 
            `✅ <b>Successful Arbitrage!</b>\n\n` +
            `Token: <code>${trade.token}</code>\n` +
            `Profit: ${trade.profit} ETH\n` +
            `Gas: ${trade.gasSpent} ETH\n` +
            `Net: ${(parseFloat(trade.profit) - parseFloat(trade.gasSpent)).toFixed(6)} ETH\n` +
            `TX: <a href="https://etherscan.io/tx/${trade.txHash}">View on Etherscan</a>`;
        
        await this.sendMessage(message);
    }
    
    /**
     * Send an error notification
     */
    async sendErrorNotification(error, context) {
        const message = 
            `❌ <b>Error Occurred</b>\n\n` +
            `Context: ${context}\n` +
            `Error: <code>${error.message}</code>\n` +
            `Time: ${new Date().toLocaleString()}`;
        
        await this.sendMessage(message);
    }
    
    /**
     * Send daily summary
     */
    async sendDailySummary(stats) {
        const message = 
            `📈 <b>Daily Summary</b>\n\n` +
            `Opportunities: ${stats.totalOpportunities}\n` +
            `Executed: ${stats.executedTrades}\n` +
            `Successful: ${stats.successfulTrades}\n` +
            `Failed: ${stats.failedTrades}\n` +
            `Total Profit: ${stats.totalProfit} ETH\n` +
            `Total Gas: ${stats.totalGasSpent} ETH\n` +
            `Net Profit: ${stats.netProfit} ETH`;
        
        await this.sendMessage(message);
    }
    
    /**
     * Stop the bot
     */
    stop() {
        if (this.enabled && this.bot) {
            this.bot.stop();
        }
    }
}

module.exports = TelegramNotifier;

