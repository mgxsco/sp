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
    maxSize: 100 * 1024 * 1024,
  })

  const clearFile = () => {
    onFileSelect(null as unknown as File)
    setPreview(null)
  }

  return (
    <div>
      <label className="label">Artwork</label>

      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`
            relative border cursor-pointer
            transition-all duration-500 aspect-square
            flex flex-col items-center justify-center
            ${
              isDragActive
                ? 'border-white bg-white/5'
                : 'border-white/10 hover:border-white/30'
            }
          `}
        >
          <input {...getInputProps()} />

          <div className="text-center">
            <div className="mb-8">
              <svg
                className="w-6 h-6 text-white/30 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>

            {isDragActive ? (
              <p className="font-tomorrow text-[10px] tracking-[0.2em] text-white uppercase">
                Drop Here
              </p>
            ) : (
              <>
                <p className="font-tomorrow text-[10px] tracking-[0.2em] text-white/50 uppercase mb-2">
                  Drag & Drop
                </p>
                <p className="font-tektur text-[10px] text-white/20">
                  or click to browse
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="relative">
          {preview && (
            <div className="aspect-square bg-black flex items-center justify-center border border-white/10">
              <img
                src={preview}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <div>
              <p className="font-tektur text-white/80 text-sm truncate max-w-[200px]">
                {selectedFile.name}
              </p>
              <p className="font-tektur text-white/30 text-[10px] mt-1">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            <button
              onClick={clearFile}
              className="font-tomorrow text-[10px] tracking-[0.2em] text-white/30 hover:text-white transition-colors duration-300 uppercase"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
