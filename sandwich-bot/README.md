# 🥪 Sandwich Bot for Solana

High-performance MEV sandwich bot for Solana DEXs written in Rust.

## Features

- ⚡ Real-time mempool monitoring via Geyser/WebSocket
- 🎯 Multi-DEX support (Raydium, Orca, Jupiter)
- 💰 Profitability calculator with price impact analysis
- 🛡️ Built-in risk management (stop-loss, circuit breaker)
- 🚀 Jito MEV integration for atomic execution
- 📊 Performance metrics and logging
- 🔒 Secure wallet management

## Quick Start

```bash
# Build
cargo build --release

# Configure
cp config.example.toml config.toml
# Edit config.toml with your settings

# Run
./target/release/sandwich-bot
```

## Documentation

- **[GUIDE.md](GUIDE.md)**: Complete setup and operation guide
- **[BEST_PRACTICES.md](BEST_PRACTICES.md)**: Trading strategies and optimization tips

## Requirements

- Rust 1.70+
- Solana CLI
- Premium RPC provider (Helius, QuickNode, Triton)
- Funded wallet

## Configuration

Key settings in `config.toml`:

```toml
[strategy]
min_profit_sol = 0.01       # Minimum profit threshold
priority_fee = 10000        # Priority fee for fast execution
use_jito = true             # Use Jito MEV bundles

[risk]
max_position_size = 1.0     # Max SOL per trade
max_daily_loss = 5.0        # Daily loss limit
```

## How It Works

1. **Monitor**: Watch mempool for large DEX transactions
2. **Analyze**: Calculate price impact and profitability
3. **Execute**: Front-run → Target → Back-run (sandwich)
4. **Profit**: Capture price difference

## Performance

- Transaction Latency: < 50ms
- Success Rate: > 85% (with proper config)
- Uptime: 99.9%

## Safety

- ⚠️ Use at your own risk
- 🧪 Test on devnet first
- 💰 Start with small amounts
- 📚 Read GUIDE.md thoroughly

## License

MIT License - see LICENSE file

## Disclaimer

Sandwich trading extracts value from other traders and may be considered unethical. Use responsibly and understand the implications.

