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
            bg-[#1a1a1a] cursor-pointer
            transition-all duration-200
            aspect-[4/3] max-w-[320px]
            flex flex-col items-center justify-center
            ${isDragActive ? 'opacity-80' : 'hover:opacity-90'}
          `}
        >
          <input {...getInputProps()} />

          <div className="text-center">
            <div className="mb-4">
              <svg
                className="w-8 h-8 text-white/40 mx-auto"
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
              <p className="font-tomorrow text-[10px] tracking-[0.2em] text-white/60 uppercase">
                Load Image
              </p>
            )}
          </div>
        </div>
      ) : (
        <div>
          {preview && (
            <div className="bg-[#1a1a1a] max-w-[320px] aspect-[4/3] flex items-center justify-center">
              <img
                src={preview}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}

          <div className="mt-4 flex items-center justify-between max-w-[320px]">
            <div>
              <p className="text-black/80 text-sm truncate max-w-[200px]">
                {selectedFile.name}
              </p>
              <p className="text-black/40 text-[10px] mt-1">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            <button
              onClick={clearFile}
              className="font-tomorrow text-[10px] tracking-[0.15em] text-black/40 hover:text-black transition-colors uppercase"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
