import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  selectedFile: File | null
}

export function FileUpload({ onFileSelect, selectedFile }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        onFileSelect(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    },
    [onFileSelect]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
      'video/*': ['.mp4', '.webm'],
      'audio/*': ['.mp3', '.wav'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
  })

  const clearFile = () => {
    onFileSelect(null as unknown as File)
    setPreview(null)
  }

  return (
    <div className="space-y-4">
      <label className="label">Artwork</label>

      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`
            relative border border-dashed cursor-pointer
            transition-all duration-300 aspect-square max-w-md
            flex flex-col items-center justify-center
            ${
              isDragActive
                ? 'border-white bg-white/5'
                : 'border-gray-800 hover:border-gray-600'
            }
          `}
        >
          <input {...getInputProps()} />

          <div className="text-center p-8">
            <div className="mb-6">
              <svg
                className="w-8 h-8 text-gray-600 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>

            {isDragActive ? (
              <p className="text-white text-sm">Drop here</p>
            ) : (
              <>
                <p className="text-gray-400 text-sm mb-2">
                  Drag & drop or click to upload
                </p>
                <p className="text-gray-600 text-xs">
                  PNG, JPG, GIF, MP4 — Max 100MB
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="relative max-w-md">
          {preview && (
            <div className="aspect-square bg-gray-950 flex items-center justify-center">
              <img
                src={preview}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-white text-sm truncate">
                {selectedFile.name}
              </p>
              <p className="text-gray-600 text-xs">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            <button
              onClick={clearFile}
              className="text-gray-500 hover:text-white transition-colors text-xs uppercase tracking-wider"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
