import { useState } from 'react'
import { useForm } from 'react-hook-form'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import { countries } from 'countries-list'

type OnboardingFormData = {
  username: string
  country: string
  emojis: string[]
}

// Transform countries object into array and sort by name
const countryList = Object.entries(countries)
  .map(([code, data]) => ({
    code,
    name: data.name
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

interface OnboardingFormProps {
  onSubmit: (data: OnboardingFormData) => Promise<any>
  walletAddress: string | undefined
}

export default function OnboardingForm({ onSubmit, walletAddress }: OnboardingFormProps) {
  const { register, handleSubmit: handleFormSubmit, setValue, watch, formState: { errors } } = useForm<OnboardingFormData>({
    mode: 'onChange',
    defaultValues: {
      emojis: []
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  
  const selectedCountry = watch('country')
  const selectedEmojis = watch('emojis') || []

  const handleSubmit = async (data: OnboardingFormData) => {
    if (!walletAddress) {
      setError('Wallet not connected')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      await onSubmit(data)
      console.log('Onboarding successful')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    const newEmojis = [...selectedEmojis, emojiData.emoji].slice(0, 3)
    setValue('emojis', newEmojis)
  }

  return (
    <form onSubmit={handleFormSubmit(handleSubmit)} className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="username" className="block text-sm font-medium">
            Username
          </label>
          <div className="group relative">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
              <div className="hidden group-hover:block absolute right-0 top-6 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg">
                <ul className="list-disc list-inside space-y-1">
                  <li>Must be unique</li>
                  <li>No special characters</li>
                  <li>3-20 characters long</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <input
          {...register('username', { 
            required: 'Username is required',
            pattern: {
              value: /^[a-zA-Z0-9_-]{3,20}$/,
              message: 'Username must be 3-20 characters and contain only letters, numbers, underscores, or hyphens'
            },
            validate: value => !/\s/.test(value) || 'Spaces are not allowed in username'
          })}
          id="username"
          className="mt-1 block w-full rounded-md border p-2 bg-transparent text-white"
          placeholder="Choose your username"
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-500">
            {errors.username.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="country" className="block text-sm font-medium">
          Country
        </label>
        <select
          {...register('country', { required: 'Please select your country' })}
          id="country"
          className="mt-1 block w-full rounded-md border p-2 bg-transparent text-white"
        >
          <option value="" className="bg-gray-800">Select a country</option>
          {countryList.map(country => (
            <option key={country.code} value={country.code} className="bg-gray-800">
              {country.name}
            </option>
          ))}
        </select>
        {errors.country && (
          <p className="mt-1 text-sm text-red-500">
            {errors.country.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Select up to 3 emojis
        </label>
        <p className="text-sm text-gray-500 mb-2">
          Search and select emojis that represent you
        </p>
        <div className="flex space-x-2">
          {selectedEmojis.map((emoji: string, i: number) => (
            <span key={i} className="text-2xl">
              {emoji}
            </span>
          ))}
          {selectedEmojis.length < 3 && (
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="px-2 py-1 text-sm border rounded-md"
            >
              {showEmojiPicker ? 'Close' : 'Add Emoji'}
            </button>
          )}
        </div>
        {showEmojiPicker && (
          <div className="mt-2">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              searchPlaceholder="Type to find emojis..."
              skinTonesDisabled
              width="100%"
              theme={Theme.DARK}
              className="!bg-gray-800 !border-gray-700"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Initiate Onboarding'}
      </button>
    </form>
  )
}
