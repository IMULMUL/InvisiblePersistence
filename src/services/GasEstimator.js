/**
 * GasEstimator - Estimates optimal gas prices for transactions
 */

const { ethers } = require('ethers');
const axios = require('axios');
const logger = require('../utils/logger');

class GasEstimator {
    constructor(provider) {
        this.provider = provider;
        this.gasCache = null;
        this.cacheTimeout = 10000; // 10 seconds
        this.lastUpdate = 0;
    }
    
    /**
     * Estimate current gas price
     */
    async estimateGasPrice() {
        // Check cache
        if (this.gasCache && Date.now() - this.lastUpdate < this.cacheTimeout) {
            return this.gasCache;
        }
        
        try {
            // Try to get gas price from provider
            const gasPrice = await this.provider.getGasPrice();
            
            // Add 10% buffer for faster confirmation
            const bufferedGasPrice = gasPrice.mul(110).div(100);
            
            // Cache the result
            this.gasCache = bufferedGasPrice;
            this.lastUpdate = Date.now();
            
            logger.debug(`Gas price: ${ethers.utils.formatUnits(bufferedGasPrice, 'gwei')} gwei`);
            
            return bufferedGasPrice;
            
        } catch (error) {
            logger.error('Error estimating gas price:', error);
            
            // Fallback to a default value
            return ethers.utils.parseUnits('50', 'gwei');
        }
    }
    
    /**
     * Get EIP-1559 gas price
     */
    async estimateEIP1559GasPrice() {
        try {
            const feeData = await this.provider.getFeeData();
            
            return {
                maxFeePerGas: feeData.maxFeePerGas,
                maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
            };
            
        } catch (error) {
            logger.error('Error getting EIP-1559 gas price:', error);
            return null;
        }
    }
    
    /**
     * Get gas price from external API (Etherscan, Gas Station, etc.)
     */
    async getExternalGasPrice() {
        try {
            // Using Etherscan Gas Tracker API
            const response = await axios.get(
                'https://api.etherscan.io/api?module=gastracker&action=gasoracle'
            );
            
            if (response.data.status === '1') {
                const result = response.data.result;
                
                return {
                    safe: ethers.utils.parseUnits(result.SafeGasPrice, 'gwei'),
                    standard: ethers.utils.parseUnits(result.ProposeGasPrice, 'gwei'),
                    fast: ethers.utils.parseUnits(result.FastGasPrice, 'gwei')
                };
            }
            
        } catch (error) {
            logger.debug('Error fetching external gas price:', error.message);
        }
        
        return null;
    }
    
    /**
     * Estimate gas limit for a transaction
     */
    async estimateGasLimit(transaction) {
        try {
            const gasLimit = await this.provider.estimateGas(transaction);
            
            // Add 20% buffer
            const bufferedGasLimit = gasLimit.mul(120).div(100);
            
            return bufferedGasLimit;
            
        } catch (error) {
            logger.error('Error estimating gas limit:', error);
            
            // Return default gas limit
            return ethers.BigNumber.from(500000);
        }
    }
    
    /**
     * Calculate transaction cost in ETH
     */
    calculateTransactionCost(gasLimit, gasPrice) {
        return gasLimit.mul(gasPrice);
    }
    
    /**
     * Check if gas price is within acceptable range
     */
    isGasPriceAcceptable(gasPrice, maxGasPrice) {
        return gasPrice.lte(ethers.utils.parseUnits(maxGasPrice.toString(), 'gwei'));
    }
    
    /**
     * Get optimal gas price for arbitrage
     * Balances speed and cost
     */
    async getOptimalGasPrice(urgency = 'standard') {
        const externalPrices = await this.getExternalGasPrice();
        
        if (externalPrices) {
            switch (urgency) {
                case 'safe':
                    return externalPrices.safe;
                case 'fast':
                    return externalPrices.fast;
                default:
                    return externalPrices.standard;
            }
        }
        
        // Fallback to provider gas price
        return await this.estimateGasPrice();
    }
}

module.exports = GasEstimator;

