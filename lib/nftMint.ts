import {
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  createMintToCheckedInstruction,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

import { Provider } from '@reown/appkit-adapter-solana';

/**
 * Get mint address from environment
 * 
 * For deployment:
 * 1. Run npm run create-mint locally to create the mint account
 * 2. Copy the mint address from .env.local
 * 3. Add NEXT_PUBLIC_NFT_MINT_ADDRESS to Vercel environment variables
 * 
 * The mint account lives on Solana devnet, so the app can mint NFTs
 * from anywhere as long as it has the mint address.
 */
const MINT_ADDRESS = process.env.NEXT_PUBLIC_NFT_MINT_ADDRESS;
if (!MINT_ADDRESS) {
  throw new Error('NEXT_PUBLIC_NFT_MINT_ADDRESS is not set. Run npm run create-mint first.');
}

// Create mint pubkey once at module level
const MINT_PUBKEY = new PublicKey(MINT_ADDRESS);

interface CreateSoulboundNFTParams {
  connection: Connection;
  walletProvider: Provider;
  username: string;
  country: string;
  emojis: string[];
}

/**
 * User flow to mint an NFT to their wallet
 * Uses the pre-created mint account from admin setup
 * 
 * This will work on any deployment (Vercel, etc) because:
 * 1. The mint account exists on Solana devnet
 * 2. We only need the mint address to interact with it
 * 3. The admin keypair is only needed for initial setup
 */
export async function createSoulboundNFT({
  connection: _connection,
  walletProvider,
  username,
  country,
  emojis,
}: CreateSoulboundNFTParams): Promise<string> {
  if (!walletProvider.publicKey) {
    throw new Error('Wallet not connected');
  }

  // Store wallet public key to avoid repeated casting
  const walletPubkey = walletProvider.publicKey as PublicKey;

  // Create direct devnet connection
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  console.log('Using mint account:', MINT_PUBKEY.toBase58());

  // Create token account
  console.log('1. Creating token account...');
  const ata = await getAssociatedTokenAddress(
    MINT_PUBKEY,
    walletPubkey,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  const createATAInstruction = createAssociatedTokenAccountInstruction(
    walletPubkey,
    ata,
    walletPubkey,
    MINT_PUBKEY,
    TOKEN_2022_PROGRAM_ID
  );

  // Mint token
  console.log('2. Creating mint instruction...');
  const mintInstruction = createMintToCheckedInstruction(
    MINT_PUBKEY,
    ata,
    walletPubkey,
    1, // amount
    0, // decimals
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  // Create transaction
  console.log('Creating transaction...');
  const transaction = new Transaction()
    .add(createATAInstruction)
    .add(mintInstruction);

  try {
    // Get fresh blockhash
    console.log('Getting fresh blockhash...');
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = walletPubkey;

    // Log transaction details
    console.log('Transaction details:', {
      numInstructions: transaction.instructions.length,
      signers: transaction.signatures.map(s => s.publicKey.toBase58()),
      recentBlockhash: transaction.recentBlockhash,
      feePayer: transaction.feePayer?.toBase58()
    });

    // Send transaction using AppKit
    console.log('Sending transaction...');
    const signature = await walletProvider.sendTransaction(transaction, connection);
    
    console.log('Waiting for confirmation...');
    await connection.confirmTransaction(signature, 'confirmed');
    
    console.log('Transaction confirmed:', signature);
    
    return MINT_PUBKEY.toString();
  } catch (error) {
    // Log detailed error information
    console.error('Transaction failed:', {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      // @ts-ignore - getLogs is available on SendTransactionError
      errorLogs: error.logs || (error.getLogs && error.getLogs()),
    });
    throw error;
  }
}
