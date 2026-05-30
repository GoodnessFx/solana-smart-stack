// programs/token/src/lib.rs

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Token1111111111111111111111111111111111111");

#[program]
pub mod token {
    use super::*;

    /// Transfer tokens with an optional fee.
    /// `fee_basis_points` is the fee expressed in hundredths of a percent (e.g., 100 = 1%).
    pub fn transfer_with_fee(
        ctx: Context<TransferWithFee>,
        amount: u64,
        fee_basis_points: u16,
    ) -> Result<()> {
        // Calculate fee amount
        let fee = (amount as u128 * fee_basis_points as u128) / 10_000u128;
        let fee_u64 = fee as u64;
        let net_amount = amount.checked_sub(fee_u64).ok_or(ErrorCode::InvalidFee)?;

        // Transfer net amount to destination
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.from.to_account_info(),
                    to: ctx.accounts.to.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            net_amount,
        )?;

        // If fee > 0, transfer to fee recipient
        if fee_u64 > 0 {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.from.to_account_info(),
                        to: ctx.accounts.fee_recipient.to_account_info(),
                        authority: ctx.accounts.authority.to_account_info(),
                    },
                ),
                fee_u64,
            )?;
        }
        Ok(())
    }
}

#[derive(Accounts)]
pub struct TransferWithFee<'info> {
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    #[account(mut)]
    /// CHECK: fee recipient can be any token account
    pub fee_recipient: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Fee calculation resulted in underflow")]
    InvalidFee,
}
