use anyhow::Result;
use crate::types::{AssetPosition, UnhealthyAccount};

pub struct HealthCalculator;

impl HealthCalculator {
    /// Calculate health factor
    /// Health Factor = Total Collateral Value / Total Debt Value
    /// If < 1.0, the position is underwater and can be liquidated
    pub fn calculate_health_factor(
        collateral: &[AssetPosition],
        debt: &[AssetPosition],
    ) -> Result<f64> {
        let total_collateral: f64 = collateral.iter().map(|pos| pos.value_usd).sum();
        let total_debt: f64 = debt.iter().map(|pos| pos.value_usd).sum();

        if total_debt == 0.0 {
            return Ok(f64::MAX); // No debt = infinite health
        }

        Ok(total_collateral / total_debt)
    }

    /// Calculate weighted health factor (with LTV ratios)
    pub fn calculate_weighted_health_factor(
        collateral: &[(AssetPosition, f64)], // (position, ltv_ratio)
        debt: &[(AssetPosition, f64)],       // (position, borrow_weight)
    ) -> Result<f64> {
        let weighted_collateral: f64 = collateral
            .iter()
            .map(|(pos, ltv)| pos.value_usd * ltv)
            .sum();

        let weighted_debt: f64 = debt
            .iter()
            .map(|(pos, weight)| pos.value_usd * weight)
            .sum();

        if weighted_debt == 0.0 {
            return Ok(f64::MAX);
        }

        Ok(weighted_collateral / weighted_debt)
    }

    /// Estimate liquidation profit
    pub fn estimate_liquidation_profit(
        account: &UnhealthyAccount,
        liquidation_bonus: f64,
    ) -> f64 {
        // Profit = (Collateral Seized * Bonus) - Debt Repaid - Gas
        let collateral_seized = account.total_collateral_value;
        let debt_to_repay = account.total_debt_value;
        let gas_cost = 0.001; // Approximate

        let bonus_value = collateral_seized * liquidation_bonus;
        let profit = bonus_value - debt_to_repay - gas_cost;

        profit.max(0.0)
    }

    /// Calculate maximum safe liquidation amount
    pub fn calculate_max_liquidation_amount(
        account: &UnhealthyAccount,
        max_close_factor: f64, // e.g., 0.5 = can liquidate up to 50% of debt
    ) -> f64 {
        account.total_debt_value * max_close_factor
    }
}

