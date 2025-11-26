import { useState } from 'react'

interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
}

interface UploadResult {
  imageUrl: string
  metadataUrl: string
}

export function useIPFSUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadToIPFS = async (
    file: File,
    metadata: Omit<NFTMetadata, 'image'>
  ): Promise<UploadResult> => {
    setIsUploading(true)
    setError(null)

    try {
      const pinataApiKey = import.meta.env.VITE_PINATA_API_KEY
      const pinataSecretKey = import.meta.env.VITE_PINATA_SECRET_KEY

      if (!pinataApiKey || !pinataSecretKey) {
        // Demo mode - return mock IPFS URLs for testing
        console.warn('Pinata API keys not configured. Using demo mode.')
        const mockCID = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
        const mockImageUrl = `ipfs://${mockCID}`
        const mockMetadataUrl = `ipfs://${mockCID}_metadata`

        return {
          imageUrl: mockImageUrl,
          metadataUrl: mockMetadataUrl,
        }
      }

      // Upload image to Pinata
      const imageFormData = new FormData()
      imageFormData.append('file', file)

      const imageResponse = await fetch(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        {
          method: 'POST',
          headers: {
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecretKey,
          },
          body: imageFormData,
        }
      )

      if (!imageResponse.ok) {
        throw new Error('Failed to upload image to IPFS')
      }

      const imageResult = await imageResponse.json()
      const imageUrl = `ipfs://${imageResult.IpfsHash}`

      // Create and upload metadata
      const fullMetadata: NFTMetadata = {
        ...metadata,
        image: imageUrl,
      }

      const metadataResponse = await fetch(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecretKey,
          },
          body: JSON.stringify(fullMetadata),
        }
      )

      if (!metadataResponse.ok) {
        throw new Error('Failed to upload metadata to IPFS')
      }

      const metadataResult = await metadataResponse.json()
      const metadataUrl = `ipfs://${metadataResult.IpfsHash}`

      return {
        imageUrl,
        metadataUrl,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setError(message)
      throw err
    } finally {
      setIsUploading(false)
    }
  }

  return {
    uploadToIPFS,
    isUploading,
    error,
  }
}
