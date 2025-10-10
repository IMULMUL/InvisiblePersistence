#!/bin/bash

set -e

echo "🚀 Solana Trading Bots Setup"
echo "=============================="
echo ""

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo "❌ Rust not found. Installing..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    source $HOME/.cargo/env
else
    echo "✅ Rust found: $(rustc --version)"
fi

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Installing..."
    sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
else
    echo "✅ Solana CLI found: $(solana --version)"
fi

# Build all bots
echo ""
echo "📦 Building bots..."
cargo build --release

# Copy example configs
echo ""
echo "⚙️  Setting up configurations..."

for bot in sandwich-bot liquidation-bot nft-mint-bot; do
    if [ ! -f "$bot/config.toml" ]; then
        cp "$bot/config.example.toml" "$bot/config.toml"
        echo "  ✓ Created $bot/config.toml"
    else
        echo "  ⚠️  $bot/config.toml already exists, skipping"
    fi
done

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Edit configuration files in each bot directory:"
echo "     - sandwich-bot/config.toml"
echo "     - liquidation-bot/config.toml"
echo "     - nft-mint-bot/config.toml"
echo ""
echo "  2. Set up your wallet keypairs"
echo "     solana-keygen new --outfile ~/.config/solana/id.json"
echo ""
echo "  3. Configure premium RPC endpoints (IMPORTANT!)"
echo ""
echo "  4. Test in dry-run mode:"
echo "     ./target/release/sandwich-bot --dry-run"
echo ""
echo "  5. Read the documentation:"
echo "     - README.md (overview)"
echo "     - ROADMAP.md (development plan)"
echo "     - Each bot has its own GUIDE.md"
echo ""
echo "⚠️  IMPORTANT REMINDERS:"
echo "  - Never commit wallet files or private keys"
echo "  - Test on devnet before using real funds"
echo "  - Start with small amounts"
echo "  - Use at your own risk"
echo ""
echo "Happy trading! 🎯"

