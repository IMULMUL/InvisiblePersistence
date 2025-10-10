# Makefile for Solana Trading Bots

.PHONY: all build test clean help run-sandwich run-liquidation run-nft install format lint check

# Default target
all: build

# Build all bots in release mode
build:
	@echo "Building all bots..."
	cargo build --release

# Build specific bot
build-sandwich:
	@echo "Building sandwich bot..."
	cd sandwich-bot && cargo build --release

build-liquidation:
	@echo "Building liquidation bot..."
	cd liquidation-bot && cargo build --release

build-nft:
	@echo "Building NFT mint bot..."
	cd nft-mint-bot && cargo build --release

# Run tests
test:
	@echo "Running tests..."
	cargo test

test-sandwich:
	cd sandwich-bot && cargo test

test-liquidation:
	cd liquidation-bot && cargo test

test-nft:
	cd nft-mint-bot && cargo test

# Format code
format:
	@echo "Formatting code..."
	cargo fmt --all

# Lint code
lint:
	@echo "Linting code..."
	cargo clippy --all -- -D warnings

# Check code without building
check:
	@echo "Checking code..."
	cargo check --all

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	cargo clean

# Run bots in dry-run mode
run-sandwich:
	@echo "Running sandwich bot (dry-run)..."
	cd sandwich-bot && cargo run --release -- --dry-run

run-liquidation:
	@echo "Running liquidation bot (dry-run)..."
	cd liquidation-bot && cargo run --release -- --dry-run

run-nft:
	@echo "Running NFT mint bot (dry-run)..."
	cd nft-mint-bot && cargo run --release -- --dry-run

# Install development dependencies
install:
	@echo "Installing Rust toolchain..."
	rustup update stable
	rustup component add rustfmt clippy

# Setup development environment
setup:
	@echo "Setting up development environment..."
	@make install
	@echo "Copying example configs..."
	@[ ! -f sandwich-bot/config.toml ] && cp sandwich-bot/config.example.toml sandwich-bot/config.toml || true
	@[ ! -f liquidation-bot/config.toml ] && cp liquidation-bot/config.example.toml liquidation-bot/config.toml || true
	@[ ! -f nft-mint-bot/config.toml ] && cp nft-mint-bot/config.example.toml nft-mint-bot/config.toml || true
	@echo "✅ Setup complete!"
	@echo "⚠️  Remember to:"
	@echo "   1. Edit config.toml files in each bot directory"
	@echo "   2. Set up your wallet keypairs"
	@echo "   3. Configure RPC endpoints"

# Help target
help:
	@echo "Solana Trading Bots - Makefile Commands"
	@echo ""
	@echo "Building:"
	@echo "  make build              Build all bots (release mode)"
	@echo "  make build-sandwich     Build sandwich bot only"
	@echo "  make build-liquidation  Build liquidation bot only"
	@echo "  make build-nft          Build NFT mint bot only"
	@echo ""
	@echo "Testing:"
	@echo "  make test              Run all tests"
	@echo "  make test-sandwich     Test sandwich bot"
	@echo "  make test-liquidation  Test liquidation bot"
	@echo "  make test-nft          Test NFT mint bot"
	@echo ""
	@echo "Development:"
	@echo "  make format            Format code with rustfmt"
	@echo "  make lint              Lint code with clippy"
	@echo "  make check             Check code without building"
	@echo "  make clean             Clean build artifacts"
	@echo ""
	@echo "Running (dry-run mode):"
	@echo "  make run-sandwich      Run sandwich bot"
	@echo "  make run-liquidation   Run liquidation bot"
	@echo "  make run-nft           Run NFT mint bot"
	@echo ""
	@echo "Setup:"
	@echo "  make install           Install dev dependencies"
	@echo "  make setup             Complete development setup"
	@echo ""
	@echo "Help:"
	@echo "  make help              Show this help message"

