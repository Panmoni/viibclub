import type { Metadata } from "next";
import './globals.css';
import ContextProvider from '@/context'
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

export const metadata: Metadata = {
  title: "Viib.club",
  description: "An On-Chain Social Network for Product Development",
  icons: {
    icon: '/viibclub-logo-v3.svg'
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans bg-gray-950 text-gray-100">
        <ContextProvider>{children}</ContextProvider>
      </body>
    </html>
  );
}
