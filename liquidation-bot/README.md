# 💧 Liquidation Bot for Solana

Automated liquidation bot for Solana lending protocols. Monitors unhealthy positions and executes profitable liquidations.

## Features

- 🔍 Real-time monitoring of lending protocols
- 💰 Multi-protocol support (Solend, Mango, Port, Kamino)
- 📊 Health factor calculation with price feeds
- ⚡ Fast execution with priority fees
- 🛡️ Risk management and circuit breakers
- 📈 Performance metrics and logging

## Quick Start

```bash
# Build
cargo build --release

# Configure
cp config.example.toml config.toml
# Edit config.toml

# Run
./target/release/liquidation-bot
```

## Supported Protocols

- **Solend**: Leading lending protocol on Solana
- **Mango Markets**: Cross-margin trading and lending
- **Port Finance**: Variable and fixed-rate lending
- **Kamino Finance**: Leveraged yield strategies

## How It Works

1. **Monitor**: Scan all lending protocols for unhealthy positions
2. **Calculate**: Determine health factors and liquidation profitability
3. **Execute**: Liquidate positions below health threshold
4. **Profit**: Earn liquidation bonuses (typically 5-10%)

## Configuration

Key settings:

```toml
[strategy]
liquidation_threshold = 1.0    # Trigger when health < 1.0
min_profit_sol = 0.01          # Minimum profit to execute
scan_interval_seconds = 10     # Scan frequency
```

## Documentation

- **[GUIDE.md](GUIDE.md)**: Complete setup guide
- **[BEST_PRACTICES.md](BEST_PRACTICES.md)**: Optimization tips

## Requirements

- Rust 1.70+
- Solana CLI
- Premium RPC provider
- Funded wallet

## Safety

- ✅ More ethical than sandwich trading
- ✅ Helps maintain protocol health
- ⚠️ Still involves financial risk
- 📚 Read docs before running

## License

MIT

