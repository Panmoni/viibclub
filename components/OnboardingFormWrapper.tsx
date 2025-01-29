'use client'

import { useEffect, useState } from 'react'
import OnboardingForm from './OnboardingForm'
import { useWallet } from '@/context'
import { getCountryName } from '@/lib/countries'
import { createSoulboundNFT } from '@/lib/nftMint'
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react'
import { useAppKitProvider } from '@reown/appkit/react'
import type { Provider } from '@reown/appkit-adapter-solana'

interface UserData {
  username: string | null
  emojis: string[]
  country_code: string | null
  nft_address?: string | null
}

export function UsernameFormWrapper() {
  const walletAddress = useWallet()
  const { connection } = useAppKitConnection()
  const { walletProvider } = useAppKitProvider<Provider>('solana')
  const [userData, setUserData] = useState<UserData>({
    username: null,
    emojis: [],
    country_code: null
  })
  const [loading, setLoading] = useState(true)
  const [fetchCompleted, setFetchCompleted] = useState(false)
  const [nftMinting, setNftMinting] = useState(false)

  useEffect(() => {
    if (!walletAddress) {
      setUserData({
        username: null,
        emojis: [],
        country_code: null
      })
      setLoading(false)
      setFetchCompleted(false)
      return
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/users?wallet_address=${walletAddress}`)
        
        if (response.status === 404) {
          // No user exists yet, which is expected
          setUserData({
            username: null,
            emojis: [],
            country_code: null
          })
        } else if (!response.ok) {
          throw new Error('Failed to fetch user data')
        } else {
          const data = await response.json()
          setUserData({
            username: data.username,
            emojis: data.emojis || [],
            country_code: data.country_code || null,
            nft_address: data.nft_address || null
          })
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
      
      setLoading(false)
      setFetchCompleted(true)
    }

    fetchUserData()
  }, [walletAddress])

  const handleOnboardingSubmit = async (formData: { username: string, country: string, emojis: string[] }) => {
    if (!walletAddress) {
      throw new Error('Wallet not connected')
    }

    try {
      // 1. Save user data to database
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          username: formData.username,
          country_code: formData.country,
          emojis: formData.emojis
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save onboarding data')
      }

      const userData = await response.json()

      // 2. Mint soul bound NFT
      setNftMinting(true)
      try {
        if (!connection || !walletProvider) {
          throw new Error('Connection or wallet provider not available');
        }

        const nftAddress = await createSoulboundNFT({
          connection,
          walletProvider,
          username: formData.username,
          country: formData.country,
          emojis: formData.emojis
        })

        // 3. Update user record with NFT address
        const updateResponse = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            wallet_address: walletAddress,
            nft_address: nftAddress
          }),
        })

        if (!updateResponse.ok) {
          throw new Error('Failed to update user with NFT address')
        }

        setUserData({
          username: formData.username,
          country_code: formData.country,
          emojis: formData.emojis,
          nft_address: nftAddress
        })
      } catch (error) {
        console.error('Error minting NFT:', error)
        throw error
      } finally {
        setNftMinting(false)
      }

      return userData
    } catch (error) {
      console.error('Error in onboarding process:', error)
      throw error
    }
  }

  // Don't show anything if wallet is not connected
  if (!walletAddress) return null

  // Show loading states
  if (loading || !fetchCompleted) return null
  
  // Show minting state
  if (nftMinting) return (
    <div className="text-center mt-8">
      <h2 className="text-2xl font-bold text-gray-400 animate-pulse">
        Minting your profile NFT...
      </h2>
      <p className="text-gray-500 mt-2">
        Please approve the transaction in your wallet
      </p>
    </div>
  )

  // Show welcome message if user exists
  if (userData.username) return (
    <div className="text-center mt-8">
      <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
        Welcome {userData.username}{userData.country_code ? ` from ${getCountryName(userData.country_code)}` : ''}!
      </h2>
      {userData.emojis.length > 0 && (
        <div className="mt-4 text-2xl">
          <span className="text-gray-400 text-lg font-mono">Your Current Viib: </span>{userData.emojis.join(' ')}
        </div>
      )}
      {userData.nft_address && (
        <div className="mt-4">
          <p className="text-gray-400 text-sm font-mono">
            Profile NFT: {userData.nft_address.slice(0, 4)}...{userData.nft_address.slice(-4)}
          </p>
          <a 
            href={`https://explorer.solana.com/address/${userData.nft_address}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 text-xs font-mono mt-1 inline-block"
          >
            View on Solana Explorer
          </a>
        </div>
      )}
    </div>
  )

  // Show onboarding form only if wallet is connected and no user record exists
  return <OnboardingForm onSubmit={handleOnboardingSubmit} walletAddress={walletAddress} />
}
