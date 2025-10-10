use anyhow::Result;
use clap::Parser;
use sandwich_bot::{config::Config, bot::SandwichBot};
use tracing::{info, error};
use tracing_subscriber;

#[derive(Parser, Debug)]
#[clap(name = "Sandwich Bot")]
#[clap(about = "High-performance MEV sandwich bot for Solana", long_about = None)]
struct Args {
    /// Configuration file path
    #[clap(short, long, default_value = "config.toml")]
    config: String,

    /// Enable dry-run mode (simulate without executing)
    #[clap(short, long)]
    dry_run: bool,

    /// Verbose logging
    #[clap(short, long)]
    verbose: bool,
}

#[tokio::main]
async fn main() -> Result<()> {
    // Parse command line arguments
    let args = Args::parse();

    // Initialize logging
    let log_level = if args.verbose { "debug" } else { "info" };
    tracing_subscriber::fmt()
        .with_env_filter(log_level)
        .with_target(false)
        .with_thread_ids(true)
        .with_file(true)
        .with_line_number(true)
        .init();

    info!("🥪 Starting Sandwich Bot v{}", env!("CARGO_PKG_VERSION"));
    info!("Dry run mode: {}", args.dry_run);

    // Load configuration
    let config = Config::from_file(&args.config)?;
    info!("Configuration loaded from: {}", args.config);

    // Create and initialize the bot
    let mut bot = SandwichBot::new(config, args.dry_run).await?;
    info!("Bot initialized successfully");

    // Start the bot
    info!("Starting sandwich bot...");
    if let Err(e) = bot.run().await {
        error!("Bot encountered an error: {}", e);
        return Err(e);
    }

    Ok(())
}

