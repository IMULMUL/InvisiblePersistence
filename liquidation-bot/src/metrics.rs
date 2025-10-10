use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Metrics {
    pub opportunities_found: u64,
    pub liquidations_executed: u64,
    pub liquidations_failed: u64,
    pub total_profit: f64,
    pub total_collateral_seized: f64,
    pub total_debt_repaid: f64,
}

impl Metrics {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn success_rate(&self) -> f64 {
        if self.liquidations_executed + self.liquidations_failed == 0 {
            return 0.0;
        }
        (self.liquidations_executed as f64
            / (self.liquidations_executed + self.liquidations_failed) as f64)
            * 100.0
    }

    pub fn average_profit_per_liquidation(&self) -> f64 {
        if self.liquidations_executed == 0 {
            return 0.0;
        }
        self.total_profit / self.liquidations_executed as f64
    }
}

