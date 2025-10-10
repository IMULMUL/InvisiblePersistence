use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub rpc: RpcConfig,
    pub wallet: WalletConfig,
    pub protocols: ProtocolsConfig,
    pub strategy: StrategyConfig,
    pub risk: RiskConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RpcConfig {
    pub http_url: String,
    pub ws_url: String,
    pub commitment: String,
    pub timeout_seconds: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletConfig {
    pub keypair_path: String,
    pub max_position_size: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProtocolsConfig {
    pub solend: ProtocolSettings,
    pub mango: ProtocolSettings,
    pub port: ProtocolSettings,
    pub kamino: ProtocolSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProtocolSettings {
    pub enabled: bool,
    pub program_id: String,
    pub min_profit_usd: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StrategyConfig {
    /// Minimum health factor to trigger liquidation
    pub liquidation_threshold: f64,
    /// Minimum profit in SOL
    pub min_profit_sol: f64,
    /// Maximum slippage for liquidation trades
    pub max_slippage: f64,
    /// Priority fee in lamports
    pub priority_fee: u64,
    /// Scan interval in seconds
    pub scan_interval_seconds: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskConfig {
    /// Maximum concurrent liquidations
    pub max_concurrent_liquidations: u32,
    /// Maximum capital to use per liquidation
    pub max_liquidation_size: f64,
    /// Emergency stop after N failed liquidations
    pub circuit_breaker_failures: u32,
}

impl Config {
    pub fn from_file(path: &str) -> Result<Self> {
        let contents = fs::read_to_string(path)
            .context(format!("Failed to read config file: {}", path))?;
        
        let config: Config = toml::from_str(&contents)
            .context("Failed to parse config file")?;
        
        config.validate()?;
        Ok(config)
    }

    pub fn validate(&self) -> Result<()> {
        if self.rpc.http_url.is_empty() {
            anyhow::bail!("RPC HTTP URL cannot be empty");
        }

        if self.wallet.max_position_size <= 0.0 {
            anyhow::bail!("Max position size must be positive");
        }

        if self.strategy.liquidation_threshold <= 0.0 || self.strategy.liquidation_threshold >= 1.0 {
            anyhow::bail!("Liquidation threshold must be between 0 and 1");
        }

        Ok(())
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            rpc: RpcConfig {
                http_url: "https://api.mainnet-beta.solana.com".to_string(),
                ws_url: "wss://api.mainnet-beta.solana.com".to_string(),
                commitment: "confirmed".to_string(),
                timeout_seconds: 30,
            },
            wallet: WalletConfig {
                keypair_path: "~/.config/solana/id.json".to_string(),
                max_position_size: 10.0,
            },
            protocols: ProtocolsConfig {
                solend: ProtocolSettings {
                    enabled: true,
                    program_id: "So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo".to_string(),
                    min_profit_usd: 10.0,
                },
                mango: ProtocolSettings {
                    enabled: true,
                    program_id: "mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68".to_string(),
                    min_profit_usd: 10.0,
                },
                port: ProtocolSettings {
                    enabled: true,
                    program_id: "Port7uDYB3wk6GJAw4KT1WpTeMtSu9bTcChBHkX2LfR".to_string(),
                    min_profit_usd: 10.0,
                },
                kamino: ProtocolSettings {
                    enabled: true,
                    program_id: "KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD".to_string(),
                    min_profit_usd: 10.0,
                },
            },
            strategy: StrategyConfig {
                liquidation_threshold: 1.0, // Health factor < 1.0
                min_profit_sol: 0.01,
                max_slippage: 2.0,
                priority_fee: 20000,
                scan_interval_seconds: 10,
            },
            risk: RiskConfig {
                max_concurrent_liquidations: 5,
                max_liquidation_size: 50.0,
                circuit_breaker_failures: 10,
            },
        }
    }
}

