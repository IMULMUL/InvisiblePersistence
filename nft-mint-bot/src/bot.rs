use anyhow::Result;
use solana_client::rpc_client::RpcClient;
use solana_sdk::signature::Keypair;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{error, info, warn};

use crate::{
    candy_machine::CandyMachineManager,
    config::Config,
    metrics::Metrics,
    mint_executor::MintExecutor,
    monitor::MintMonitor,
    wallet_manager::WalletManager,
};

pub struct MintBot {
    config: Config,
    rpc_client: Arc<RpcClient>,
    wallet_manager: WalletManager,
    candy_machine_manager: CandyMachineManager,
    mint_executor: MintExecutor,
    monitor: MintMonitor,
    metrics: Arc<RwLock<Metrics>>,
    dry_run: bool,
}

impl MintBot {
    pub async fn new(config: Config, dry_run: bool) -> Result<Self> {
        info!("Initializing NFT Mint Bot...");

        // Initialize RPC client
        let rpc_client = Arc::new(RpcClient::new_with_commitment(
            config.rpc.http_url.clone(),
            solana_client::rpc_config::RpcSendTransactionConfig::default()
                .commitment
                .unwrap(),
        ));

        // Load wallets
        let wallet_manager = WalletManager::new(&config)?;
        info!(
            "Loaded {} wallet(s)",
            wallet_manager.wallet_count()
        );

        // Initialize components
        let candy_machine_manager = CandyMachineManager::new(config.clone(), rpc_client.clone())?;
        let mint_executor = MintExecutor::new(config.clone(), rpc_client.clone());
        let monitor = MintMonitor::new(config.clone())?;
        let metrics = Arc::new(RwLock::new(Metrics::new()));

        Ok(Self {
            config,
            rpc_client,
            wallet_manager,
            candy_machine_manager,
            mint_executor,
            monitor,
            metrics,
            dry_run,
        })
    }

    pub async fn run(&mut self) -> Result<()> {
        info!("🚀 NFT Mint Bot is running!");
        info!("Monitoring {} project(s):", self.config.projects.len());

        for project in &self.config.projects {
            if project.enabled {
                info!("  ✓ {} ({})", project.name, project.candy_machine_id);
            }
        }

        if self.dry_run {
            warn!("⚠️  DRY RUN MODE - No real mints will be executed");
        }

        // Pre-build transactions if enabled
        if self.config.strategy.prebuild_transactions {
            info!("Pre-building mint transactions...");
            // Pre-build logic would go here
        }

        // Main monitoring loop
        loop {
            tokio::select! {
                // Monitor for mint start times
                _ = self.check_mint_times() => {
                    // Check if any projects are ready to mint
                }

                // Graceful shutdown
                _ = tokio::signal::ctrl_c() => {
                    info!("Shutting down gracefully...");
                    self.shutdown().await?;
                    break;
                }
            }

            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        }

        Ok(())
    }

    async fn check_mint_times(&mut self) -> Result<()> {
        let now = chrono::Utc::now().timestamp();

        for project in &self.config.projects {
            if !project.enabled {
                continue;
            }

            // Check if mint time has arrived
            if let Some(mint_time) = project.mint_start_time {
                if now >= mint_time && now < mint_time + 60 {
                    // Within 1 minute of mint start
                    info!("🎯 Mint time for {} has arrived!", project.name);
                    self.execute_mint(project).await?;
                }
            }
        }

        Ok(())
    }

    async fn execute_mint(&mut self, project: &crate::config::ProjectConfig) -> Result<()> {
        info!("⚡ Executing mint for {}", project.name);

        // Update metrics
        {
            let mut metrics = self.metrics.write().await;
            metrics.attempts += 1;
        }

        // Get candy machine info
        let candy_machine = self
            .candy_machine_manager
            .get_candy_machine(&project.candy_machine_id)
            .await?;

        info!("Candy Machine loaded: {}", candy_machine.id);

        // Execute mint attempts
        for attempt in 1..=self.config.strategy.mint_attempts {
            info!("Mint attempt {}/{}", attempt, self.config.strategy.mint_attempts);

            if !self.dry_run {
                // Get wallet for minting
                let wallet = self.wallet_manager.get_next_wallet()?;

                // Execute mint
                match self
                    .mint_executor
                    .execute_mint(&candy_machine, wallet, project)
                    .await
                {
                    Ok(result) => {
                        info!("✅ Mint successful! NFT: {}", result.nft_mint);
                        info!("Transaction: {}", result.signature);

                        let mut metrics = self.metrics.write().await;
                        metrics.successful_mints += 1;

                        return Ok(());
                    }
                    Err(e) => {
                        error!("❌ Mint attempt {} failed: {}", attempt, e);

                        let mut metrics = self.metrics.write().await;
                        metrics.failed_mints += 1;

                        // Wait before retry
                        if attempt < self.config.strategy.mint_attempts {
                            tokio::time::sleep(tokio::time::Duration::from_millis(
                                self.config.strategy.attempt_delay_ms,
                            ))
                            .await;
                        }
                    }
                }
            } else {
                info!("💡 [DRY RUN] Would execute mint for {}", project.name);
                return Ok(());
            }
        }

        warn!("Failed all mint attempts for {}", project.name);
        Ok(())
    }

    async fn shutdown(&self) -> Result<()> {
        info!("Stopping bot...");

        // Print final metrics
        let metrics = self.metrics.read().await;
        info!("📊 Final Statistics:");
        info!("  Total Attempts: {}", metrics.attempts);
        info!("  Successful Mints: {}", metrics.successful_mints);
        info!("  Failed Mints: {}", metrics.failed_mints);

        if metrics.attempts > 0 {
            let success_rate =
                (metrics.successful_mints as f64 / metrics.attempts as f64) * 100.0;
            info!("  Success Rate: {:.2}%", success_rate);
        }

        Ok(())
    }
}

