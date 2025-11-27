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

// Helper to create a slug from NFT name
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Get file extension from file
function getFileExtension(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase()
  return ext || 'png'
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
        throw new Error('Pinata API keys not configured. Please add VITE_PINATA_API_KEY and VITE_PINATA_SECRET_KEY to your environment variables.')
      }

      // Create proper file name from NFT name
      const slug = slugify(metadata.name) || 'nft'
      const fileExtension = getFileExtension(file)
      const imageName = `${slug}.${fileExtension}`
      const metadataName = `${slug}-metadata.json`

      // Create a new file with proper name
      const renamedFile = new File([file], imageName, { type: file.type })

      // Upload image to Pinata with proper naming
      const imageFormData = new FormData()
      imageFormData.append('file', renamedFile)
      imageFormData.append('pinataMetadata', JSON.stringify({
        name: imageName,
        keyvalues: {
          nftName: metadata.name,
          type: 'image'
        }
      }))
      imageFormData.append('pinataOptions', JSON.stringify({
        cidVersion: 1
      }))

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
        const errorData = await imageResponse.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to upload image to IPFS')
      }

      const imageResult = await imageResponse.json()
      const imageUrl = `ipfs://${imageResult.IpfsHash}`

      // Create and upload metadata with proper naming
      const fullMetadata: NFTMetadata = {
        name: metadata.name,
        description: metadata.description || '',
        image: imageUrl,
        attributes: metadata.attributes,
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
          body: JSON.stringify({
            pinataContent: fullMetadata,
            pinataMetadata: {
              name: metadataName,
              keyvalues: {
                nftName: metadata.name,
                type: 'metadata'
              }
            },
            pinataOptions: {
              cidVersion: 1
            }
          }),
        }
      )

      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to upload metadata to IPFS')
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
