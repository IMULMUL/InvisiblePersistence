use solana_sdk::pubkey::Pubkey;
use solana_sdk::signature::Signature;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone)]
pub struct CandyMachine {
    pub id: Pubkey,
    pub version: CandyMachineVersion,
    pub authority: Pubkey,
    pub items_redeemed: u64,
    pub items_available: u64,
    pub mint_price: u64,
    pub go_live_date: Option<i64>,
    pub whitelist_mint_settings: Option<WhitelistSettings>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CandyMachineVersion {
    V2,
    V3,
}

#[derive(Debug, Clone)]
pub struct WhitelistSettings {
    pub mode: WhitelistMode,
    pub mint: Pubkey,
    pub presale: bool,
    pub discount_price: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WhitelistMode {
    BurnEveryTime,
    NeverBurn,
}

#[derive(Debug, Clone)]
pub struct MintResult {
    pub signature: Signature,
    pub nft_mint: Pubkey,
    pub nft_token_account: Pubkey,
    pub metadata: Pubkey,
    pub master_edition: Pubkey,
}

#[derive(Debug, Clone)]
pub struct NFTMetadata {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub seller_fee_basis_points: u16,
    pub creators: Vec<Creator>,
}

#[derive(Debug, Clone)]
pub struct Creator {
    pub address: Pubkey,
    pub verified: bool,
    pub share: u8,
}

