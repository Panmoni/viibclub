// import { ConnectButton } from "@/components/ConnectButton";
import ConnectButton from "@/components/CustomConnectButton";
import { InfoList } from "@/components/InfoList";
import { ActionButtonList } from "@/components/ActionButtonList";
import { UsernameFormWrapper } from "@/components/OnboardingFormWrapper";
import MintButton from "@/components/MintButton";
import Image from 'next/image';

export default function Home() {

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-gray-900 to-gray-950">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <Image 
            src="/viibclub-logo-v3.svg" 
            alt="Viib.club" 
            width={150} 
            height={150} 
            priority 
            className="mx-auto"
          />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Viib.club
          </h1>
          <p className="text-gray-400 text-lg font-mono">
            An On-Chain Social Network for Web3 Product Development
          </p>
        </div>

        <div className="space-y-6">
          <ConnectButton />
          <UsernameFormWrapper />
          <MintButton />
        </div>
      </div>
    </div>
  );
}
