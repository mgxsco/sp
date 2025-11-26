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
      <label className="label">Upload File</label>

      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200 min-h-[200px] flex flex-col items-center justify-center
            ${
              isDragActive
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-slate-600 hover:border-primary-500/50 hover:bg-slate-800/50'
            }
          `}
        >
          <input {...getInputProps()} />

          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          {isDragActive ? (
            <p className="text-primary-400 font-medium">Drop the file here...</p>
          ) : (
            <>
              <p className="text-white font-medium mb-1">
                Drag & drop your file here
              </p>
              <p className="text-slate-400 text-sm">
                or click to browse (PNG, JPG, GIF, MP4, MP3 - Max 100MB)
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
          {preview && (
            <div className="aspect-square max-h-[300px] flex items-center justify-center bg-slate-900/50">
              <img
                src={preview}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}

          <div className="p-4 flex items-center justify-between border-t border-slate-700">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-white font-medium truncate">
                  {selectedFile.name}
                </p>
                <p className="text-slate-400 text-sm">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            <button
              onClick={clearFile}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
