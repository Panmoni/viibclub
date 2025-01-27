'use client'
import { useDisconnect, useAppKit, useAppKitNetwork } from '@reown/appkit/react'
import { networks } from '@/config'

export const ActionButtonList = () => {
  const { disconnect } = useDisconnect()
  const { open } = useAppKit()
  const { switchNetwork } = useAppKitNetwork()

  const handleDisconnect = async () => {
    try {
      await disconnect()
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  return (
    <div className="flex gap-4 justify-center">
      <button
        onClick={() => open()}
        className="w-full px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all"
      >
        Open Wallet
      </button>
      <button
        onClick={handleDisconnect}
        className="w-full px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 transition-all"
      >
        Disconnect
      </button>
      <button
        onClick={() => switchNetwork(networks[1])}
        className="w-full px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 transition-all"
      >
        Switch Network
      </button>
    </div>
  )
}
