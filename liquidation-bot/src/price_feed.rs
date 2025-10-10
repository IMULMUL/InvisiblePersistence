use anyhow::Result;
use solana_client::rpc_client::RpcClient;
use solana_sdk::pubkey::Pubkey;
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use tracing::{debug, warn};

use crate::types::PriceData;

pub struct PriceFeedManager {
    rpc_client: Arc<RpcClient>,
    price_cache: Arc<RwLock<HashMap<Pubkey, PriceData>>>,
}

impl PriceFeedManager {
    pub fn new(rpc_client: Arc<RpcClient>) -> Result<Self> {
        Ok(Self {
            rpc_client,
            price_cache: Arc::new(RwLock::new(HashMap::new())),
        })
    }

    /// Get price for a token mint
    pub async fn get_price(&self, mint: &Pubkey) -> Result<f64> {
        // Check cache first
        {
            let cache = self.price_cache.read().unwrap();
            if let Some(price_data) = cache.get(mint) {
                // Check if price is recent (< 60 seconds old)
                let now = chrono::Utc::now().timestamp();
                if now - price_data.timestamp < 60 {
                    return Ok(price_data.price);
                }
            }
        }

        // Fetch fresh price
        let price = self.fetch_price_from_pyth(mint).await?;

        // Update cache
        {
            let mut cache = self.price_cache.write().unwrap();
            cache.insert(
                *mint,
                PriceData {
                    mint: *mint,
                    price,
                    confidence: 0.0,
                    timestamp: chrono::Utc::now().timestamp(),
                },
            );
        }

        Ok(price)
    }

    async fn fetch_price_from_pyth(&self, mint: &Pubkey) -> Result<f64> {
        // In production, you would:
        // 1. Map token mint to Pyth price feed address
        // 2. Fetch Pyth price account
        // 3. Parse Pyth price data
        // 4. Return current price

        debug!("Fetching price for {} from Pyth", mint);

        // Placeholder: In production, use actual Pyth integration
        // let pyth_feed = get_pyth_feed_for_mint(mint)?;
        // let price_account = self.rpc_client.get_account(&pyth_feed)?;
        // let price = parse_pyth_price(&price_account.data)?;

        // For now, return mock price
        Ok(100.0)
    }

    /// Get multiple prices in parallel
    pub async fn get_prices(&self, mints: &[Pubkey]) -> Result<HashMap<Pubkey, f64>> {
        let mut prices = HashMap::new();

        for mint in mints {
            match self.get_price(mint).await {
                Ok(price) => {
                    prices.insert(*mint, price);
                }
                Err(e) => {
                    warn!("Failed to get price for {}: {}", mint, e);
                }
            }
        }

        Ok(prices)
    }
}

