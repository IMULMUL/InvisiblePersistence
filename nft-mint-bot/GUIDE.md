# 🖼️ NFT Mint Bot - Complete Guide

## Overview

The NFT Mint Bot automates minting NFTs from Solana Candy Machines with lightning-fast execution. Designed for both whitelist and public mints.

## How NFT Minting Works

### Candy Machine Basics

A Candy Machine is a Solana program that distributes NFTs:
- **Items Available**: Total NFTs in collection
- **Items Redeemed**: NFTs already minted
- **Price**: Cost per NFT (usually 0.5-2 SOL)
- **Go Live Date**: When minting starts
- **Whitelist**: Pre-approved wallets (optional)

### Mint Process

1. User sends transaction with payment
2. Candy Machine validates (whitelist, timing, payment)
3. NFT is minted to user's wallet
4. Metadata and master edition created
5. Transaction confirmed

### Why Use a Bot?

Manual minting is slow:
- Finding mint button: ~1-2 seconds
- Clicking and approving: ~1-3 seconds
- Total: 2-5 seconds

Bot minting is fast:
- Pre-built transactions: Ready instantly
- Automated submission: ~50-100ms
- Multiple attempts: Retry on failure
- Result: 10-100x faster

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
cd nft-mint-bot
cargo build --release
```

### Configuration

```bash
cp config.example.toml config.toml
nano config.toml
```

#### Basic Configuration

```toml
[rpc]
http_url = "https://your-premium-rpc.com"  # ← CRITICAL!

[wallets]
primary_keypair_path = "wallet.json"

[[projects]]
name = "My NFT Project"
candy_machine_id = "CandyMachinePublicKey"
mint_start_time = 1699999999  # Unix timestamp
mint_price = 1.0
max_mints_per_wallet = 3
enabled = true

[strategy]
priority_fee = 100000        # 0.0001 SOL priority fee
mint_attempts = 3
attempt_delay_ms = 100
```

## Running the Bot

### Test Run (Dry Run)

```bash
# Test without actually minting
./target/release/nft-mint-bot --dry-run
```

### Live Run

```bash
# For real minting
./target/release/nft-mint-bot
```

### With Custom Config

```bash
./target/release/nft-mint-bot --config my-project.toml
```

## Strategies

### Strategy 1: Single Wallet, Multiple Attempts

**Best for**: Standard launches

```toml
[wallets]
primary_keypair_path = "wallet.json"
additional_keypairs = []

[strategy]
mint_attempts = 5
attempt_delay_ms = 100
multi_wallet_enabled = false
```

**Pros**: Simple, works for most launches

**Cons**: Limited by per-wallet mint limit

### Strategy 2: Multiple Wallets

**Best for**: High-value projects (limited per wallet)

```toml
[wallets]
primary_keypair_path = "wallet1.json"
additional_keypairs = [
    "wallet2.json",
    "wallet3.json",
    "wallet4.json",
    "wallet5.json"
]

[strategy]
multi_wallet_enabled = true
mint_attempts = 2
```

**Pros**: Bypass per-wallet limits

**Cons**: Need to fund multiple wallets

### Strategy 3: Pre-Built Transactions

**Best for**: Hyper-competitive launches

```toml
[strategy]
prebuild_transactions = true
priority_fee = 500000  # Higher fee
mint_attempts = 10
attempt_delay_ms = 50
```

**Pros**: Fastest execution

**Cons**: Higher gas costs from retries

## Timing

### Getting Mint Time

1. **Official Announcement**: Check Discord/Twitter
2. **Candy Machine**: Query on-chain data
3. **NFT Calendars**: Sites like mint.fun, howrare.is

### Convert to Unix Timestamp

```bash
# Using date command (Linux/Mac)
date -d "2024-10-15 15:00:00 UTC" +%s

# Online tool
# https://www.unixtimestamp.com/
```

### Set in Config

```toml
[[projects]]
name = "Project Name"
mint_start_time = 1697378400  # Your timestamp
```

## Optimization

### 1. RPC Selection

**Critical for success!**

```toml
[rpc]
# ❌ BAD: Public RPC (slow, rate limited)
http_url = "https://api.mainnet-beta.solana.com"

# ✅ GOOD: Premium RPC
http_url = "https://YOUR-PREMIUM-RPC.com"
```

**Recommended RPCs**:
- Helius (https://helius.dev)
- QuickNode (https://quicknode.com)
- Triton (https://triton.one)

### 2. Priority Fees

Balance speed vs cost:

```toml
# Low competition (100k lamports = 0.0001 SOL)
priority_fee = 100000

# Medium competition (500k lamports = 0.0005 SOL)
priority_fee = 500000

# High competition (1M lamports = 0.001 SOL)
priority_fee = 1000000
```

### 3. Network Location

Deploy bot close to RPC servers:
- **AWS us-east-1**: Most Solana infrastructure
- **Local**: Better than cloud if you have fast internet
- **VPS**: Consistent latency

### 4. System Optimization

```bash
# Increase file descriptors
ulimit -n 65536

# Disable swap (if enough RAM)
sudo swapoff -a

# Kill unnecessary processes
# Close Chrome, Spotify, etc.
```

## Troubleshooting

### Mint Failed: "Sold Out"

**Cause**: Collection sold out before your mint

**Solutions**:
- Use faster RPC
- Increase priority fee
- Reduce attempt_delay_ms
- Pre-build transactions

### Mint Failed: "Invalid Whitelist Token"

**Cause**: Not on whitelist or token not in wallet

**Solutions**:
- Verify whitelist token in wallet
- Check token mint address
- Ensure correct wallet

### Mint Failed: "Not Live Yet"

**Cause**: Mint hasn't started

**Solutions**:
- Verify mint_start_time
- Check candy machine on-chain
- Ensure clock is synchronized

### Transaction Timeout

**Cause**: RPC slow or network congested

**Solutions**:
- Switch to faster RPC
- Increase timeout_seconds
- Increase priority fee

### Multiple Attempts, All Failed

**Causes**:
- Priority fee too low
- RPC too slow
- Network congestion

**Solutions**:
```toml
[strategy]
priority_fee = 1000000  # Increase significantly
mint_attempts = 10      # More attempts
attempt_delay_ms = 50   # Retry faster

[rpc]
timeout_seconds = 60    # Longer timeout
```

## Multi-Project Setup

Monitor multiple launches:

```toml
[[projects]]
name = "Project A"
candy_machine_id = "CandyMachineA111111111111111111111"
mint_start_time = 1697378400
enabled = true

[[projects]]
name = "Project B"
candy_machine_id = "CandyMachineB222222222222222222222"
mint_start_time = 1697382000
enabled = true

[[projects]]
name = "Old Project (disabled)"
candy_machine_id = "CandyMachineC333333333333333333333"
enabled = false
```

Bot will automatically mint from all enabled projects at their respective times.

## Advanced Features

### Whitelist Minting

```toml
# Whitelist tokens are automatically detected
# Bot will use whitelist if available
[[projects]]
name = "Whitelist Project"
# Whitelist price is read from candy machine
```

### Randomized Timing

To avoid detection:

```rust
// Code automatically adds 0-50ms random delay
// Makes bot appear more human-like
```

### Transaction Simulation

Before sending, bot simulates transaction:
- Validates mint is possible
- Checks wallet balance
- Verifies candy machine state

## Success Metrics

Track your bot's performance:

```
📊 Final Statistics:
  Total Attempts: 15
  Successful Mints: 12
  Failed Mints: 3
  Success Rate: 80.00%
```

**Good Success Rate**: > 70%
**Excellent Success Rate**: > 85%

## Economics

### Costs

```
Mint Price: 1 SOL
Priority Fee: 0.001 SOL (per attempt)
Total Attempts: 3
Total Cost: 1.003 SOL
```

### Potential Profit

```
Mint: 1 SOL
Floor Price: 3 SOL (after reveal)
Listing Fee: 0.03 SOL (1%)
Net Profit: 1.97 SOL (197% ROI)
```

**Note**: Not all mints are profitable. Do your research!

## Ethics

### Responsible Botting

✅ **DO**:
- Respect project rules
- Use bots for personal use
- Follow per-wallet limits
- Support projects you believe in

❌ **DON'T**:
- Scalp entire collections
- Bot projects that ban bots
- Manipulate floor prices
- Ruin experience for community

### Legal Considerations

- Botting may violate project ToS
- Could be blocked/blacklisted
- No legal protection if caught
- Use at your own risk

## Best Practices

1. **Test First**: Always dry-run before live mint
2. **Fund Adequately**: Keep 2x mint price in wallet
3. **Monitor Discord**: Last-minute changes happen
4. **Have Backup**: Manual mint as fallback
5. **Stay Updated**: NFT tech evolves quickly

## Support

- GitHub Issues: Bug reports
- Code Comments: Implementation details
- Community: Discord/Telegram discussions

## Disclaimer

**USE AT YOUR OWN RISK**

- Minting bots may violate project rules
- No guarantee of success
- Could lose SOL on failed mints
- Projects may detect and blacklist bots
- Test on devnet first!

---

Happy minting! 🖼️
