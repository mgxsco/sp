import { useState } from 'react'

interface NFTAttribute {
  trait_type: string
  value: string | number
  display_type?: string
}

interface ImageDetails {
  bytes: number
  format: string
  sha256: string
  width: number
  height: number
}

interface NFTMetadata {
  name: string
  description?: string
  attributes?: NFTAttribute[]
  image_details: ImageDetails
  image: string
  image_url: string
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

// Get format name from extension
function getFormatName(extension: string): string {
  const formats: Record<string, string> = {
    'png': 'PNG',
    'jpg': 'JPEG',
    'jpeg': 'JPEG',
    'gif': 'GIF',
    'webp': 'WEBP',
    'svg': 'SVG',
    'mp4': 'MP4',
    'webm': 'WEBM',
    'mp3': 'MP3',
    'wav': 'WAV',
  }
  return formats[extension] || extension.toUpperCase()
}

// Calculate SHA256 hash of file
async function calculateSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Get image dimensions
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    // For non-image files, return 0x0
    if (!file.type.startsWith('image/')) {
      resolve({ width: 0, height: 0 })
      return
    }

    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image for dimensions'))
    }

    img.src = url
  })
}

export function useIPFSUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadToIPFS = async (
    file: File,
    metadata: { name: string; description?: string; attributes?: NFTAttribute[] }
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

      // Calculate image details in parallel
      const [sha256, dimensions] = await Promise.all([
        calculateSHA256(file),
        getImageDimensions(file),
      ])

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
      const ipfsHash = imageResult.IpfsHash
      const imageUrl = `ipfs://${ipfsHash}`
      const imageHttpUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`

      // Build image_details
      const imageDetails: ImageDetails = {
        bytes: file.size,
        format: getFormatName(fileExtension),
        sha256: sha256,
        width: dimensions.width,
        height: dimensions.height,
      }

      // Build attributes with display_type
      const attributesWithDisplayType = metadata.attributes?.map(attr => ({
        trait_type: attr.trait_type,
        value: attr.value,
        display_type: attr.display_type || 'text',
      }))

      // Create full metadata matching the required structure
      const fullMetadata: NFTMetadata = {
        name: metadata.name,
        ...(metadata.description && { description: metadata.description }),
        ...(attributesWithDisplayType && attributesWithDisplayType.length > 0 && {
          attributes: attributesWithDisplayType
        }),
        image_details: imageDetails,
        image: imageHttpUrl,
        image_url: imageHttpUrl,
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
