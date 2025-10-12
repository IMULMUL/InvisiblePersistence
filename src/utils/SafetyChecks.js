/**
 * SafetyChecks - Implements safety mechanisms and circuit breakers
 */

const { ethers } = require('ethers');
const BigNumber = require('bignumber.js');
const logger = require('./logger');

class SafetyChecks {
    constructor(config) {
        this.config = config;
        
        // Circuit breaker state
        this.circuitBreaker = {
            isTripped: false,
            consecutiveFailures: 0,
            maxFailures: 5,
            cooldownPeriod: 3600000, // 1 hour
            lastTripTime: null
        };
        
        // Rate limiting
        this.rateLimiter = {
            tradesPerHour: 0,
            maxTradesPerHour: 20,
            windowStart: Date.now()
        };
        
        // Loss tracking
        this.lossTracker = {
            consecutiveLosses: 0,
            maxConsecutiveLosses: 3,
            totalLossToday: new BigNumber(0),
            maxDailyLoss: new BigNumber(0.5) // 0.5 ETH max daily loss
        };
        
        // Position tracking
        this.positionTracker = {
            currentExposure: new BigNumber(0),
            maxExposure: new BigNumber(config.bot.maxTradeSize || 10)
        };
    }
    
    /**
     * Check if trading is allowed
     */
    isTradingAllowed() {
        // Check circuit breaker
        if (this.circuitBreaker.isTripped) {
            const cooldownElapsed = Date.now() - this.circuitBreaker.lastTripTime;
            if (cooldownElapsed < this.circuitBreaker.cooldownPeriod) {
                logger.warn('Trading disabled: Circuit breaker is tripped');
                return false;
            } else {
                // Reset circuit breaker
                this.resetCircuitBreaker();
            }
        }
        
        // Check rate limit
        if (!this.checkRateLimit()) {
            logger.warn('Trading disabled: Rate limit exceeded');
            return false;
        }
        
        // Check daily loss limit
        if (this.lossTracker.totalLossToday.gte(this.lossTracker.maxDailyLoss)) {
            logger.warn('Trading disabled: Daily loss limit reached');
            return false;
        }
        
        return true;
    }
    
    /**
     * Validate trade parameters before execution
     */
    validateTrade(opportunity, tradeAmount, gasPrice) {
        const errors = [];
        
        // Validate trade amount
        const amount = new BigNumber(tradeAmount);
        if (amount.lte(0)) {
            errors.push('Trade amount must be positive');
        }
        
        if (amount.gt(this.positionTracker.maxExposure)) {
            errors.push(`Trade amount exceeds max exposure: ${this.positionTracker.maxExposure.toString()}`);
        }
        
        // Validate gas price
        const maxGasPrice = ethers.utils.parseUnits(
            this.config.bot.maxGasPrice.toString(),
            'gwei'
        );
        
        if (gasPrice.gt(maxGasPrice)) {
            errors.push(`Gas price too high: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);
        }
        
        // Validate opportunity freshness
        const age = Date.now() - opportunity.timestamp;
        if (age > 5000) { // 5 seconds
            errors.push('Opportunity too old');
        }
        
        // Validate profit percentage
        if (opportunity.profitPercentage < this.config.bot.minProfitThreshold) {
            errors.push('Profit below minimum threshold');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Check rate limit
     */
    checkRateLimit() {
        const now = Date.now();
        const windowElapsed = now - this.rateLimiter.windowStart;
        
        // Reset window if hour has passed
        if (windowElapsed >= 3600000) {
            this.rateLimiter.tradesPerHour = 0;
            this.rateLimiter.windowStart = now;
        }
        
        return this.rateLimiter.tradesPerHour < this.rateLimiter.maxTradesPerHour;
    }
    
    /**
     * Record successful trade
     */
    recordSuccess(profit) {
        // Reset consecutive failures
        this.circuitBreaker.consecutiveFailures = 0;
        this.lossTracker.consecutiveLosses = 0;
        
        // Increment trade count
        this.rateLimiter.tradesPerHour++;
        
        logger.info('✅ Safety check: Trade recorded as success');
    }
    
    /**
     * Record failed trade
     */
    recordFailure(loss = null) {
        // Increment consecutive failures
        this.circuitBreaker.consecutiveFailures++;
        
        // Check if circuit breaker should trip
        if (this.circuitBreaker.consecutiveFailures >= this.circuitBreaker.maxFailures) {
            this.tripCircuitBreaker();
        }
        
        // Track losses if provided
        if (loss) {
            this.lossTracker.consecutiveLosses++;
            this.lossTracker.totalLossToday = this.lossTracker.totalLossToday.plus(loss);
            
            // Check consecutive losses
            if (this.lossTracker.consecutiveLosses >= this.lossTracker.maxConsecutiveLosses) {
                this.tripCircuitBreaker();
                logger.error('🚨 Circuit breaker tripped: Too many consecutive losses');
            }
        }
        
        logger.warn('❌ Safety check: Trade recorded as failure');
    }
    
    /**
     * Trip circuit breaker
     */
    tripCircuitBreaker() {
        this.circuitBreaker.isTripped = true;
        this.circuitBreaker.lastTripTime = Date.now();
        
        logger.error('🚨 CIRCUIT BREAKER TRIPPED - Trading halted for 1 hour');
    }
    
    /**
     * Reset circuit breaker
     */
    resetCircuitBreaker() {
        this.circuitBreaker.isTripped = false;
        this.circuitBreaker.consecutiveFailures = 0;
        this.circuitBreaker.lastTripTime = null;
        
        logger.info('✅ Circuit breaker reset - Trading resumed');
    }
    
    /**
     * Manually reset circuit breaker
     */
    manualReset() {
        this.resetCircuitBreaker();
        this.lossTracker.consecutiveLosses = 0;
        this.lossTracker.totalLossToday = new BigNumber(0);
        
        logger.info('✅ Manual safety reset performed');
    }
    
    /**
     * Check wallet balance
     */
    async checkWalletBalance(wallet, minBalance = '0.1') {
        const balance = await wallet.getBalance();
        const min = ethers.utils.parseEther(minBalance);
        
        if (balance.lt(min)) {
            logger.error(`⚠️ Wallet balance too low: ${ethers.utils.formatEther(balance)} ETH`);
            this.tripCircuitBreaker();
            return false;
        }
        
        return true;
    }
    
    /**
     * Check contract balance
     */
    async checkContractBalance(contract, token, minBalance = '0') {
        const balance = await contract.getBalance(token);
        const min = ethers.utils.parseEther(minBalance);
        
        if (balance.lt(min)) {
            logger.warn(`Contract balance low for token ${token}: ${ethers.utils.formatEther(balance)}`);
            return false;
        }
        
        return true;
    }
    
    /**
     * Estimate maximum safe trade size
     */
    calculateMaxSafeTradeSize(liquidity, priceImpactLimit = 0.02) {
        // Calculate max trade size based on price impact
        const maxSize = new BigNumber(liquidity).multipliedBy(priceImpactLimit);
        
        // Apply position limit
        return BigNumber.min(maxSize, this.positionTracker.maxExposure);
    }
    
    /**
     * Get safety status
     */
    getSafetyStatus() {
        return {
            circuitBreaker: {
                isTripped: this.circuitBreaker.isTripped,
                consecutiveFailures: this.circuitBreaker.consecutiveFailures,
                cooldownRemaining: this.circuitBreaker.isTripped 
                    ? this.circuitBreaker.cooldownPeriod - (Date.now() - this.circuitBreaker.lastTripTime)
                    : 0
            },
            rateLimit: {
                tradesThisHour: this.rateLimiter.tradesPerHour,
                maxTradesPerHour: this.rateLimiter.maxTradesPerHour,
                remaining: this.rateLimiter.maxTradesPerHour - this.rateLimiter.tradesPerHour
            },
            losses: {
                consecutiveLosses: this.lossTracker.consecutiveLosses,
                totalLossToday: this.lossTracker.totalLossToday.toString(),
                maxDailyLoss: this.lossTracker.maxDailyLoss.toString()
            },
            tradingAllowed: this.isTradingAllowed()
        };
    }
    
    /**
     * Reset daily statistics (call at midnight)
     */
    resetDailyStats() {
        this.lossTracker.totalLossToday = new BigNumber(0);
        this.lossTracker.consecutiveLosses = 0;
        
        logger.info('📊 Daily safety statistics reset');
    }
}

module.exports = SafetyChecks;

