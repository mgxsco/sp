import { useState, useCallback, useEffect } from 'react'
import { useAccount, useSignMessage } from 'wagmi'

interface GeneratedImage {
  id: string
  imageData: string // base64
  prompt: string
  timestamp: number
}

export interface UseGeminiGenerateReturn {
  generateImage: (customPrompt?: string) => Promise<string | null>
  generatedImages: GeneratedImage[]
  currentImage: GeneratedImage | null
  attemptsRemaining: number
  isGenerating: boolean
  error: string | null
  pickImage: (imageId: string) => GeneratedImage | null
  discardImage: (imageId: string) => void
  discardAll: () => void
  resetAttempts: (burnTxHash: string) => Promise<boolean>
  setBasePrompt: (prompt: string) => void
  basePrompt: string
  fetchAttempts: () => Promise<void>
}

const DEFAULT_PROMPT = 'nanobanana style abstract digital art, vibrant colors, geometric patterns'
const MAX_ATTEMPTS = 10
const SESSION_STORAGE_KEY = 'gemini_session_token'

export function useGeminiGenerate(): UseGeminiGenerateReturn {
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()

  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null)
  const [attemptsRemaining, setAttemptsRemaining] = useState(MAX_ATTEMPTS)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [basePrompt, setBasePrompt] = useState(DEFAULT_PROMPT)
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    // Load session token from sessionStorage on init
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(SESSION_STORAGE_KEY)
    }
    return null
  })

  // Fetch attempts from backend when wallet connects
  const fetchAttempts = useCallback(async () => {
    if (!address) return

    try {
      const response = await fetch(`/api/get-attempts?wallet=${address}`)
      if (response.ok) {
        const data = await response.json()
        setAttemptsRemaining(data.attemptsRemaining)
      }
    } catch (err) {
      console.error('Failed to fetch attempts:', err)
    }
  }, [address])

  useEffect(() => {
    fetchAttempts()
  }, [fetchAttempts])

  const generateImage = useCallback(async (customPrompt?: string): Promise<string | null> => {
    if (!address) {
      setError('Wallet not connected')
      return null
    }

    if (!sessionToken) {
      setError('No active session. Please burn a seed first.')
      return null
    }

    if (attemptsRemaining <= 0) {
      setError('No attempts remaining')
      return null
    }

    setIsGenerating(true)
    setError(null)

    try {
      const prompt = customPrompt || basePrompt

      // Call backend API with session token (no signature needed)
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          walletAddress: address,
          sessionToken,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      const data = await response.json()

      const newImage: GeneratedImage = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        imageData: `data:${data.mimeType};base64,${data.imageData}`,
        prompt,
        timestamp: Date.now(),
      }

      setGeneratedImages((prev) => [...prev, newImage])
      setCurrentImage(newImage)
      setAttemptsRemaining(data.attemptsRemaining)

      return newImage.imageData
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate image'
      setError(message)
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [address, attemptsRemaining, basePrompt, sessionToken])

  const pickImage = useCallback((imageId: string): GeneratedImage | null => {
    const image = generatedImages.find((img) => img.id === imageId)
    if (image) {
      setGeneratedImages([image])
      setCurrentImage(image)
      setAttemptsRemaining(0)
    }
    return image || null
  }, [generatedImages])

  const discardImage = useCallback((imageId: string) => {
    setGeneratedImages((prev) => prev.filter((img) => img.id !== imageId))
    if (currentImage?.id === imageId) {
      setCurrentImage(null)
    }
  }, [currentImage])

  const discardAll = useCallback(() => {
    setGeneratedImages([])
    setCurrentImage(null)
  }, [])

  // Reset attempts after burning a seed (requires one signature)
  const resetAttempts = useCallback(async (burnTxHash: string): Promise<boolean> => {
    if (!address) {
      setError('Wallet not connected')
      return false
    }

    try {
      // Create message to sign (only signature needed for this action)
      const messageData = {
        action: 'reset_attempts',
        wallet: address,
        burnTxHash,
        timestamp: Date.now(),
      }
      const message = JSON.stringify(messageData)

      // Sign the message
      const signature = await signMessageAsync({ message })

      // Call backend API
      const response = await fetch('/api/reset-attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          signature,
          message,
          burnTxHash,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      const data = await response.json()
      setAttemptsRemaining(data.attemptsRemaining)
      setGeneratedImages([])
      setCurrentImage(null)
      setError(null)

      // Store session token for subsequent generate requests
      if (data.sessionToken) {
        setSessionToken(data.sessionToken)
        sessionStorage.setItem(SESSION_STORAGE_KEY, data.sessionToken)
      }

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset attempts'
      setError(message)
      return false
    }
  }, [address, signMessageAsync])

  return {
    generateImage,
    generatedImages,
    currentImage,
    attemptsRemaining,
    isGenerating,
    error,
    pickImage,
    discardImage,
    discardAll,
    resetAttempts,
    setBasePrompt,
    basePrompt,
    fetchAttempts,
  }
}

// Helper to convert base64 to File for IPFS upload
export function base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}
