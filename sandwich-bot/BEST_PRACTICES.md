# 🎯 Sandwich Bot - Best Practices and Trading Strategies

## Strategy Overview

Sandwich trading on Solana requires speed, precision, and careful risk management. This guide covers battle-tested strategies for maximizing profits while minimizing risks.

## Core Principles

### 1. Speed is Everything

**Why**: MEV is highly competitive. The fastest bot wins.

**How to Optimize**:
- Use premium RPC providers (Helius, QuickNode)
- Deploy on VPS near RPC servers (AWS us-east-1)
- Enable Jito MEV for guaranteed transaction ordering
- Pre-compile and cache transaction templates
- Use parallel processing for opportunity detection

**Latency Targets**:
- Mempool to detection: < 10ms
- Detection to submission: < 20ms
- Total execution: < 50ms

### 2. Selectivity Over Volume

**Principle**: Quality > Quantity

Execute fewer, high-probability trades rather than many low-quality ones.

**Filters to Apply**:
```toml
min_target_volume = 50000.0      # Only large txns (high price impact)
min_liquidity_usd = 100000.0     # Only established pools
min_profit_percentage = 1.0      # Only high-profit opportunities
```

**Why**:
- Lower gas costs (fewer failed transactions)
- Higher win rate
- Better capital efficiency

### 3. Risk Management First

**Never Risk More Than You Can Afford to Lose**

#### Position Sizing

```toml
# Conservative (recommended for beginners)
max_position_size = 0.5          # 0.5 SOL per trade
max_concurrent_trades = 1        # One at a time

# Moderate (for experienced users)
max_position_size = 2.0          # 2 SOL per trade
max_concurrent_trades = 3        # Up to 3 simultaneous

# Aggressive (for experts only)
max_position_size = 10.0         # 10 SOL per trade
max_concurrent_trades = 5        # Up to 5 simultaneous
```

#### Daily Limits

```toml
max_daily_loss = 5.0             # Stop after losing 5 SOL in a day
circuit_breaker_losses = 5       # Pause after 5 consecutive losses
```

## Advanced Strategies

### Strategy 1: High-Volume Targeting

**Target**: Large institutional trades or whale transactions

**Configuration**:
```toml
min_target_volume = 100000.0     # $100k+ transactions
min_profit_percentage = 0.5      # Lower threshold (volume makes up for it)
priority_fee = 50000             # High priority to win against competition
```

**Pros**:
- High profit per trade
- Predictable price impact

**Cons**:
- Fewer opportunities
- Higher competition
- Higher gas costs

### Strategy 2: High-Frequency Small Trades

**Target**: Medium-sized trades with consistent profits

**Configuration**:
```toml
min_target_volume = 10000.0      # $10k+ transactions
min_profit_percentage = 1.0      # Higher threshold
priority_fee = 10000             # Lower priority (less competition)
max_concurrent_trades = 5        # Many simultaneous trades
```

**Pros**:
- More opportunities
- Lower competition
- Consistent returns

**Cons**:
- Smaller profit per trade
- More gas costs
- Requires more monitoring

### Strategy 3: DEX-Specific Targeting

**Target**: Focus on one DEX you understand deeply

**Configuration**:
```toml
[dex.raydium]
enabled = true

[dex.orca]
enabled = false                  # Disable others

[dex.jupiter]
enabled = false
```

**Pros**:
- Deeper understanding of DEX mechanics
- Optimized instruction building
- Better prediction accuracy

**Cons**:
- Fewer opportunities
- Missing cross-DEX arbitrage

### Strategy 4: Time-Based Trading

**Concept**: Trade during high-volatility periods

**Implementation**:
```rust
// Add to bot.rs
fn is_trading_hours() -> bool {
    let now = chrono::Utc::now();
    let hour = now.hour();
    
    // Trade during US/EU overlap (high volume)
    hour >= 13 && hour <= 21  // 1 PM - 9 PM UTC
}
```

**Best Times** (UTC):
- **13:00-21:00**: US/EU overlap (highest volume)
- **00:00-02:00**: Asian markets open
- **Avoid 04:00-08:00**: Lowest liquidity

## Optimization Techniques

### 1. Priority Fee Optimization

Dynamic priority fees based on network congestion:

```rust
fn calculate_priority_fee(recent_fees: &[u64]) -> u64 {
    let median = median(recent_fees);
    let percentile_75 = percentile(recent_fees, 75);
    
    // Bid at 75th percentile for good execution
    percentile_75
}
```

**Static Tiers**:
```toml
# Low congestion (< 1000 TPS)
priority_fee = 5000

# Medium congestion (1000-3000 TPS)
priority_fee = 20000

# High congestion (> 3000 TPS)
priority_fee = 100000
```

### 2. Slippage Management

```toml
# Conservative (safer)
max_slippage = 0.5

# Moderate (balanced)
max_slippage = 1.0

# Aggressive (risky but more opportunities)
max_slippage = 2.0
```

**Dynamic Slippage**:
Adjust based on pool size:
- Large pools (>$1M): 0.5%
- Medium pools ($100k-$1M): 1.0%
- Small pools (<$100k): 2.0% (or avoid)

### 3. Pool Filtering

Only trade established pools:

```toml
min_liquidity_usd = 100000.0     # $100k minimum
```

**Pool Quality Checklist**:
- [ ] Liquidity > $100k
- [ ] Volume/Liquidity ratio > 0.1
- [ ] Age > 24 hours
- [ ] No recent exploits
- [ ] Liquidity not locked

### 4. Competitor Analysis

Monitor other bots:

```rust
// Track which addresses frequently frontrun
// Increase priority fee when competing with known bots
if is_known_competitor(&transaction.signer) {
    priority_fee *= 2;
}
```

## Common Pitfalls and How to Avoid Them

### ❌ Pitfall 1: Chasing Every Opportunity

**Problem**: Executing too many trades, high gas costs, lower profits

**Solution**: Increase `min_profit_percentage` threshold

### ❌ Pitfall 2: Insufficient Priority Fees

**Problem**: Transactions don't get included or get frontrun

**Solution**: Monitor recent priority fees and adjust dynamically

### ❌ Pitfall 3: Ignoring Failed Transactions

**Problem**: Gas costs add up from failed transactions

**Solution**: 
- Use transaction simulation before submission
- Implement better opportunity validation
- Set stop-loss triggers

### ❌ Pitfall 4: No Risk Management

**Problem**: One bad trade wipes out daily profits

**Solution**: Implement circuit breakers and position limits

### ❌ Pitfall 5: Poor RPC Performance

**Problem**: High latency, missed opportunities

**Solution**: Use premium RPC, monitor latency, have backup RPC

## Performance Monitoring

### Key Metrics to Track

1. **Success Rate**: Target > 80%
```
success_rate = trades_executed / (trades_executed + trades_failed)
```

2. **Profit per Trade**: Track over time
```
avg_profit = total_profit / trades_executed
```

3. **ROI**: Daily and weekly
```
roi = (total_profit - total_loss - gas_costs) / capital
```

4. **Opportunity Conversion Rate**: How many detected opportunities you execute
```
conversion = trades_executed / opportunities_found
```

### Monitoring Script

```bash
#!/bin/bash
# monitor.sh - Track bot performance

while true; do
    echo "=== $(date) ==="
    
    # Check if running
    ps aux | grep sandwich-bot
    
    # Recent trades
    tail -20 sandwich-bot.log | grep "executed successfully"
    
    # Current balance
    solana balance $WALLET_ADDRESS
    
    sleep 300  # Every 5 minutes
done
```

## Scaling Strategies

### Horizontal Scaling

Run multiple bot instances:

```bash
# Instance 1: Focus on Raydium
./sandwich-bot --config raydium-config.toml

# Instance 2: Focus on Orca
./sandwich-bot --config orca-config.toml

# Instance 3: Focus on Jupiter
./sandwich-bot --config jupiter-config.toml
```

### Capital Allocation

Distribute capital across strategies:

- 40% - Conservative (high volume, high confidence)
- 30% - Moderate (medium volume, medium risk)
- 20% - Aggressive (high frequency, small trades)
- 10% - Experimental (testing new strategies)

## Advanced: Jito MEV Integration

Jito ensures atomic execution (front-run and back-run together):

### Benefits
- No risk of front-run executing but back-run failing
- Higher success rate
- Better capital efficiency

### Setup

```bash
# Get Jito auth keypair
# Register at https://jito.wtf/

# Configure bot
export JITO_AUTH_KEYPAIR=/path/to/jito-auth.json
export JITO_BLOCK_ENGINE_URL=https://mainnet.block-engine.jito.wtf
```

### Bundle Configuration

```toml
use_jito = true
jito_tip = 10000  # Tip to block leader in lamports
```

### When to Use Jito

- ✅ High-value opportunities (> 0.1 SOL profit)
- ✅ Competitive situations
- ✅ When atomicity is critical
- ❌ Low-value trades (tip not worth it)

## Testing and Validation

### Devnet Testing

Before running on mainnet:

```bash
# Test on devnet
./sandwich-bot --config devnet-config.toml --dry-run

# Monitor logs
tail -f sandwich-bot.log
```

### Backtesting

Replay historical transactions:

```rust
// Load historical data
let transactions = load_historical_transactions("data.json");

// Simulate bot behavior
for tx in transactions {
    if let Some(opp) = detector.analyze(&tx) {
        println!("Would have profited: {}", opp.estimated_profit);
    }
}
```

### Dry-Run Mode

Test without executing:

```bash
./sandwich-bot --dry-run
```

Logs opportunities without spending SOL.

## Continuous Improvement

### Weekly Review Checklist

- [ ] Analyze success rate (target: > 80%)
- [ ] Review failed transactions (why did they fail?)
- [ ] Check profit trends (improving or declining?)
- [ ] Update priority fee strategy
- [ ] Review competitor activity
- [ ] Adjust thresholds based on market conditions

### Monthly Optimization

- [ ] Backtest new strategies
- [ ] Upgrade dependencies
- [ ] Review RPC performance
- [ ] Analyze market changes
- [ ] Update DEX integrations
- [ ] Refine ML models (if using)

## Ethical Considerations

### Impact on DeFi

Sandwich trading:
- ❌ Extracts value from regular traders
- ❌ Increases execution costs for others
- ❌ Reduces market efficiency
- ✅ Provides liquidity (debatable)

### Responsible Usage

If you choose to run a sandwich bot:

1. **Be Transparent**: Don't mislead users about what you're doing
2. **Use Judiciously**: Don't sandwich small trades from retail users
3. **Follow Rules**: Comply with DEX terms of service
4. **Stay Informed**: Monitor regulatory developments
5. **Consider Alternatives**: Arbitrage and liquidation bots may be more ethical

## Conclusion

Successful sandwich trading requires:

1. **Technical Excellence**: Fast, reliable infrastructure
2. **Strategic Thinking**: Smart opportunity selection
3. **Risk Management**: Protect your capital
4. **Continuous Learning**: Markets evolve, adapt your strategies
5. **Ethical Awareness**: Understand the impact of your actions

Start conservatively, measure everything, and optimize incrementally.

---

**Remember**: Past performance doesn't guarantee future results. Always trade responsibly.

