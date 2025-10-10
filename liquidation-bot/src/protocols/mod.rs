pub mod solend;
pub mod mango;
pub mod port;
pub mod kamino;

use anyhow::Result;
use async_trait::async_trait;
use solana_client::rpc_client::RpcClient;

use crate::types::UnhealthyAccount;

/// Trait for protocol-specific handlers
#[async_trait]
pub trait ProtocolHandler: Send + Sync {
    /// Get all accounts for this protocol
    async fn get_all_accounts(&self, rpc_client: &RpcClient) -> Result<Vec<AccountData>>;

    /// Calculate health factor for an account
    fn calculate_health_factor(&self, account: &AccountData) -> Result<f64>;

    /// Parse unhealthy account data
    fn parse_unhealthy_account(
        &self,
        account: AccountData,
        health_factor: f64,
    ) -> Result<UnhealthyAccount>;
}

#[derive(Debug, Clone)]
pub struct AccountData {
    pub address: solana_sdk::pubkey::Pubkey,
    pub data: Vec<u8>,
}

