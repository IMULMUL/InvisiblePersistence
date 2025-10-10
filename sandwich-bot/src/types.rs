use solana_sdk::pubkey::Pubkey;
use solana_sdk::signature::Signature;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub signature: Signature,
    pub accounts: Vec<Pubkey>,
    pub program_id: Pubkey,
    pub data: Vec<u8>,
    pub slot: u64,
}

#[derive(Debug, Clone)]
pub struct SandwichOpportunity {
    pub target_transaction: Transaction,
    pub dex: DexType,
    pub token_in: Pubkey,
    pub token_out: Pubkey,
    pub amount: f64,
    pub estimated_profit: f64,
    pub price_impact: f64,
    pub front_run_amount: f64,
    pub back_run_amount: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DexType {
    Raydium,
    Orca,
    Jupiter,
}

#[derive(Debug, Clone)]
pub struct ExecutionResult {
    pub front_run_signature: Signature,
    pub target_signature: Signature,
    pub back_run_signature: Signature,
    pub actual_profit: f64,
    pub gas_cost: f64,
}

#[derive(Debug, Clone)]
pub struct PoolInfo {
    pub address: Pubkey,
    pub token_a: Pubkey,
    pub token_b: Pubkey,
    pub reserve_a: u64,
    pub reserve_b: u64,
    pub liquidity_usd: f64,
}

