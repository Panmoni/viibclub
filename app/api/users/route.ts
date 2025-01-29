import { supabase } from '@/lib/supabaseClient'
import { NextResponse } from 'next/server'

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || []

export async function GET(request: Request) {
  // Validate origin
  const origin = request.headers.get('origin')
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json(
      { error: 'Unauthorized origin' },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const wallet_address = searchParams.get('wallet_address')
  
  if (!wallet_address) {
    return NextResponse.json(
      { error: 'Wallet address is required' },
      { status: 400 }
    )
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('username, emojis, country_code, nft_address')
    .eq('wallet_address', wallet_address)
    .single()

  if (error) {
    console.error('Supabase query error:', error)
    if (error.code === 'PGRST116') {
      // No rows found
      return NextResponse.json(
        { username: null },
        { status: 200 }
      )
    }
    return NextResponse.json(
      { 
        error: 'Failed to fetch user data',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    )
  }

  return NextResponse.json(user || { username: null })
}

export async function POST(request: Request) {
  // Validate origin
  const origin = request.headers.get('origin')
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json(
      { error: 'Unauthorized origin' },
      { status: 403 }
    )
  }

  console.log('Received request to set username');
  
  // Use the imported supabase client directly
  const { wallet_address, username, emojis, country_code, nft_address } = await request.json()
  console.log('Request data:', { wallet_address, username, emojis, country_code, nft_address });

  // Validate required fields
  if (!wallet_address || !username) {
    console.log('Missing required fields');
    return NextResponse.json(
      { error: 'Wallet address and username are required' },
      { status: 400 }
    )
  }

  // Validate emojis
  if (emojis && (!Array.isArray(emojis) || emojis.length > 3)) {
    return NextResponse.json(
      { error: 'Emojis must be an array with maximum 3 items' },
      { status: 400 }
    )
  }

  // Validate country code
  if (country_code && typeof country_code !== 'string') {
    return NextResponse.json(
      { error: 'Country code must be a string' },
      { status: 400 }
    )
  }

  // Check if username is already taken
  const { data: existingUser, error: lookupError } = await supabase
    .from('users')
    .select('wallet_address')
    .eq('username', username)
    .single()

  if (lookupError && lookupError.code !== 'PGRST116') {
    console.error('Username lookup error:', lookupError);
    return NextResponse.json(
      { error: 'Failed to check username availability' },
      { status: 500 }
    )
  }

  if (existingUser) {
    return NextResponse.json(
      { error: 'Username is already taken' },
      { status: 409 }
    )
  }

  // Check if user exists
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', wallet_address)
    .single()

  if (userError && userError.code !== 'PGRST116') {
    console.error('User existence check error:', userError);
    return NextResponse.json(
      { error: 'Failed to check user existence' },
      { status: 500 }
    )
  }

  // Upsert user profile
  const { error } = await supabase
    .from('users')
    .upsert({
      wallet_address,
      ...(username && { username }),
      ...(emojis && { emojis }),
      ...(country_code && { country_code }),
      ...(nft_address && { nft_address }),
      updated_at: new Date().toISOString(),
      ...(!user && { created_at: new Date().toISOString() })
    })

  if (error) {
    console.error('User profile save error:', error);
    if (error.code === '42501') {
      return NextResponse.json(
        { 
          error: 'Permission denied',
          details: 'Row-level security policy violation',
          code: error.code
        },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { 
        error: 'Failed to save user profile',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
