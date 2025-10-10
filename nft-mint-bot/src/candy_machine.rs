use anyhow::Result;
use solana_client::rpc_client::RpcClient;
use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;
use std::sync::Arc;
use tracing::info;

use crate::{config::Config, types::{CandyMachine, CandyMachineVersion}};

pub struct CandyMachineManager {
    config: Config,
    rpc_client: Arc<RpcClient>,
}

impl CandyMachineManager {
    pub fn new(config: Config, rpc_client: Arc<RpcClient>) -> Result<Self> {
        Ok(Self {
            config,
            rpc_client,
        })
    }

    /// Load candy machine data
    pub async fn get_candy_machine(&self, candy_machine_id: &str) -> Result<CandyMachine> {
        let id = Pubkey::from_str(candy_machine_id)?;

        info!("Loading Candy Machine: {}", id);

        // Fetch account data
        let account = self.rpc_client.get_account(&id)?;

        // Parse candy machine data
        // In production, this would deserialize the actual Candy Machine account
        // using Borsh and the candy machine program's data structure

        Ok(CandyMachine {
            id,
            version: CandyMachineVersion::V3,
            authority: Pubkey::new_unique(),
            items_redeemed: 0,
            items_available: 10000,
            mint_price: 1_000_000_000, // 1 SOL in lamports
            go_live_date: None,
            whitelist_mint_settings: None,
        })
    }

    /// Check if candy machine is live and mintable
    pub fn is_mintable(&self, candy_machine: &CandyMachine) -> bool {
        // Check if go live date has passed
        if let Some(go_live) = candy_machine.go_live_date {
            let now = chrono::Utc::now().timestamp();
            if now < go_live {
                return false;
            }
        }

        // Check if sold out
        if candy_machine.items_redeemed >= candy_machine.items_available {
            return false;
        }

        true
    }

    /// Get remaining NFTs
    pub fn remaining_nfts(&self, candy_machine: &CandyMachine) -> u64 {
        candy_machine.items_available.saturating_sub(candy_machine.items_redeemed)
    }
}

