# 💧 Liquidation Bot - Complete Setup Guide

## Overview

The Liquidation Bot monitors Solana lending protocols for unhealthy positions (health factor < 1.0) and executes profitable liquidations. Unlike sandwich trading, liquidation bots provide a valuable service by maintaining protocol health and preventing bad debt.

## How Liquidations Work

### Health Factor

```
Health Factor = Total Collateral Value / Total Debt Value
```

- **Health > 1.0**: Position is healthy
- **Health < 1.0**: Position is underwater, can be liquidated
- **Health < 0.8**: Critical risk of bad debt

### Liquidation Process

1. User borrows too much or collateral value drops
2. Health factor falls below 1.0
3. Bot detects unhealthy position
4. Bot repays part of debt
5. Bot receives collateral + liquidation bonus (5-10%)
6. Bot profits from bonus

### Example

```
User Position:
- Collateral: 100 SOL ($10,000)
- Debt: 95 SOL ($9,500)
- Health Factor: 1.05

Price drops:
- Collateral: 100 SOL ($9,000)  
- Debt: 95 SOL ($9,500)
- Health Factor: 0.95 → LIQUIDATABLE!

Bot liquidates:
- Repays: 47.5 SOL debt
- Receives: 50 SOL collateral (5% bonus)
- Profit: 2.5 SOL ($225)
```

## Installation

### Prerequisites

```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

### Build

```bash
git clone <repository>
cd liquidation-bot
cargo build --release
```

### Configuration

```bash
cp config.example.toml config.toml
nano config.toml
```

#### Key Settings

```toml
[rpc]
http_url = "https://your-premium-rpc.com"  # Use premium RPC

[wallet]
keypair_path = "~/.config/solana/id.json"
max_position_size = 10.0  # Conservative for beginners

[strategy]
liquidation_threshold = 1.0     # Standard threshold
min_profit_sol = 0.01           # 0.01 SOL minimum
scan_interval_seconds = 10      # Scan every 10 seconds

[protocols.solend]
enabled = true                  # Enable Solend
min_profit_usd = 10.0          # $10 minimum profit

# Enable other protocols as needed
[protocols.mango]
enabled = true

[protocols.port]
enabled = true

[protocols.kamino]
enabled = true
```

## Running the Bot

### Basic Usage

```bash
# Run normally
./target/release/liquidation-bot

# Dry run (test mode)
./target/release/liquidation-bot --dry-run

# Verbose logging
./target/release/liquidation-bot --verbose

# Custom config
./target/release/liquidation-bot --config my-config.toml
```

### Running as Systemd Service

```bash
# Create service file
sudo nano /etc/systemd/system/liquidation-bot.service
```

```ini
[Unit]
Description=Solana Liquidation Bot
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/liquidation-bot
ExecStart=/path/to/liquidation-bot/target/release/liquidation-bot
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable liquidation-bot
sudo systemctl start liquidation-bot

# Check status
sudo systemctl status liquidation-bot

# View logs
sudo journalctl -u liquidation-bot -f
```

## Monitoring

### Key Metrics

```
📊 Final Statistics:
  Opportunities Found: 45
  Liquidations Executed: 38
  Liquidations Failed: 7
  Total Profit: 2.5 SOL
  Success Rate: 84.44%
```

### Health Checks

```bash
# Check bot process
ps aux | grep liquidation-bot

# Check wallet balance
solana balance <your-wallet>

# View recent liquidations
grep "Liquidation executed" liquidation-bot.log
```

### Alerts

Set up alerts for:
- Bot crashes
- Low wallet balance (< 1 SOL)
- High failure rate (> 30%)
- Circuit breaker triggers

## Optimization

### 1. Protocol Selection

Start with one protocol and expand:

```toml
# Beginners: Start with Solend only
[protocols.solend]
enabled = true

[protocols.mango]
enabled = false

[protocols.port]
enabled = false

[protocols.kamino]
enabled = false
```

### 2. Scan Frequency

Balance between speed and cost:

```toml
# Aggressive (more opportunities, higher RPC cost)
scan_interval_seconds = 5

# Balanced (recommended)
scan_interval_seconds = 10

# Conservative (lower cost, may miss opportunities)
scan_interval_seconds = 30
```

### 3. Profit Thresholds

```toml
# Conservative (fewer but higher profit liquidations)
min_profit_sol = 0.05
min_profit_usd = 50.0

# Balanced (recommended for most users)
min_profit_sol = 0.01
min_profit_usd = 10.0

# Aggressive (more liquidations, smaller profits)
min_profit_sol = 0.005
min_profit_usd = 5.0
```

### 4. Competition Strategy

During high competition:

```toml
priority_fee = 50000  # Increase for faster execution
scan_interval_seconds = 5  # Scan more frequently
```

## Troubleshooting

### No Opportunities Found

**Causes**:
- Market is healthy (good thing!)
- Profit thresholds too high
- Protocols not enabled
- RPC issues

**Solutions**:
```toml
# Lower thresholds
min_profit_sol = 0.005

# Enable more protocols
[protocols.solend]
enabled = true
[protocols.mango]
enabled = true
```

### High Failure Rate

**Causes**:
- Competition (other bots faster)
- Low priority fees
- RPC latency
- Insufficient wallet balance

**Solutions**:
```toml
# Increase priority fee
priority_fee = 50000

# Use premium RPC
http_url = "https://premium-rpc.com"

# Ensure sufficient balance
# Keep at least 5 SOL in wallet
```

### Circuit Breaker Triggered

**Cause**: Too many consecutive failures

**Solution**:
1. Review logs for error patterns
2. Check RPC connection
3. Verify wallet balance
4. Adjust configuration
5. Restart manually after fixes

## Risk Management

### Position Sizing

```toml
# Conservative
max_position_size = 5.0
max_liquidation_size = 25.0

# Moderate  
max_position_size = 10.0
max_liquidation_size = 50.0

# Aggressive
max_position_size = 25.0
max_liquidation_size = 100.0
```

### Capital Requirements

**Minimum**: 2-5 SOL
- 1-3 SOL for liquidations
- 1-2 SOL for gas and buffer

**Recommended**: 10-20 SOL
- More opportunities
- Can handle larger liquidations
- Better capital efficiency

**Optimal**: 50+ SOL
- Maximum flexibility
- Competitive advantage
- Can liquidate whale positions

### Circuit Breaker

```toml
circuit_breaker_failures = 10  # Pause after 10 failures
```

When triggered:
1. Bot stops executing
2. Review what went wrong
3. Fix issues
4. Restart manually

## Advanced Topics

### Flash Loans

Some protocols allow flash loan liquidations:
- Borrow funds to liquidate
- Repay in same transaction
- No capital required
- Complex to implement

### Multi-Bot Strategy

Run multiple instances:

```bash
# Bot 1: Solend only
./liquidation-bot --config solend.toml

# Bot 2: Mango only  
./liquidation-bot --config mango.toml

# Bot 3: Port + Kamino
./liquidation-bot --config other.toml
```

### Price Feed Optimization

- Use Pyth for fastest prices
- Cache prices (< 60s old)
- Parallelize price fetching
- Have backup price sources

## Economics

### Revenue Model

```
Revenue = Liquidation Bonus - Costs

Liquidation Bonus: 5-10% of collateral seized
Costs:
- Gas fees: ~0.001 SOL per liquidation
- Failed transactions: ~0.0005 SOL each
- RPC fees: Variable
```

### Profitability

**Example Month**:
```
Liquidations: 100
Average Profit: 0.05 SOL
Total Revenue: 5 SOL
Costs: 0.5 SOL (gas + RPC)
Net Profit: 4.5 SOL (~$450 at $100/SOL)
```

**Factors Affecting Profitability**:
- Market volatility (more volatility = more liquidations)
- Competition (more bots = lower profits)
- Capital available (more capital = larger liquidations)
- Execution speed (faster = higher success rate)

### ROI

```
ROI = (Net Profit / Capital Deployed) * 100%

Example:
Capital: 10 SOL
Monthly Profit: 2 SOL
Monthly ROI: 20%
Annual ROI: 240%
```

**Note**: Past performance doesn't guarantee future results.

## Ethics and Impact

### Why Liquidation Bots Are Good

✅ **Maintain Protocol Health**: Prevent bad debt accumulation
✅ **Protect Lenders**: Ensure lenders can withdraw funds
✅ **Market Efficiency**: Keep lending rates accurate
✅ **Risk Management**: Incentivize borrowers to manage positions

### Responsible Operation

1. **Don't liquidate more than necessary**: Use close factor limits
2. **Fair pricing**: Don't manipulate prices to trigger liquidations
3. **Transparent**: Be clear about your bot's operation
4. **Protocol health**: Prioritize protocol stability over profit

## Support

- GitHub Issues: Report bugs
- Documentation: Inline code comments
- Community: Discord/Telegram

## Disclaimer

**USE AT YOUR OWN RISK**

- Liquidation bots involve financial risk
- No guarantee of profits
- Competition is real
- Test thoroughly on devnet first
- Start with small capital

---

Happy liquidating! 💧

