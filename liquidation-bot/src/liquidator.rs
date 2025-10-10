use anyhow::Result;
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    instruction::Instruction,
    signature::{Keypair, Signature},
    transaction::Transaction,
    pubkey::Pubkey,
};
use std::sync::Arc;
use tracing::{info, warn};

use crate::{
    config::Config,
    types::{LiquidationResult, Protocol, UnhealthyAccount},
    protocols::ProtocolHandler,
};

pub struct Liquidator {
    config: Config,
    rpc_client: Arc<RpcClient>,
    wallet: Arc<Keypair>,
}

impl Liquidator {
    pub fn new(config: Config, rpc_client: Arc<RpcClient>, wallet: Arc<Keypair>) -> Self {
        Self {
            config,
            rpc_client,
            wallet,
        }
    }

    /// Execute a liquidation on an unhealthy account
    pub async fn execute_liquidation(
        &self,
        account: &UnhealthyAccount,
    ) -> Result<LiquidationResult> {
        info!("Executing liquidation on {} ({:?})", account.address, account.protocol);

        // Build liquidation instruction
        let instruction = self.build_liquidation_instruction(account)?;

        // Send transaction
        let signature = self.send_liquidation_transaction(vec![instruction]).await?;

        info!("Liquidation transaction sent: {}", signature);

        // Wait for confirmation
        self.confirm_transaction(signature).await?;

        // Calculate actual profit
        let profit = self.calculate_profit(account).await?;

        Ok(LiquidationResult {
            signature,
            account: account.address,
            protocol: account.protocol.clone(),
            collateral_seized: account.total_collateral_value,
            debt_repaid: account.total_debt_value,
            profit,
            gas_cost: 0.001, // Approximate
        })
    }

    fn build_liquidation_instruction(&self, account: &UnhealthyAccount) -> Result<Instruction> {
        match &account.protocol {
            Protocol::Solend => self.build_solend_liquidation(account),
            Protocol::Mango => self.build_mango_liquidation(account),
            Protocol::Port => self.build_port_liquidation(account),
            Protocol::Kamino => self.build_kamino_liquidation(account),
        }
    }

    fn build_solend_liquidation(&self, account: &UnhealthyAccount) -> Result<Instruction> {
        // Build Solend liquidation instruction
        // Solend liquidation format:
        // - liquidate_obligation_and_redeem_reserve_collateral
        
        let program_id = Pubkey::try_from(self.config.protocols.solend.program_id.as_str())?;
        
        // In production, this would construct the actual instruction
        // using Solend's SDK or manual instruction building
        
        info!("Building Solend liquidation instruction");
        
        Ok(Instruction {
            program_id,
            accounts: vec![
                // Obligation account (the unhealthy account)
                // Lending market
                // Repay reserve
                // Repay reserve liquidity supply
                // Withdraw reserve
                // Withdraw reserve collateral supply
                // Liquidator accounts
                // Clock sysvar
                // Token program
            ],
            data: vec![],
        })
    }

    fn build_mango_liquidation(&self, account: &UnhealthyAccount) -> Result<Instruction> {
        // Build Mango Markets liquidation instruction
        info!("Building Mango Markets liquidation instruction");
        todo!("Implement Mango liquidation instruction")
    }

    fn build_port_liquidation(&self, account: &UnhealthyAccount) -> Result<Instruction> {
        // Build Port Finance liquidation instruction
        info!("Building Port Finance liquidation instruction");
        todo!("Implement Port liquidation instruction")
    }

    fn build_kamino_liquidation(&self, account: &UnhealthyAccount) -> Result<Instruction> {
        // Build Kamino Finance liquidation instruction
        info!("Building Kamino Finance liquidation instruction");
        todo!("Implement Kamino liquidation instruction")
    }

    async fn send_liquidation_transaction(
        &self,
        instructions: Vec<Instruction>,
    ) -> Result<Signature> {
        // Get recent blockhash
        let recent_blockhash = self.rpc_client.get_latest_blockhash()?;

        // Add compute budget for priority fee
        let mut all_instructions = vec![self.build_compute_budget_instruction()?];
        all_instructions.extend(instructions);

        // Build and sign transaction
        let transaction = Transaction::new_signed_with_payer(
            &all_instructions,
            Some(&self.wallet.pubkey()),
            &[self.wallet.as_ref()],
            recent_blockhash,
        );

        // Send transaction
        let signature = self.rpc_client.send_and_confirm_transaction(&transaction)?;

        Ok(signature)
    }

    fn build_compute_budget_instruction(&self) -> Result<Instruction> {
        use solana_sdk::compute_budget::ComputeBudgetInstruction;

        Ok(ComputeBudgetInstruction::set_compute_unit_price(
            self.config.strategy.priority_fee,
        ))
    }

    async fn confirm_transaction(&self, signature: Signature) -> Result<()> {
        use solana_client::rpc_config::RpcTransactionConfig;
        use solana_transaction_status::UiTransactionEncoding;

        let mut attempts = 0;
        let max_attempts = 60;

        loop {
            if attempts >= max_attempts {
                anyhow::bail!("Transaction did not confirm in time");
            }

            match self.rpc_client.get_transaction_with_config(
                &signature,
                RpcTransactionConfig {
                    encoding: Some(UiTransactionEncoding::Json),
                    commitment: Some(self.rpc_client.commitment()),
                    max_supported_transaction_version: Some(0),
                },
            ) {
                Ok(_) => return Ok(()),
                Err(_) => {
                    tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
                    attempts += 1;
                }
            }
        }
    }

    async fn calculate_profit(&self, account: &UnhealthyAccount) -> Result<f64> {
        // Calculate actual profit from liquidation
        // Profit = (Collateral Seized * Liquidation Bonus) - Debt Repaid - Gas Costs
        
        let liquidation_bonus = account.liquidation_incentive;
        let collateral_value = account.total_collateral_value;
        let debt_value = account.total_debt_value;
        
        let profit = (collateral_value * (1.0 + liquidation_bonus)) - debt_value - 0.001;
        
        Ok(profit.max(0.0))
    }
}

