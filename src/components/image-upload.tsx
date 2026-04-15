"use client"

import { useState, useRef } from "react"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

interface ImageUploadProps {
  onUploadComplete: (url: string) => void
  onUploadError?: (error: string) => void
  maxFiles?: number
  accept?: string
}

export function ImageUpload({ onUploadComplete, onUploadError, maxFiles = 1, accept = "image/*" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      onUploadError?.("File size must be less than 2MB")
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onUploadError?.("File must be an image")
      return
    }

    setUploading(true)

    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (error) {
        throw error
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      // Set preview
      setPreview(publicUrl)
      onUploadComplete(publicUrl)

    } catch (error: any) {
      onUploadError?.(error.message || "Failed to upload image")
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onUploadComplete('')
  }

  return (
    <div className="space-y-2">
      {!preview ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-2">
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <p className="text-sm text-gray-600">Uploading...</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">
                    PNG, JPG, WEBP up to 2MB
                  </p>
                </>
              )}
            </div>
          </label>
        </div>
      ) : (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="w-full max-w-sm h-auto rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
