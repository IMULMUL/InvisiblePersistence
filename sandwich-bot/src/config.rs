use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub rpc: RpcConfig,
    pub wallet: WalletConfig,
    pub strategy: StrategyConfig,
    pub dex: DexConfig,
    pub risk: RiskConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RpcConfig {
    pub http_url: String,
    pub ws_url: String,
    pub commitment: String,
    pub timeout_seconds: u64,
    pub max_retries: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletConfig {
    /// Path to wallet keypair file (from env var)
    pub keypair_path: String,
    /// Maximum SOL to use per trade
    pub max_position_size: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StrategyConfig {
    /// Minimum transaction volume to consider (in USD)
    pub min_target_volume: f64,
    /// Maximum transaction volume to consider (in USD)
    pub max_target_volume: f64,
    /// Minimum expected profit in SOL
    pub min_profit_sol: f64,
    /// Minimum profit percentage
    pub min_profit_percentage: f64,
    /// Maximum slippage tolerance (percentage)
    pub max_slippage: f64,
    /// Priority fee in lamports
    pub priority_fee: u64,
    /// Use Jito MEV for transaction bundles
    pub use_jito: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DexConfig {
    pub raydium: DexSettings,
    pub orca: DexSettings,
    pub jupiter: DexSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DexSettings {
    pub enabled: bool,
    pub program_id: String,
    pub min_liquidity_usd: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskConfig {
    /// Maximum concurrent positions
    pub max_concurrent_trades: u32,
    /// Stop-loss percentage
    pub stop_loss_percentage: f64,
    /// Maximum daily loss in SOL
    pub max_daily_loss: f64,
    /// Circuit breaker: pause after N consecutive losses
    pub circuit_breaker_losses: u32,
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
        // Validate RPC URLs
        if self.rpc.http_url.is_empty() {
            anyhow::bail!("RPC HTTP URL cannot be empty");
        }

        // Validate wallet
        if self.wallet.max_position_size <= 0.0 {
            anyhow::bail!("Max position size must be positive");
        }

        // Validate strategy
        if self.strategy.min_profit_sol <= 0.0 {
            anyhow::bail!("Min profit must be positive");
        }

        // Validate DEX program IDs
        self.validate_program_id(&self.dex.raydium.program_id)?;
        self.validate_program_id(&self.dex.orca.program_id)?;
        self.validate_program_id(&self.dex.jupiter.program_id)?;

        Ok(())
    }

    fn validate_program_id(&self, program_id: &str) -> Result<()> {
        Pubkey::from_str(program_id)
            .context(format!("Invalid program ID: {}", program_id))?;
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
                max_retries: 3,
            },
            wallet: WalletConfig {
                keypair_path: "~/.config/solana/id.json".to_string(),
                max_position_size: 1.0,
            },
            strategy: StrategyConfig {
                min_target_volume: 10000.0,
                max_target_volume: 1000000.0,
                min_profit_sol: 0.01,
                min_profit_percentage: 0.5,
                max_slippage: 1.0,
                priority_fee: 10000,
                use_jito: true,
            },
            dex: DexConfig {
                raydium: DexSettings {
                    enabled: true,
                    program_id: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8".to_string(),
                    min_liquidity_usd: 50000.0,
                },
                orca: DexSettings {
                    enabled: true,
                    program_id: "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc".to_string(),
                    min_liquidity_usd: 50000.0,
                },
                jupiter: DexSettings {
                    enabled: true,
                    program_id: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4".to_string(),
                    min_liquidity_usd: 50000.0,
                },
            },
            risk: RiskConfig {
                max_concurrent_trades: 3,
                stop_loss_percentage: 5.0,
                max_daily_loss: 5.0,
                circuit_breaker_losses: 5,
            },
        }
    }
}

