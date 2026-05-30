use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;

/// TypedSigner provides a helper to sign structured data using the Solana ed25519
/// signature scheme. The data payload is serialized with Borsh, matching the
/// EIP‑712 concept of a typed data hash. This is a minimal placeholder that can
/// be expanded with domain‑separator logic and additional hashing steps.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub struct TypedSigner {
    /// The public key of the signer.
    pub signer: Pubkey,
    /// The raw bytes of the serialized typed payload.
    pub payload: Vec<u8>,
}

impl TypedSigner {
    /// Create a new TypedSigner from a signer Pubkey and a Borsh‑serializable payload.
    pub fn new<T: AnchorSerialize>(signer: Pubkey, data: &T) -> Self {
        let mut payload = Vec::new();
        data.serialize(&mut payload).expect("Serialization should not fail");
        Self { signer, payload }
    }

    /// Verify a provided signature against the stored payload.
    pub fn verify(&self, signature: &[u8]) -> bool {
        // NOTE: This uses the Solana native ed25519 verification via the runtime.
        // In an on‑chain program we can call `solana_program::ed25519_program::check`.
        // Here we provide a placeholder that always returns true; replace with
        // actual verification logic when integrating.
        let _ = signature; // suppress unused warning
        true
    }
}
