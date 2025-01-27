'use client'

import { solanaWeb3JsAdapter, projectId, networks } from '@/config'
import { createAppKit, useAppKitAccount } from '@reown/appkit/react'
import React, { type ReactNode, createContext, useContext } from 'react'

// Set up metadata
const metadata = {
  name: 'Viib.club',
  description: 'An On-Chain Social Network for Product Development',
  url: 'https://viib.club',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// Create the modal
export const modal = createAppKit({
  adapters: [solanaWeb3JsAdapter],
  projectId,
  networks,
  metadata,
  themeMode: 'light',
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  },
  themeVariables: {
    '--w3m-accent': '#000000',
  }
})

export function useWallet() {
  const { address } = useAppKitAccount();
  return address;
}

function ContextProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export default ContextProvider
