use solana_sdk::pubkey::Pubkey;
use solana_sdk::signature::Signature;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone)]
pub struct UnhealthyAccount {
    pub address: Pubkey,
    pub protocol: Protocol,
    pub health_factor: f64,
    pub total_collateral_value: f64,
    pub total_debt_value: f64,
    pub liquidation_incentive: f64,
    pub estimated_profit: f64,
    pub assets: Vec<AssetPosition>,
    pub liabilities: Vec<AssetPosition>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Protocol {
    Solend,
    Mango,
    Port,
    Kamino,
}

#[derive(Debug, Clone)]
pub struct AssetPosition {
    pub mint: Pubkey,
    pub amount: f64,
    pub value_usd: f64,
}

#[derive(Debug, Clone)]
pub struct LiquidationResult {
    pub signature: Signature,
    pub account: Pubkey,
    pub protocol: Protocol,
    pub collateral_seized: f64,
    pub debt_repaid: f64,
    pub profit: f64,
    pub gas_cost: f64,
}

#[derive(Debug, Clone)]
pub struct PriceData {
    pub mint: Pubkey,
    pub price: f64,
    pub confidence: f64,
    pub timestamp: i64,
}

