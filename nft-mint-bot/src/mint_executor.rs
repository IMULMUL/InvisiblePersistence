use anyhow::Result;
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    instruction::Instruction,
    pubkey::Pubkey,
    signature::{Keypair, Signature},
    signer::Signer,
    system_instruction,
    transaction::Transaction,
};
use std::sync::Arc;
use tracing::{info, debug};

use crate::{
    config::{Config, ProjectConfig},
    types::{CandyMachine, MintResult},
};

pub struct MintExecutor {
    config: Config,
    rpc_client: Arc<RpcClient>,
}

impl MintExecutor {
    pub fn new(config: Config, rpc_client: Arc<RpcClient>) -> Self {
        Self {
            config,
            rpc_client,
        }
    }

    /// Execute NFT mint from candy machine
    pub async fn execute_mint(
        &self,
        candy_machine: &CandyMachine,
        wallet: &Keypair,
        project: &ProjectConfig,
    ) -> Result<MintResult> {
        info!("Minting NFT from {}", project.name);

        // Generate new NFT mint keypair
        let nft_mint = Keypair::new();

        debug!("NFT mint address: {}", nft_mint.pubkey());

        // Build mint instruction
        let instructions = self.build_mint_instructions(candy_machine, wallet, &nft_mint)?;

        // Send transaction
        let signature = self
            .send_mint_transaction(instructions, wallet, &nft_mint)
            .await?;

        info!("Mint transaction sent: {}", signature);

        // Derive associated accounts
        let nft_token_account = self.get_associated_token_address(&wallet.pubkey(), &nft_mint.pubkey());
        let metadata = self.get_metadata_address(&nft_mint.pubkey());
        let master_edition = self.get_master_edition_address(&nft_mint.pubkey());

        Ok(MintResult {
            signature,
            nft_mint: nft_mint.pubkey(),
            nft_token_account,
            metadata,
            master_edition,
        })
    }

    fn build_mint_instructions(
        &self,
        candy_machine: &CandyMachine,
        wallet: &Keypair,
        nft_mint: &Keypair,
    ) -> Result<Vec<Instruction>> {
        // In production, this would build the actual Candy Machine mint instruction
        // using the mpl-candy-machine-core crate

        match candy_machine.version {
            crate::types::CandyMachineVersion::V2 => self.build_v2_mint(candy_machine, wallet, nft_mint),
            crate::types::CandyMachineVersion::V3 => self.build_v3_mint(candy_machine, wallet, nft_mint),
        }
    }

    fn build_v2_mint(
        &self,
        candy_machine: &CandyMachine,
        wallet: &Keypair,
        nft_mint: &Keypair,
    ) -> Result<Vec<Instruction>> {
        // Build Candy Machine v2 mint instruction
        info!("Building Candy Machine v2 mint instruction");

        let mut instructions = Vec::new();

        // 1. Compute budget instruction (priority fee)
        instructions.push(self.build_compute_budget_instruction()?);

        // 2. Create mint account
        // 3. Initialize mint
        // 4. Create token account
        // 5. Mint to
        // 6. Create metadata
        // 7. Create master edition
        // 8. Candy machine mint instruction

        // Placeholder - in production, use actual instruction building
        Ok(instructions)
    }

    fn build_v3_mint(
        &self,
        candy_machine: &CandyMachine,
        wallet: &Keypair,
        nft_mint: &Keypair,
    ) -> Result<Vec<Instruction>> {
        // Build Candy Machine v3 mint instruction
        info!("Building Candy Machine v3 mint instruction");

        let mut instructions = Vec::new();

        // 1. Compute budget instruction (priority fee)
        instructions.push(self.build_compute_budget_instruction()?);

        // 2. Candy Machine v3 mint instruction
        // Uses Metaplex Token Metadata program v3

        // Placeholder - in production, use actual instruction building
        Ok(instructions)
    }

    fn build_compute_budget_instruction(&self) -> Result<Instruction> {
        use solana_sdk::compute_budget::ComputeBudgetInstruction;

        Ok(ComputeBudgetInstruction::set_compute_unit_price(
            self.config.strategy.priority_fee,
        ))
    }

    async fn send_mint_transaction(
        &self,
        instructions: Vec<Instruction>,
        wallet: &Keypair,
        nft_mint: &Keypair,
    ) -> Result<Signature> {
        // Get recent blockhash
        let recent_blockhash = self.rpc_client.get_latest_blockhash()?;

        // Build and sign transaction
        let transaction = Transaction::new_signed_with_payer(
            &instructions,
            Some(&wallet.pubkey()),
            &[wallet, nft_mint],
            recent_blockhash,
        );

        // Send transaction with confirmation
        let signature = self.rpc_client.send_and_confirm_transaction(&transaction)?;

        Ok(signature)
    }

    fn get_associated_token_address(&self, wallet: &Pubkey, mint: &Pubkey) -> Pubkey {
        // Calculate associated token account address
        // This is a deterministic derivation
        spl_associated_token_account::get_associated_token_address(wallet, mint)
    }

    fn get_metadata_address(&self, mint: &Pubkey) -> Pubkey {
        // Derive metadata PDA
        let metadata_program_id = mpl_token_metadata::ID;
        let seeds = &[
            b"metadata",
            metadata_program_id.as_ref(),
            mint.as_ref(),
        ];

        Pubkey::find_program_address(seeds, &metadata_program_id).0
    }

    fn get_master_edition_address(&self, mint: &Pubkey) -> Pubkey {
        // Derive master edition PDA
        let metadata_program_id = mpl_token_metadata::ID;
        let seeds = &[
            b"metadata",
            metadata_program_id.as_ref(),
            mint.as_ref(),
            b"edition",
        ];

        Pubkey::find_program_address(seeds, &metadata_program_id).0
    }
}

