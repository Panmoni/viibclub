'use client'

import { useEffect, useState } from 'react'
import OnboardingForm from './OnboardingForm'
import { useWallet } from '@/context'
import { getCountryName } from '@/lib/countries'

interface UserData {
  username: string | null
  emojis: string[]
  country_code: string | null
}

export function UsernameFormWrapper() {
  const walletAddress = useWallet()
  const [userData, setUserData] = useState<UserData>({
    username: null,
    emojis: [],
    country_code: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!walletAddress) return

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
          return
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data')
        }
        
        const data = await response.json()
        setUserData({
          username: data.username,
          emojis: data.emojis || [],
          country_code: data.country_code || null
        })
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [walletAddress])

  const handleOnboardingSubmit = async (formData: { username: string, country: string, emojis: string[] }) => {
    if (!walletAddress) {
      throw new Error('Wallet not connected')
    }

    try {
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

      const data = await response.json()
      setUserData({
        username: formData.username,
        country_code: formData.country,
        emojis: formData.emojis
      })
      return data
    } catch (error) {
      console.error('Error saving onboarding data:', error)
      throw error
    }
  }

  if (loading) return null
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
    </div>
  )

  return <OnboardingForm onSubmit={handleOnboardingSubmit} walletAddress={walletAddress} />
}
