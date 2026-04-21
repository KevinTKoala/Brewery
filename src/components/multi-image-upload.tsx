"use client"

import { useState } from "react"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/lib/toast-context"

interface MultiImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxFiles?: number
  accept?: string
}

export function MultiImageUpload({ images, onImagesChange, maxFiles = 5, accept = "image/*" }: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    if (images.length >= maxFiles) {
      toast(`Maximum ${maxFiles} images allowed`, 'warning')
      return
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast("File size must be less than 2MB", 'warning')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast("File must be an image", 'warning')
      return
    }

    setUploading(true)

    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
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

      // Add to images array
      onImagesChange([...images, publicUrl])

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload image"
      toast(errorMessage, 'error')
    } finally {
      setUploading(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  return (
    <div className="space-y-2">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
        <input
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={uploading || images.length >= maxFiles}
          className="hidden"
          id="multi-image-upload"
        />
        <label htmlFor="multi-image-upload" className="cursor-pointer">
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
                  PNG, JPG, WEBP up to 2MB (Max {maxFiles} images)
                </p>
              </>
            )}
          </div>
        </label>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image, index) => (
            <div key={index} className="relative inline-block">
              <img
                src={image}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={() => handleRemove(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
