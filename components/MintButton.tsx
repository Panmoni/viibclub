'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@/context'
import { createSoulboundNFT } from '@/lib/nftMint'
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react'
import { useAppKitProvider } from '@reown/appkit/react'
import type { Provider } from '@reown/appkit-adapter-solana'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import {
  ExtensionType,
  getMintLen,
  TYPE_SIZE,
  LENGTH_SIZE,
} from '@solana/spl-token'
import { pack, TokenMetadata } from '@solana/spl-token-metadata'

interface UserData {
  username: string | null
  emojis: string[]
  country_code: string | null
  nft_address?: string | null
}

export default function MintButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState<UserData>({
    username: null,
    emojis: [],
    country_code: null
  })
  const [mintStage, setMintStage] = useState<string>('')
  const [simulationResult, setSimulationResult] = useState<{
    lamports: number;
    success: boolean;
    error?: string;
  } | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  
  const walletAddress = useWallet()
  const { connection } = useAppKitConnection()
  const { walletProvider } = useAppKitProvider<Provider>('solana')
  
  useEffect(() => {
    if (!walletAddress) {
      setUserData({
        username: null,
        emojis: [],
        country_code: null
      })
      return
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/users?wallet_address=${walletAddress}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data')
        }
        
        const data = await response.json()
        setUserData({
          username: data.username,
          emojis: data.emojis || [],
          country_code: data.country_code,
          nft_address: data.nft_address
        })
      } catch (error) {
        console.error('Error fetching user data:', error)
        setError('Failed to fetch user data')
      }
    }

    fetchUserData()
  }, [walletAddress])
  
  const simulateTransaction = async () => {
    if (!walletAddress || !userData.username || !connection || !walletProvider) return
    
    try {
      setIsLoading(true)
      setError(null)
      setShowConfirmation(false)
      
      setMintStage('Simulating transaction...')
      
      // Get current SOL balance
      const devnetConnection = new Connection('https://api.devnet.solana.com', 'confirmed')
      const pubKey = new PublicKey(walletAddress)
      const balance = await devnetConnection.getBalance(pubKey)
      
      // Calculate required lamports for the transaction
      const mintLen = getMintLen([ExtensionType.MetadataPointer])
      const metadata: TokenMetadata = {
        mint: new PublicKey(0), // Dummy for simulation
        name: userData.username,
        symbol: "VIIBNFT",
        uri: "",
        additionalMetadata: [
          ["country", userData.country_code || ""] as const,
          ["emojis", JSON.stringify(userData.emojis)] as const,
        ],
      }
      const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length
      const totalLen = mintLen + metadataLen
      const requiredLamports = await devnetConnection.getMinimumBalanceForRentExemption(totalLen)
      
      // Add estimated fee (rough estimate)
      const estimatedFee = 5000
      const totalRequired = requiredLamports + estimatedFee
      
      if (balance < totalRequired) {
        throw new Error(`Insufficient SOL balance. Required: ${totalRequired / LAMPORTS_PER_SOL} SOL`)
      }
      
      setSimulationResult({
        lamports: totalRequired,
        success: true
      })
      setShowConfirmation(true)
      
    } catch (err) {
      setSimulationResult({
        lamports: 0,
        success: false,
        error: err instanceof Error ? err.message : 'Simulation failed'
      })
      setError(err instanceof Error ? err.message : 'Failed to simulate transaction')
    } finally {
      setIsLoading(false)
      setMintStage('')
    }
  }

  const handleMint = async () => {
    if (!walletAddress || !userData.username || !connection || !walletProvider) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      setMintStage('Creating your Soul-bound NFT...')
      
      const nftAddress = await createSoulboundNFT({
        connection,
        walletProvider,
        username: userData.username,
        country: userData.country_code || '',
        emojis: userData.emojis
      })
      
      setMintStage('Saving NFT address to your profile...')
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          nft_address: nftAddress
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update user with NFT address')
      }

      setMintStage('Success! Your Soul-bound NFT has been created.')
      
      setUserData(prev => ({ ...prev, nft_address: nftAddress }))
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during minting')
      console.error('Minting error:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Don't render if wallet not connected
  if (!walletAddress) {
    return null
  }
  
  // Don't render if user profile incomplete or NFT already minted
  if (!userData.username || !userData.country_code || userData.emojis.length === 0 || userData.nft_address) {
    return null
  }
  
  if (showConfirmation && simulationResult?.success) {
    return (
      <div className="space-y-4 w-full max-w-md mx-auto p-4 bg-white/50 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Confirm NFT Minting</h3>
          <p className="text-sm text-gray-600">
            Transaction Details:
          </p>
          <ul className="text-sm text-gray-600 list-disc list-inside">
            <li>Cost: ~{simulationResult.lamports / LAMPORTS_PER_SOL} SOL</li>
            <li>Network: Solana Devnet</li>
            <li>Token Type: Non-transferable SPL Token</li>
          </ul>
          
          <div className="mt-4">
            <p className="text-sm text-gray-600 font-medium">NFT Data:</p>
            <ul className="text-sm text-gray-600 list-disc list-inside">
              <li>Username: {userData.username}</li>
              <li>Country: {userData.country_code}</li>
              <li>Vibes: {userData.emojis.join(' ')}</li>
            </ul>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowConfirmation(false)}
            className="flex-1 py-2 px-4 rounded-md text-gray-700 font-medium border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleMint}
            disabled={isLoading}
            className={`flex-1 py-2 px-4 rounded-md text-white font-medium
              ${isLoading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
              }`}
          >
            {isLoading ? 'Minting...' : 'Confirm & Mint'}
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-4 w-full max-w-md mx-auto p-4 bg-white/50 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Mint Your Soul-bound NFT</h3>
        <p className="text-sm text-gray-200">
          This will create a non-transferable NFT containing:
        </p>
        <ul className="text-sm text-gray-200 list-disc list-inside">
          <li>Username: {userData.username}</li>
          <li>Country: {userData.country_code}</li>
          <li>Vibes: {userData.emojis.join(' ')}</li>
        </ul>
      </div>
      
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {mintStage && !error && (
        <div className="p-3 bg-blue-100 text-blue-700 rounded-md text-sm">
          {mintStage}
        </div>
      )}
      
      <button
        onClick={simulateTransaction}
        disabled={isLoading}
        className={`w-full py-2 px-4 rounded-md text-white font-medium
          ${isLoading 
            ? 'bg-blue-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
          }`}
      >
        {isLoading ? 'Simulating...' : 'Preview Mint'}
      </button>
    </div>
  );
}
