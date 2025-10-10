use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub rpc: RpcConfig,
    pub wallets: WalletConfig,
    pub projects: Vec<ProjectConfig>,
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
    /// Primary wallet keypair path
    pub primary_keypair_path: String,
    /// Additional wallet paths for multi-wallet minting
    pub additional_keypairs: Vec<String>,
    /// Maximum SOL per wallet for minting
    pub max_sol_per_wallet: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectConfig {
    pub name: String,
    pub candy_machine_id: String,
    pub mint_start_time: Option<i64>,
    pub mint_price: f64,
    pub max_mints_per_wallet: u32,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StrategyConfig {
    /// Priority fee in lamports
    pub priority_fee: u64,
    /// Number of mint attempts per project
    pub mint_attempts: u32,
    /// Delay between attempts (milliseconds)
    pub attempt_delay_ms: u64,
    /// Pre-build transactions
    pub prebuild_transactions: bool,
    /// Use multiple wallets
    pub multi_wallet_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskConfig {
    /// Maximum concurrent mints
    pub max_concurrent_mints: u32,
    /// Maximum SOL to spend total
    pub max_total_spend: f64,
    /// Stop after N consecutive failures
    pub circuit_breaker_failures: u32,
}

impl Config {
    pub fn from_file(path: &str) -> Result<Self> {
        let contents = fs::read_to_string(path)
            .context(format!("Failed to read config file: {}", path))?;

        let config: Config = toml::from_str(&contents).context("Failed to parse config file")?;

        config.validate()?;
        Ok(config)
    }

    pub fn validate(&self) -> Result<()> {
        if self.rpc.http_url.is_empty() {
            anyhow::bail!("RPC HTTP URL cannot be empty");
        }

        if self.wallets.primary_keypair_path.is_empty() {
            anyhow::bail!("Primary wallet keypair path cannot be empty");
        }

        if self.projects.is_empty() {
            anyhow::bail!("At least one project must be configured");
        }

        if self.strategy.priority_fee == 0 {
            anyhow::bail!("Priority fee must be greater than 0");
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
            wallets: WalletConfig {
                primary_keypair_path: "~/.config/solana/id.json".to_string(),
                additional_keypairs: vec![],
                max_sol_per_wallet: 5.0,
            },
            projects: vec![],
            strategy: StrategyConfig {
                priority_fee: 100000,
                mint_attempts: 3,
                attempt_delay_ms: 100,
                prebuild_transactions: true,
                multi_wallet_enabled: false,
            },
            risk: RiskConfig {
                max_concurrent_mints: 5,
                max_total_spend: 10.0,
                circuit_breaker_failures: 10,
            },
        }
    }
}

