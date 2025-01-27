'use client'

import { modal } from '@/context'
import { useAppKitAccount } from '@reown/appkit/react'
import { useEffect, useState } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'

export default function ConnectButton() {
  const { address, isConnected } = useAppKitAccount()
  const [balance, setBalance] = useState<number | null>(null)

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
        }
      }
    }

    if (isConnected && address) {
      getBalance()
    } else {
      setBalance(null)
    }
  }, [address, isConnected])

  if (isConnected && address) {
    return (
      <div className="flex justify-center">
        <div className="flex items-center gap-4">
        <div className="text-sm">
          <div className="text-gray-400">
            {address.slice(0, 4)}...{address.slice(-4)}
          </div>
          {balance !== null && (
            <div className="text-gray-500">
              {balance.toFixed(2)} SOL
            </div>
          )}
        </div>
        <button 
          className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition-colors"
          onClick={() => modal.open()}
        >
          Disconnect
        </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <button 
      className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition-colors"
      onClick={() => modal.open()}
    >
      Connect
      </button>
    </div>
  )
}
