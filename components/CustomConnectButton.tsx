'use client'

import { modal } from '@/context'
import { useAppKitAccount } from '@reown/appkit/react'
import { useEffect, useState } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'

export default function ConnectButton() {
  const { address, isConnected, status } = useAppKitAccount()
  const [balance, setBalance] = useState<number | null>(null)
  const [balanceError, setBalanceError] = useState<string | null>(null)

  useEffect(() => {
    async function getBalance() {
      if (address) {
        console.log('Fetching balance for address:', address)
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
        try {
          const pubKey = new PublicKey(address)
          const rawBalance = await connection.getBalance(pubKey)
          console.log('Raw balance (lamports):', rawBalance)
          const solBalance = rawBalance / 1e9
          console.log('Converted balance (SOL):', solBalance)
          setBalance(solBalance)
        } catch (error) {
          console.error('Error fetching balance:', error)
          if (error instanceof Error) {
            console.error('Error details:', {
              name: error.name,
              message: error.message,
              stack: error.stack
            })
          }
          setBalance(null)
          setBalanceError('Error loading balance')
        }
      }
    }

    if (isConnected && address) {
      setBalanceError(null)
      getBalance()
    } else {
      setBalance(null)
      setBalanceError(null)
    }
  }, [address, isConnected])

  // Show connecting state
  if (status === 'connecting') {
    return (
      <div className="flex justify-center">
        <button 
          className="rounded-lg bg-yellow-500 px-4 py-2 text-white transition-colors"
          disabled
          aria-label="Connecting wallet"
        >
          <span className="animate-pulse">Connecting Wallet...</span>
        </button>
      </div>
    )
  }

  // Show reconnecting state
  if (status === 'reconnecting') {
    return (
      <div className="flex justify-center">
        <button 
          className="rounded-lg bg-orange-500 px-4 py-2 text-white transition-colors"
          disabled
          aria-label="Reconnecting wallet"
        >
          <span className="animate-pulse">Reconnecting...</span>
        </button>
      </div>
    )
  }

  // Show connected state with enhanced UI
  if (status === 'connected' && address) {
    return (
      <div className="flex justify-center">
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <div className="text-gray-400 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2" aria-hidden="true" /> {/* Status indicator */}
              {address.slice(0, 4)}...{address.slice(-4)}
            </div>
            {balanceError ? (
              <div className="text-red-400 text-xs">
                {balanceError}
              </div>
            ) : balance !== null && (
              <div className="text-gray-500">
                {balance.toFixed(2)} SOL
              </div>
            )}
          </div>
          <button 
            className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition-colors"
            onClick={() => modal.open()}
            aria-label="Disconnect wallet"
          >
            Disconnect
          </button>
        </div>
      </div>
    )
  }

  // Show disconnected state (default)
  return (
    <div className="flex justify-center">
      <button 
        className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition-colors"
        onClick={() => modal.open()}
        aria-label="Connect wallet"
      >
        Connect Wallet
      </button>
    </div>
  )
}
