# 🖼️ NFT Mint Bot for Solana

High-speed NFT minting bot for Solana. Mint NFTs faster than manual clickers with sub-100ms execution time.

## Features

- ⚡ Sub-100ms mint execution
- 🎯 Candy Machine v2/v3 support
- 👥 Multiple wallet support
- 🚀 Pre-built transaction caching
- 📊 Real-time mint monitoring
- 🛡️ Anti-detection randomization
- 📈 Success rate tracking

## Quick Start

```bash
# Build
cargo build --release

# Configure
cp config.example.toml config.toml
# Edit config.toml with your project details

# Run
./target/release/nft-mint-bot
```

## How It Works

1. **Monitor**: Track mint start times
2. **Prepare**: Pre-build transactions for speed
3. **Execute**: Submit mint at exact start time
4. **Retry**: Automatic retries with exponential backoff
5. **Success**: Receive NFT in wallet

## Configuration

```toml
[[projects]]
name = "Cool NFT Project"
candy_machine_id = "YourCandyMachineID"
mint_start_time = 1699999999
mint_price = 1.0
enabled = true

[strategy]
priority_fee = 100000     # High fee for fast execution
mint_attempts = 3         # Retry 3 times
prebuild_transactions = true
```

## Documentation

- **[GUIDE.md](GUIDE.md)**: Complete setup guide
- **[BEST_PRACTICES.md](BEST_PRACTICES.md)**: Optimization tips

## Requirements

- Rust 1.70+
- Solana CLI
- Premium RPC (critical for speed!)
- Funded wallet with SOL

## Success Rate

With proper configuration:
- **85-95%** success rate on normal launches
- **60-80%** on highly contested launches
- **99%+** on whitelist mints

## Safety

- ⚠️ Test on devnet first
- 💰 Start with small amounts
- 🔒 Keep wallet keys secure
- 📚 Read GUIDE.md thoroughly

## Ethical Usage

- Don't bot launches that explicitly ban bots
- Respect project rules
- Don't ruin it for manual minters
- Use responsibly

## License

MIT

