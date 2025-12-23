import { useState, useCallback } from 'react'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''

interface GeneratedImage {
  id: string
  imageData: string // base64
  prompt: string
  timestamp: number
}

interface UseGeminiGenerateReturn {
  generateImage: (customPrompt?: string) => Promise<string | null>
  generatedImages: GeneratedImage[]
  currentImage: GeneratedImage | null
  attemptsRemaining: number
  isGenerating: boolean
  error: string | null
  pickImage: (imageId: string) => GeneratedImage | null
  discardImage: (imageId: string) => void
  discardAll: () => void
  resetAttempts: (attempts?: number) => void
  setBasePrompt: (prompt: string) => void
  basePrompt: string
}

const DEFAULT_PROMPT = 'nanobanana style abstract digital art, vibrant colors, geometric patterns'
const MAX_ATTEMPTS = 10

export function useGeminiGenerate(): UseGeminiGenerateReturn {
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null)
  const [attemptsRemaining, setAttemptsRemaining] = useState(MAX_ATTEMPTS)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [basePrompt, setBasePrompt] = useState(DEFAULT_PROMPT)

  const generateImage = useCallback(async (customPrompt?: string): Promise<string | null> => {
    if (attemptsRemaining <= 0) {
      setError('No attempts remaining')
      return null
    }

    if (!GEMINI_API_KEY) {
      setError('Gemini API key not configured')
      return null
    }

    setIsGenerating(true)
    setError(null)

    try {
      const prompt = customPrompt || basePrompt

      // Call Gemini API for image generation
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              responseModalities: ['IMAGE', 'TEXT'],
            },
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `API error: ${response.status}`)
      }

      const data = await response.json()

      // Find image part in response
      const candidates = data.candidates || []
      if (candidates.length === 0) {
        throw new Error('No image generated')
      }

      const parts = candidates[0]?.content?.parts || []
      const imagePart = parts.find((p: { inlineData?: { data: string } }) => p.inlineData?.data)

      if (!imagePart?.inlineData?.data) {
        throw new Error('No image in response')
      }

      const imageData = imagePart.inlineData.data

      const newImage: GeneratedImage = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        imageData: `data:image/png;base64,${imageData}`,
        prompt,
        timestamp: Date.now(),
      }

      setGeneratedImages((prev) => [...prev, newImage])
      setCurrentImage(newImage)
      setAttemptsRemaining((prev) => prev - 1)

      return newImage.imageData
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate image'
      setError(message)
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [attemptsRemaining, basePrompt])

  const pickImage = useCallback((imageId: string): GeneratedImage | null => {
    const image = generatedImages.find((img) => img.id === imageId)
    if (image) {
      // Clear other images, keep only the picked one
      setGeneratedImages([image])
      setCurrentImage(image)
      setAttemptsRemaining(0) // No more attempts after picking
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

  const resetAttempts = useCallback((attempts: number = MAX_ATTEMPTS) => {
    setAttemptsRemaining(attempts)
    setGeneratedImages([])
    setCurrentImage(null)
    setError(null)
  }, [])

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
