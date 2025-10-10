# 🥪 Sandwich Bot - Setup and Operation Guide

## Overview

The Sandwich Bot is a high-performance MEV (Maximal Extractable Value) bot designed to profit from large transactions on Solana DEXs. It monitors the mempool for significant swaps, executes a "sandwich attack" by front-running and back-running the target transaction.

## How It Works

### Sandwich Attack Strategy

1. **Monitor Mempool**: Watch for large pending transactions on DEXs
2. **Detect Opportunity**: Calculate if the price impact is significant enough
3. **Front-Run**: Buy tokens before the target transaction executes
4. **Target Executes**: The large transaction pushes the price up
5. **Back-Run**: Sell tokens at the higher price for profit

### Example

```
Initial Pool: 1000 SOL / 100 Token A (price: 10 SOL per Token A)

1. Bot buys 50 SOL worth → Price increases to 10.5 SOL per Token A
2. Target buys 200 SOL worth → Price increases to 13 SOL per Token A  
3. Bot sells tokens back → Receives 52.5 SOL (2.5 SOL profit)
```

## Prerequisites

### System Requirements

- **OS**: Linux (Ubuntu 20.04+), macOS, or Windows WSL2
- **RAM**: Minimum 4GB, recommended 8GB+
- **CPU**: Multi-core processor recommended
- **Network**: Low-latency internet connection (< 50ms to RPC)

### Software Requirements

```bash
# Rust (1.70+)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Solana CLI (1.18+)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Node.js (optional, for Jito integration)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
```

### Premium RPC Provider

**Critical**: You MUST use a premium RPC provider for competitive performance:

- **Helius**: https://helius.dev (Recommended)
- **QuickNode**: https://quicknode.com
- **Triton One**: https://triton.one
- **GenesysGo**: https://genesysgo.com

Free public RPCs are NOT suitable for MEV bots (high latency, rate limits).

## Installation

### Step 1: Clone and Build

```bash
# Clone the repository
git clone <repository-url>
cd sandwich-bot

# Build in release mode
cargo build --release

# Binary will be at target/release/sandwich-bot
```

### Step 2: Configuration

```bash
# Copy example config
cp config.example.toml config.toml

# Edit configuration
nano config.toml
```

#### Key Configuration Parameters

```toml
[rpc]
http_url = "https://your-premium-rpc.com"  # ← IMPORTANT: Use premium RPC
ws_url = "wss://your-premium-rpc.com"

[wallet]
keypair_path = "~/.config/solana/id.json"  # Path to wallet
max_position_size = 1.0                     # Max SOL per trade

[strategy]
min_profit_sol = 0.01        # Minimum profit to execute
min_profit_percentage = 0.5  # Minimum profit %
priority_fee = 10000         # Priority fee in lamports
use_jito = true              # Use Jito for atomic execution

[risk]
max_concurrent_trades = 3    # Maximum simultaneous trades
max_daily_loss = 5.0         # Stop if daily loss exceeds this
circuit_breaker_losses = 5   # Pause after N consecutive losses
```

### Step 3: Wallet Setup

```bash
# Option 1: Use existing wallet
export WALLET_KEYPAIR_PATH=~/.config/solana/id.json

# Option 2: Create new wallet (MAINNET - REAL MONEY!)
solana-keygen new --outfile sandwich-bot-wallet.json

# Fund the wallet
# Send SOL from your exchange/main wallet
solana balance sandwich-bot-wallet.json
```

**⚠️ SECURITY WARNING**: Keep your wallet private key secure! Never commit it to git.

### Step 4: Test on Devnet (Optional but Recommended)

```bash
# Change RPC to devnet in config.toml
http_url = "https://api.devnet.solana.com"

# Get devnet SOL
solana airdrop 2 <your-wallet-address> --url devnet

# Run in dry-run mode
./target/release/sandwich-bot --dry-run
```

## Running the Bot

### Basic Usage

```bash
# Run with default config
./target/release/sandwich-bot

# Specify custom config
./target/release/sandwich-bot --config my-config.toml

# Dry run mode (simulate only)
./target/release/sandwich-bot --dry-run

# Verbose logging
./target/release/sandwich-bot --verbose
```

### Running as a Service (Linux)

```bash
# Create systemd service
sudo nano /etc/systemd/system/sandwich-bot.service
```

```ini
[Unit]
Description=Solana Sandwich Bot
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/sandwich-bot
ExecStart=/path/to/sandwich-bot/target/release/sandwich-bot
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Start service
sudo systemctl daemon-reload
sudo systemctl enable sandwich-bot
sudo systemctl start sandwich-bot

# Check status
sudo systemctl status sandwich-bot

# View logs
sudo journalctl -u sandwich-bot -f
```

## Monitoring and Maintenance

### Logs

```bash
# Real-time logs
tail -f sandwich-bot.log

# Search for profitable trades
grep "Sandwich executed successfully" sandwich-bot.log

# Check error rate
grep "ERROR" sandwich-bot.log | wc -l
```

### Performance Metrics

The bot outputs key metrics on shutdown:

```
📊 Final Statistics:
  Opportunities Found: 1,234
  Trades Executed: 987
  Trades Failed: 45
  Total Profit: 12.5 SOL
  Success Rate: 95.64%
```

### Health Checks

```bash
# Check if process is running
ps aux | grep sandwich-bot

# Check wallet balance
solana balance <your-wallet-address>

# Check recent transactions
solana transaction-history <your-wallet-address> | head -10
```

## Optimization Tips

### 1. Reduce Latency

- Deploy bot on a VPS near RPC servers (AWS us-east-1 recommended)
- Use dedicated/premium RPC endpoints
- Enable Jito MEV for atomic transaction bundles

### 2. Fine-Tune Parameters

```toml
# Start conservative
min_profit_sol = 0.05
min_profit_percentage = 1.0

# After gaining confidence, can be more aggressive
min_profit_sol = 0.01
min_profit_percentage = 0.3
```

### 3. Priority Fees

```toml
# During low congestion
priority_fee = 5000

# During high congestion (more competitive)
priority_fee = 50000
```

### 4. Use Jito MEV

Jito Block Engine enables atomic transaction bundles:

```toml
use_jito = true
```

Setup Jito:
1. Get Jito auth keypair: https://jito.wtf/
2. Set `JITO_AUTH_KEYPAIR` environment variable
3. Bot will automatically use Jito for submissions

## Risk Management

### Position Sizing

Never risk more than you can afford to lose:

```toml
max_position_size = 1.0  # Start small (1 SOL)
max_daily_loss = 5.0     # Stop after losing 5 SOL in a day
```

### Circuit Breaker

Automatic pause after consecutive losses:

```toml
circuit_breaker_losses = 5  # Pause after 5 losses in a row
```

When triggered, bot will:
1. Stop executing new trades
2. Log warning message
3. Require manual restart

### Stop-Loss

Per-trade stop-loss:

```toml
stop_loss_percentage = 5.0  # Exit if loss exceeds 5%
```

## Troubleshooting

### Bot Not Finding Opportunities

**Problem**: No opportunities detected

**Solutions**:
1. Lower `min_target_volume` threshold
2. Check if DEXs are enabled in config
3. Verify mempool connection (check logs for "Connected to mempool")
4. Ensure RPC WebSocket is working

### Transactions Failing

**Problem**: High failure rate

**Solutions**:
1. Increase `priority_fee`
2. Enable Jito (`use_jito = true`)
3. Reduce `max_slippage`
4. Check wallet has sufficient SOL

### Low Profitability

**Problem**: Profits lower than expected

**Solutions**:
1. Increase `min_profit_percentage`
2. Focus on higher liquidity pools (`min_liquidity_usd`)
3. Optimize `priority_fee` (not too high, not too low)
4. Consider market conditions (low volatility = fewer opportunities)

### RPC Rate Limiting

**Problem**: "429 Too Many Requests" errors

**Solutions**:
1. Upgrade to premium RPC tier
2. Reduce `max_retries`
3. Add retry delay in code
4. Use multiple RPC endpoints with failover

## Legal and Ethical Considerations

### Is Sandwich Trading Legal?

- **Legal Status**: Generally legal but controversial
- **Ethics**: Considered harmful to regular traders (extracts value)
- **Regulation**: May face future regulation
- **Use Responsibly**: Understand the impact on other traders

### Best Practices

1. **Start Small**: Test with minimal capital
2. **Be Transparent**: If offering as a service, disclose how it works
3. **Follow ToS**: Ensure compliance with DEX and RPC provider terms
4. **Stay Informed**: Monitor regulatory developments

## Advanced Topics

### Integration with Geyser Plugin

For real-time mempool access:

```bash
# Install Yellowstone Geyser
git clone https://github.com/rpcpool/yellowstone-grpc
cd yellowstone-grpc
cargo build --release

# Configure in bot
# Update mempool.rs to use Geyser instead of WebSocket
```

### Custom DEX Integration

Add support for new DEXs:

1. Add DEX config in `config.rs`
2. Implement parser in `opportunity.rs`
3. Add instruction builder in `executor.rs`
4. Test thoroughly on devnet

### Machine Learning

Enhance profitability prediction:

1. Collect historical trade data
2. Train ML model on features (liquidity, volatility, time of day)
3. Integrate model in `opportunity.rs`
4. Backtest and refine

## Support

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check inline code comments
- **Community**: Join Discord/Telegram for discussions

## Disclaimer

**USE AT YOUR OWN RISK**

- Trading bots can lose money
- No guarantee of profits
- MEV strategies are competitive
- Test thoroughly before using real funds
- Always start with small amounts

---