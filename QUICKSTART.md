# ⚡ Quick Start Guide

Get your Ethereum MEV Arbitrage Bot running in 10 minutes!

---

## 🎯 Prerequisites

- ✅ Node.js 16+ installed
- ✅ 0.5-1 ETH for gas fees
- ✅ Infura or Alchemy API key
- ✅ Basic terminal knowledge

---

## 🚀 5-Step Setup

### Step 1: Install (2 min)

```bash
# Clone repository
git clone https://github.com/devstorm2576916/ethereum-mev-bot.git
cd ethereum-mev-bot

# Install dependencies
npm install
```

### Step 2: Configure (3 min)

```bash
# Copy environment template
cp .env.example .env

# Edit configuration (use nano, vim, or your preferred editor)
nano .env
```

**Minimum required configuration:**
```env
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
ETHEREUM_WSS_URL=wss://mainnet.infura.io/ws/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_without_0x
WALLET_ADDRESS=0xYourWalletAddress
```

### Step 3: Verify Setup (1 min)

```bash
node scripts/check-setup.js
```

Expected output: ✅ All checks should pass

### Step 4: Deploy Contract (2 min)

```bash
# Compile
npx hardhat compile

# Deploy to mainnet (requires ~0.05-0.1 ETH for gas)
npx hardhat run scripts/deploy.js --network mainnet

# Copy the contract address to .env
# Add: ARBITRAGE_CONTRACT_ADDRESS=0xYourContractAddress
```

### Step 5: Run Bot (2 min)

```bash
# Start the bot
npm start

# Or use PM2 for production
pm2 start src/index.js --name mev-bot
```

**That's it! 🎉 Your bot is now running!**

---

## 📊 Monitor Your Bot

### View Logs
```bash
# Real-time logs
tail -f logs/combined.log

# Errors only
tail -f logs/error.log

# Trades only
tail -f logs/trades.log
```

### Telegram Notifications

If configured, you'll receive:
- 🚀 Bot started/stopped
- 💎 Opportunities found
- ✅ Successful trades
- ❌ Failed trades
- 📊 Hourly statistics

---

## ⚙️ Recommended Settings

### Conservative (Beginners)
```env
MIN_PROFIT_THRESHOLD=0.05      # Higher threshold
MAX_GAS_PRICE=80               # Lower max gas
MAX_TRADE_SIZE=5               # Smaller trades
```

### Moderate (Intermediate)
```env
MIN_PROFIT_THRESHOLD=0.02      # Moderate threshold
MAX_GAS_PRICE=100              # Moderate max gas
MAX_TRADE_SIZE=10              # Medium trades
```

### Aggressive (Advanced)
```env
MIN_PROFIT_THRESHOLD=0.01      # Lower threshold
MAX_GAS_PRICE=150              # Higher max gas
MAX_TRADE_SIZE=20              # Larger trades
```

---

## 🔍 Troubleshooting

### "No opportunities found"
✅ **Normal!** Opportunities are rare. Be patient.
- Try lowering `MIN_PROFIT_THRESHOLD`
- Check market volatility (more volatility = more opportunities)
- Ensure your RPC connection is fast

### "Transaction failed"
✅ **Also normal!** Competition is high.
- Increase gas price slightly
- Ensure contract has sufficient allowances
- Check if opportunity is still valid

### "Insufficient funds"
✅ Add more ETH to your wallet
```bash
# Check balance
node -e "require('ethers').providers.JsonRpcProvider('YOUR_RPC').getBalance('YOUR_ADDRESS').then(b => console.log(ethers.utils.formatEther(b)))"
```

### "RPC rate limit exceeded"
✅ Upgrade to paid Infura/Alchemy plan
- Or increase `CHECK_INTERVAL` in .env

---

## 📈 What to Expect

### First 24 Hours
- 1-10 opportunities detected
- 0-3 successful trades
- 0.01-0.1 ETH profit
- Learning phase - observe and optimize

### After Optimization
- 5-30 opportunities per day
- 3-15 successful trades
- 0.1-1 ETH daily profit
- Consistent performance

---

## 🎓 Learn More

- **Strategy Guide**: [docs/STRATEGY.md](docs/STRATEGY.md)
- **Full Setup**: [docs/SETUP.md](docs/SETUP.md)
- **API Docs**: [docs/API.md](docs/API.md)
- **Architecture**: [docs/UML_DIAGRAMS.md](docs/UML_DIAGRAMS.md)

---

## 🆘 Get Help

- 💬 **Telegram**: @YourTelegramUsername
- 📧 **Email**: support@yourdomain.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/devstorm2576916/ethereum-mev-bot/issues)

---

## ⚠️ Important Reminders

1. **Test First**: Use Goerli testnet before mainnet
2. **Start Small**: Begin with minimum thresholds
3. **Monitor**: Watch logs for first 24 hours
4. **Be Patient**: Profitable opportunities take time
5. **Secure Keys**: Never share your private key

---

## 🎯 Success Checklist

- [ ] Dependencies installed
- [ ] .env configured
- [ ] Setup verification passed
- [ ] Smart contract deployed
- [ ] Bot started successfully
- [ ] Logs are being written
- [ ] Telegram notifications working (optional)
- [ ] First opportunity detected

---

## 📞 Need Help?

**Before asking for help, please:**
1. Read the error message carefully
2. Check [docs/SETUP.md](docs/SETUP.md) troubleshooting section
3. Run `node scripts/check-setup.js`
4. Check your .env configuration
5. Verify wallet has sufficient balance

**Then contact us with:**
- Error message (full text)
- Your configuration (hide private keys!)
- Steps you've already tried
- Bot logs (last 50 lines)

---

**Good luck! Happy arbitraging! 🚀**

Remember: This is a competitive field. Not every trade will be profitable, but with patience and optimization, you can achieve consistent results.

---

*Last Updated: October 2025*
*Version: 1.0.0*

