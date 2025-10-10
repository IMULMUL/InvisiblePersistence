use anyhow::Result;
use solana_sdk::signature::Keypair;
use std::sync::Mutex;
use tracing::info;

use crate::config::Config;

pub struct WalletManager {
    wallets: Vec<Keypair>,
    current_index: Mutex<usize>,
}

impl WalletManager {
    pub fn new(config: &Config) -> Result<Self> {
        let mut wallets = Vec::new();

        // Load primary wallet
        let primary_wallet = Self::load_wallet(&config.wallets.primary_keypair_path)?;
        info!("Primary wallet: {}", primary_wallet.pubkey());
        wallets.push(primary_wallet);

        // Load additional wallets
        for keypair_path in &config.wallets.additional_keypairs {
            let wallet = Self::load_wallet(keypair_path)?;
            info!("Additional wallet: {}", wallet.pubkey());
            wallets.push(wallet);
        }

        Ok(Self {
            wallets,
            current_index: Mutex::new(0),
        })
    }

    /// Get next wallet in round-robin fashion
    pub fn get_next_wallet(&self) -> Result<&Keypair> {
        let mut index = self.current_index.lock().unwrap();
        let wallet = &self.wallets[*index];

        // Rotate to next wallet
        *index = (*index + 1) % self.wallets.len();

        Ok(wallet)
    }

    /// Get specific wallet by index
    pub fn get_wallet(&self, index: usize) -> Option<&Keypair> {
        self.wallets.get(index)
    }

    /// Get number of wallets
    pub fn wallet_count(&self) -> usize {
        self.wallets.len()
    }

    fn load_wallet(path: &str) -> Result<Keypair> {
        let wallet_bytes = std::fs::read(path)
            .map_err(|e| anyhow::anyhow!("Failed to read wallet file {}: {}", path, e))?;

        let wallet_json: Vec<u8> = serde_json::from_slice(&wallet_bytes)
            .map_err(|e| anyhow::anyhow!("Failed to parse wallet JSON: {}", e))?;

        Keypair::from_bytes(&wallet_json)
            .map_err(|e| anyhow::anyhow!("Invalid keypair bytes: {}", e))
    }
}

