use anyhow::Result;
use solana_client::rpc_client::RpcClient;
use solana_sdk::signature::Keypair;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn, error};

use crate::{
    config::Config,
    mempool::MempoolMonitor,
    opportunity::OpportunityDetector,
    executor::TransactionExecutor,
    metrics::Metrics,
};

pub struct SandwichBot {
    config: Config,
    rpc_client: Arc<RpcClient>,
    wallet: Arc<Keypair>,
    mempool_monitor: MempoolMonitor,
    opportunity_detector: OpportunityDetector,
    executor: TransactionExecutor,
    metrics: Arc<RwLock<Metrics>>,
    dry_run: bool,
}

impl SandwichBot {
    pub async fn new(config: Config, dry_run: bool) -> Result<Self> {
        info!("Initializing Sandwich Bot...");

        // Initialize RPC client
        let rpc_client = Arc::new(RpcClient::new_with_commitment(
            config.rpc.http_url.clone(),
            solana_client::rpc_config::RpcSendTransactionConfig::default().commitment.unwrap(),
        ));

        // Load wallet from environment variable
        let wallet_path = std::env::var("WALLET_KEYPAIR_PATH")
            .unwrap_or_else(|_| config.wallet.keypair_path.clone());
        let wallet = Arc::new(Self::load_wallet(&wallet_path)?);
        
        info!("Wallet loaded: {}", wallet.pubkey());

        // Initialize components
        let mempool_monitor = MempoolMonitor::new(config.clone())?;
        let opportunity_detector = OpportunityDetector::new(config.clone(), rpc_client.clone());
        let executor = TransactionExecutor::new(
            config.clone(),
            rpc_client.clone(),
            wallet.clone(),
        );
        let metrics = Arc::new(RwLock::new(Metrics::new()));

        Ok(Self {
            config,
            rpc_client,
            wallet,
            mempool_monitor,
            opportunity_detector,
            executor,
            metrics,
            dry_run,
        })
    }

    pub async fn run(&mut self) -> Result<()> {
        info!("🚀 Sandwich Bot is running!");
        info!("Monitoring DEXs: Raydium, Orca, Jupiter");
        
        if self.dry_run {
            warn!("⚠️  DRY RUN MODE - No real transactions will be executed");
        }

        // Start mempool monitoring
        let mut transaction_stream = self.mempool_monitor.start().await?;

        // Main event loop
        loop {
            tokio::select! {
                // Process incoming transactions from mempool
                Some(transaction) = transaction_stream.recv() => {
                    if let Err(e) = self.process_transaction(transaction).await {
                        error!("Error processing transaction: {}", e);
                    }
                }

                // Graceful shutdown on Ctrl+C
                _ = tokio::signal::ctrl_c() => {
                    info!("Shutting down gracefully...");
                    self.shutdown().await?;
                    break;
                }
            }
        }

        Ok(())
    }

    async fn process_transaction(&mut self, transaction: crate::types::Transaction) -> Result<()> {
        // Detect sandwich opportunity
        let opportunity = match self.opportunity_detector.analyze(&transaction).await {
            Ok(Some(opp)) => opp,
            Ok(None) => return Ok(()), // No opportunity found
            Err(e) => {
                warn!("Failed to analyze transaction: {}", e);
                return Ok(());
            }
        };

        info!("💰 Opportunity detected! Estimated profit: {} SOL", opportunity.estimated_profit);

        // Update metrics
        {
            let mut metrics = self.metrics.write().await;
            metrics.opportunities_found += 1;
        }

        // Execute sandwich attack (if not dry run)
        if !self.dry_run {
            match self.executor.execute_sandwich(&opportunity).await {
                Ok(result) => {
                    info!("✅ Sandwich executed successfully! Profit: {} SOL", result.actual_profit);
                    let mut metrics = self.metrics.write().await;
                    metrics.trades_executed += 1;
                    metrics.total_profit += result.actual_profit;
                }
                Err(e) => {
                    error!("❌ Failed to execute sandwich: {}", e);
                    let mut metrics = self.metrics.write().await;
                    metrics.trades_failed += 1;
                }
            }
        } else {
            info!("💡 [DRY RUN] Would execute sandwich with {} SOL", opportunity.amount);
        }

        Ok(())
    }

    async fn shutdown(&self) -> Result<()> {
        info!("Stopping bot...");
        
        // Print final metrics
        let metrics = self.metrics.read().await;
        info!("📊 Final Statistics:");
        info!("  Opportunities Found: {}", metrics.opportunities_found);
        info!("  Trades Executed: {}", metrics.trades_executed);
        info!("  Trades Failed: {}", metrics.trades_failed);
        info!("  Total Profit: {} SOL", metrics.total_profit);
        
        if metrics.trades_executed > 0 {
            let success_rate = (metrics.trades_executed as f64 / 
                              (metrics.trades_executed + metrics.trades_failed) as f64) * 100.0;
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

