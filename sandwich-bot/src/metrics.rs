use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Metrics {
    pub opportunities_found: u64,
    pub trades_executed: u64,
    pub trades_failed: u64,
    pub total_profit: f64,
    pub total_loss: f64,
}

impl Metrics {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn success_rate(&self) -> f64 {
        if self.trades_executed + self.trades_failed == 0 {
            return 0.0;
        }
        (self.trades_executed as f64 / (self.trades_executed + self.trades_failed) as f64) * 100.0
    }

    pub fn net_profit(&self) -> f64 {
        self.total_profit - self.total_loss
    }

    pub fn average_profit_per_trade(&self) -> f64 {
        if self.trades_executed == 0 {
            return 0.0;
        }
        self.total_profit / self.trades_executed as f64
    }
}

