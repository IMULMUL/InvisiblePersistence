use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Metrics {
    pub attempts: u64,
    pub successful_mints: u64,
    pub failed_mints: u64,
    pub total_spent: f64,
}

impl Metrics {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn success_rate(&self) -> f64 {
        if self.attempts == 0 {
            return 0.0;
        }
        (self.successful_mints as f64 / self.attempts as f64) * 100.0
    }

    pub fn average_cost_per_mint(&self) -> f64 {
        if self.successful_mints == 0 {
            return 0.0;
        }
        self.total_spent / self.successful_mints as f64
    }
}

