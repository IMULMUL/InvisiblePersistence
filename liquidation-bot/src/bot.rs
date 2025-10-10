use anyhow::Result;
use solana_client::rpc_client::RpcClient;
use solana_sdk::signature::Keypair;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{error, info, warn};

use crate::{
    config::Config,
    monitor::AccountMonitor,
    liquidator::Liquidator,
    price_feed::PriceFeedManager,
    metrics::Metrics,
};

pub struct LiquidationBot {
    config: Config,
    rpc_client: Arc<RpcClient>,
    wallet: Arc<Keypair>,
    monitor: AccountMonitor,
    liquidator: Liquidator,
    price_feed: Arc<PriceFeedManager>,
    metrics: Arc<RwLock<Metrics>>,
    dry_run: bool,
}

impl LiquidationBot {
    pub async fn new(config: Config, dry_run: bool) -> Result<Self> {
        info!("Initializing Liquidation Bot...");

        // Initialize RPC client
        let rpc_client = Arc::new(RpcClient::new_with_commitment(
            config.rpc.http_url.clone(),
            solana_client::rpc_config::RpcSendTransactionConfig::default()
                .commitment
                .unwrap(),
        ));

        // Load wallet
        let wallet_path = std::env::var("WALLET_KEYPAIR_PATH")
            .unwrap_or_else(|_| config.wallet.keypair_path.clone());
        let wallet = Arc::new(Self::load_wallet(&wallet_path)?);

        info!("Wallet loaded: {}", wallet.pubkey());

        // Initialize price feed manager
        let price_feed = Arc::new(PriceFeedManager::new(rpc_client.clone())?);

        // Initialize components
        let monitor = AccountMonitor::new(config.clone(), rpc_client.clone())?;
        let liquidator = Liquidator::new(config.clone(), rpc_client.clone(), wallet.clone());
        let metrics = Arc::new(RwLock::new(Metrics::new()));

        Ok(Self {
            config,
            rpc_client,
            wallet,
            monitor,
            liquidator,
            price_feed,
            metrics,
            dry_run,
        })
    }

    pub async fn run(&mut self) -> Result<()> {
        info!("🚀 Liquidation Bot is running!");
        info!("Monitoring protocols:");
        if self.config.protocols.solend.enabled {
            info!("  ✓ Solend");
        }
        if self.config.protocols.mango.enabled {
            info!("  ✓ Mango Markets");
        }
        if self.config.protocols.port.enabled {
            info!("  ✓ Port Finance");
        }
        if self.config.protocols.kamino.enabled {
            info!("  ✓ Kamino Finance");
        }

        if self.dry_run {
            warn!("⚠️  DRY RUN MODE - No real liquidations will be executed");
        }

        // Main monitoring loop
        let mut scan_interval = tokio::time::interval(
            tokio::time::Duration::from_secs(self.config.strategy.scan_interval_seconds),
        );

        loop {
            tokio::select! {
                _ = scan_interval.tick() => {
                    if let Err(e) = self.scan_for_liquidations().await {
                        error!("Error during liquidation scan: {}", e);
                    }
                }

                _ = tokio::signal::ctrl_c() => {
                    info!("Shutting down gracefully...");
                    self.shutdown().await?;
                    break;
                }
            }
        }

        Ok(())
    }

    async fn scan_for_liquidations(&mut self) -> Result<()> {
        info!("🔍 Scanning for liquidation opportunities...");

        // Get all unhealthy accounts
        let unhealthy_accounts = self.monitor.find_unhealthy_accounts().await?;

        if unhealthy_accounts.is_empty() {
            info!("No liquidation opportunities found");
            return Ok(());
        }

        info!(
            "Found {} accounts eligible for liquidation",
            unhealthy_accounts.len()
        );

        // Process each liquidation opportunity
        for account in unhealthy_accounts {
            info!(
                "💰 Liquidation opportunity: {} (Health Factor: {:.4})",
                account.address, account.health_factor
            );

            // Update metrics
            {
                let mut metrics = self.metrics.write().await;
                metrics.opportunities_found += 1;
            }

            // Execute liquidation (if not dry run)
            if !self.dry_run {
                match self.liquidator.execute_liquidation(&account).await {
                    Ok(result) => {
                        info!(
                            "✅ Liquidation executed! Profit: {} SOL",
                            result.profit
                        );
                        let mut metrics = self.metrics.write().await;
                        metrics.liquidations_executed += 1;
                        metrics.total_profit += result.profit;
                    }
                    Err(e) => {
                        error!("❌ Failed to execute liquidation: {}", e);
                        let mut metrics = self.metrics.write().await;
                        metrics.liquidations_failed += 1;
                    }
                }
            } else {
                info!(
                    "💡 [DRY RUN] Would liquidate: {} (Est. profit: {} SOL)",
                    account.address, account.estimated_profit
                );
            }
        }

        Ok(())
    }

    async fn shutdown(&self) -> Result<()> {
        info!("Stopping bot...");

        // Print final metrics
        let metrics = self.metrics.read().await;
        info!("📊 Final Statistics:");
        info!("  Opportunities Found: {}", metrics.opportunities_found);
        info!("  Liquidations Executed: {}", metrics.liquidations_executed);
        info!("  Liquidations Failed: {}", metrics.liquidations_failed);
        info!("  Total Profit: {} SOL", metrics.total_profit);

        if metrics.liquidations_executed > 0 {
            let success_rate = (metrics.liquidations_executed as f64
                / (metrics.liquidations_executed + metrics.liquidations_failed) as f64)
                * 100.0;
            info!("  Success Rate: {:.2}%", success_rate);
        }

        Ok(())
    }

    fn load_wallet(path: &str) -> Result<Keypair> {
        let wallet_bytes = std::fs::read(path)
            .map_err(|e| anyhow::anyhow!("Failed to read wallet file {}: {}", path, e))?;

        let wallet_json: Vec<u8> = serde_json::from_slice(&wallet_bytes)
            .map_err(|e| anyhow::anyhow!("Failed to parse wallet JSON: {}", e))?;

        Keypair::from_bytes(&wallet_json)
            .map_err(|e| anyhow::anyhow!("Invalid keypair bytes: {}", e))
    }
}

