use anyhow::Result;
use solana_client::rpc_client::RpcClient;
use std::sync::Arc;
use tracing::{debug, info};

use crate::{
    config::Config,
    protocols::{self, ProtocolHandler},
    types::{Protocol, UnhealthyAccount},
};

pub struct AccountMonitor {
    config: Config,
    rpc_client: Arc<RpcClient>,
}

impl AccountMonitor {
    pub fn new(config: Config, rpc_client: Arc<RpcClient>) -> Result<Self> {
        Ok(Self {
            config,
            rpc_client,
        })
    }

    /// Find all accounts eligible for liquidation across all protocols
    pub async fn find_unhealthy_accounts(&self) -> Result<Vec<UnhealthyAccount>> {
        let mut all_unhealthy = Vec::new();

        // Check Solend
        if self.config.protocols.solend.enabled {
            debug!("Scanning Solend accounts...");
            let solend_accounts = self.scan_protocol(Protocol::Solend).await?;
            all_unhealthy.extend(solend_accounts);
        }

        // Check Mango
        if self.config.protocols.mango.enabled {
            debug!("Scanning Mango Markets accounts...");
            let mango_accounts = self.scan_protocol(Protocol::Mango).await?;
            all_unhealthy.extend(mango_accounts);
        }

        // Check Port
        if self.config.protocols.port.enabled {
            debug!("Scanning Port Finance accounts...");
            let port_accounts = self.scan_protocol(Protocol::Port).await?;
            all_unhealthy.extend(port_accounts);
        }

        // Check Kamino
        if self.config.protocols.kamino.enabled {
            debug!("Scanning Kamino Finance accounts...");
            let kamino_accounts = self.scan_protocol(Protocol::Kamino).await?;
            all_unhealthy.extend(kamino_accounts);
        }

        // Filter by profitability
        let profitable_accounts: Vec<UnhealthyAccount> = all_unhealthy
            .into_iter()
            .filter(|acc| acc.estimated_profit >= self.config.strategy.min_profit_sol)
            .collect();

        Ok(profitable_accounts)
    }

    async fn scan_protocol(&self, protocol: Protocol) -> Result<Vec<UnhealthyAccount>> {
        let handler = Self::get_protocol_handler(&protocol, &self.config)?;
        
        // Get all accounts for this protocol
        let accounts = handler.get_all_accounts(&self.rpc_client).await?;
        
        debug!("Found {} total accounts for {:?}", accounts.len(), protocol);

        // Filter for unhealthy accounts
        let mut unhealthy = Vec::new();
        for account_data in accounts {
            let health_factor = handler.calculate_health_factor(&account_data)?;

            if health_factor < self.config.strategy.liquidation_threshold {
                let account = handler.parse_unhealthy_account(account_data, health_factor)?;
                unhealthy.push(account);
            }
        }

        info!(
            "Found {} unhealthy accounts on {:?}",
            unhealthy.len(),
            protocol
        );

        Ok(unhealthy)
    }

    fn get_protocol_handler(
        protocol: &Protocol,
        config: &Config,
    ) -> Result<Box<dyn ProtocolHandler>> {
        match protocol {
            Protocol::Solend => Ok(Box::new(protocols::solend::SolendHandler::new(config.clone()))),
            Protocol::Mango => Ok(Box::new(protocols::mango::MangoHandler::new(config.clone()))),
            Protocol::Port => Ok(Box::new(protocols::port::PortHandler::new(config.clone()))),
            Protocol::Kamino => Ok(Box::new(protocols::kamino::KaminoHandler::new(config.clone()))),
        }
    }
}

