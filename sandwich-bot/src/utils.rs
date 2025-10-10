use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;

pub fn parse_pubkey(s: &str) -> Result<Pubkey, String> {
    Pubkey::from_str(s).map_err(|e| format!("Invalid pubkey: {}", e))
}

pub fn lamports_to_sol(lamports: u64) -> f64 {
    lamports as f64 / 1_000_000_000.0
}

pub fn sol_to_lamports(sol: f64) -> u64 {
    (sol * 1_000_000_000.0) as u64
}

pub fn format_sol(lamports: u64) -> String {
    format!("{:.4} SOL", lamports_to_sol(lamports))
}

