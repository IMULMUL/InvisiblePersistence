# Multi-Chain Setup Guide

This project now supports both **Ethereum** and **BNB Chain** (Binance Smart Chain). This guide explains how to configure and use the bot on each chain.

## Quick Start

### 1. Select Your Chain

Set the `CHAIN` environment variable to either `ethereum` or `bnb`:

```bash
# For Ethereum
CHAIN=ethereum

# For BNB Chain
CHAIN=bnb
```

### 2. Configure Network URLs

#### Ethereum Configuration

```bash
# Ethereum Mainnet
CHAIN=ethereum
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
ETHEREUM_WSS_URL=wss://mainnet.infura.io/ws/v3/YOUR_INFURA_KEY
CHAIN_ID=1

# Ethereum Testnet (Goerli)
CHAIN=ethereum
NETWORK=testnet
ETHEREUM_TESTNET_RPC_URL=https://goerli.infura.io/v3/YOUR_INFURA_KEY
ETHEREUM_TESTNET_WSS_URL=wss://goerli.infura.io/ws/v3/YOUR_INFURA_KEY
CHAIN_ID=5
```

#### BNB Chain Configuration

```bash
# BNB Chain Mainnet
CHAIN=bnb
BNB_RPC_URL=https://bsc-dataseed.binance.org/
BNB_WSS_URL=wss://bsc-ws-node.nariox.org:443
CHAIN_ID=56

# BNB Chain Testnet
CHAIN=bnb
NETWORK=testnet
BNB_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
BNB_TESTNET_WSS_URL=wss://bsc-testnet-ws-node.nariox.org:443
CHAIN_ID=97
```

### 3. Configure Wallet

```bash
# Wallet configuration (same for both chains)
PRIVATE_KEY=your_private_key_here_without_0x
WALLET_ADDRESS=0xYourWalletAddress
```

### 4. Configure Flashloan Provider

#### Ethereum (Aave V3)

```bash
FLASHLOAN_PROVIDER=0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9
# Or use the default Aave V3 address (already configured)
```

#### BNB Chain

```bash
# Configure your flashloan provider (PancakeSwap, DODOV2, etc.)
BNB_FLASHLOAN_PROVIDER=your_flashloan_provider_address
BNB_FLASHLOAN_PROVIDER_NAME=PancakeSwap
BNB_FLASHLOAN_FEE=0.0009
```

**Note:** BNB Chain flashloan providers vary. Common options:
- PancakeSwap V2/V3
- DODOV2 Protocol
- Other protocols

### 5. Deploy Smart Contract

#### Ethereum

```bash
# Deploy to Ethereum mainnet
npx hardhat run scripts/deploy.js --network ethereum

# Or use the mainnet alias
npx hardhat run scripts/deploy.js --network mainnet
```

#### BNB Chain

```bash
# Deploy to BNB Chain mainnet
npx hardhat run scripts/deploy.js --network bnb

# Or use the bsc alias
npx hardhat run scripts/deploy.js --network bsc
```

**Note:** You'll need to update the deployment script (`scripts/deploy.js`) to use chain-specific contract addresses.

### 6. Set Contract Address

After deployment, add the contract address to your `.env` file:

```bash
ARBITRAGE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

### 7. Configure Bot Settings

```bash
# Bot configuration (chain-agnostic)
MIN_PROFIT_THRESHOLD=0.01    # Minimum profit per arbitrage
MAX_GAS_PRICE=100            # Max gas price (Ethereum: 100 gwei, BNB Chain: 5 gwei)
MAX_TRADE_SIZE=10            # Maximum trade size
CHECK_INTERVAL=1000          # Check interval in milliseconds
```

**Note:** BNB Chain typically has lower gas prices, so you may want to adjust `MAX_GAS_PRICE`:

```bash
# For BNB Chain
MAX_GAS_PRICE=5              # Lower gas prices on BNB Chain

# For Ethereum
MAX_GAS_PRICE=100            # Higher gas prices on Ethereum
```

### 8. Run the Bot

```bash
# Start the bot
npm start

# Or in development mode
npm run dev
```

## Chain-Specific Features

### Ethereum

- **DEXes Supported:**
  - Uniswap V2
  - Uniswap V3
  - SushiSwap

- **Flashloan Provider:** Aave V3

- **Native Token:** ETH

- **Gas Prices:** Higher (typically 50-200 gwei)

### BNB Chain

- **DEXes Supported:**
  - PancakeSwap V2
  - PancakeSwap V3
  - Biswap
  - ApeSwap

- **Flashloan Provider:** Configurable (PancakeSwap, DODOV2, etc.)

- **Native Token:** BNB

- **Gas Prices:** Lower (typically 3-5 gwei)

## Environment Variables Reference

### Required Variables

```bash
# Chain selection
CHAIN=ethereum|bnb

# Network configuration (chain-specific)
ETHEREUM_RPC_URL=...          # Ethereum RPC URL
ETHEREUM_WSS_URL=...          # Ethereum WebSocket URL
BNB_RPC_URL=...               # BNB Chain RPC URL
BNB_WSS_URL=...               # BNB Chain WebSocket URL

# Wallet
PRIVATE_KEY=...               # Private key (without 0x)
WALLET_ADDRESS=...            # Wallet address

# Contract
ARBITRAGE_CONTRACT_ADDRESS=... # Deployed contract address
```

### Optional Variables

```bash
# Network type
NETWORK=mainnet|testnet       # Default: mainnet
TESTNET=true|false            # Alternative to NETWORK

# Chain ID (auto-detected, but can be overridden)
CHAIN_ID=1|56|5|97

# Flashloan provider (chain-specific)
FLASHLOAN_PROVIDER=...        # Generic flashloan provider
BNB_FLASHLOAN_PROVIDER=...    # BNB Chain flashloan provider
BNB_FLASHLOAN_PROVIDER_NAME=... # BNB Chain flashloan provider name
BNB_FLASHLOAN_FEE=...         # BNB Chain flashloan fee

# Bot settings
MIN_PROFIT_THRESHOLD=0.01     # Minimum profit threshold
MAX_GAS_PRICE=100             # Maximum gas price (gwei)
MAX_TRADE_SIZE=10             # Maximum trade size
CHECK_INTERVAL=1000           # Check interval (ms)
SLIPPAGE_TOLERANCE=0.5        # Slippage tolerance (%)

# Telegram (optional)
TELEGRAM_BOT_TOKEN=...        # Telegram bot token
TELEGRAM_CHAT_ID=...          # Telegram chat ID
```

## Switching Between Chains

To switch between chains, simply change the `CHAIN` environment variable and update the corresponding RPC URLs:

```bash
# Switch to Ethereum
CHAIN=ethereum
ETHEREUM_RPC_URL=...
ETHEREUM_WSS_URL=...

# Switch to BNB Chain
CHAIN=bnb
BNB_RPC_URL=...
BNB_WSS_URL=...
```

Then restart the bot:

```bash
npm start
```

## Verification

Run the setup verification script to check your configuration:

```bash
npm run check-setup
```

This will verify:
- Chain configuration
- RPC connectivity
- Wallet setup
- Contract deployment
- Bot settings

## Troubleshooting

### Common Issues

1. **Wrong Chain ID**: Make sure `CHAIN_ID` matches your selected chain
2. **RPC URL Issues**: Verify your RPC URLs are correct and accessible
3. **Flashloan Provider**: Ensure the flashloan provider address is correct for your chain
4. **Gas Prices**: Adjust `MAX_GAS_PRICE` based on your chain (lower for BNB Chain)
5. **Contract Address**: Verify your contract is deployed on the correct chain

### Getting Help

- Check the main README.md for general setup instructions
- Review the chain-specific configuration in `src/config/chains.js`
- Verify your environment variables with `npm run check-setup`

## Next Steps

- Deploy your smart contract to the selected chain
- Configure your DEX addresses (if using custom addresses)
- Set up Telegram notifications (optional)
- Start monitoring for arbitrage opportunities

---

**Note:** This bot requires a deployed smart contract on each chain. Make sure to deploy the contract to the chain you want to use before running the bot.

