'use client'

import { useState } from "react"
import { FilePond } from "react-filepond"
import { Trash2Icon, FileTextIcon } from "lucide-react"
import Image from "next/image"
import Lightbox from "yet-another-react-lightbox"
import type { FilePondFile } from "filepond"

import { Button } from "@/components/ui/button"

import "filepond/dist/filepond.min.css"
import "yet-another-react-lightbox/styles.css"

type FilePreview = {
    file: File
    url: string
    isImage: boolean
}

export const OrderMedia = () => {
    const [docPreviews, setDocPreviews] = useState<FilePreview[]>([])
    const [photoPreviews, setPhotoPreviews] = useState<FilePreview[]>([])
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
    const [lightboxImages, setLightboxImages] = useState<{ src: string }[]>([])

    const handleSetPreviews = (
        items: FilePondFile[],
        setter: (val: FilePreview[]) => void
    ) => {
        const files = items.map((item) => item.file as File)
        const mapped = files.map((file) => ({
            file,
            url: URL.createObjectURL(file),
            isImage: file.type.startsWith("image/")
        }))
        setter(mapped)
    }

    const handleRemove = (
        index: number,
        setter: (val: FilePreview[]) => void,
        previews: FilePreview[]
    ) => {
        const updated = [...previews]
        updated.splice(index, 1)
        setter(updated)
    }

    const renderGallery = (
        title: string,
        previews: FilePreview[],
        setter: (val: FilePreview[]) => void
    ) => {
        const isPhotoGallery = title.includes("Фото")

        const openLightboxAt = (clickedUrl: string) => {
            const images = previews.filter(p => p.isImage).map(p => ({ src: p.url }))
            const index = images.findIndex(p => p.src === clickedUrl)
            setLightboxImages(images)
            setLightboxIndex(index)
        }

        return (
            <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <FilePond
                    allowMultiple
                    acceptedFileTypes={isPhotoGallery ? ["image/*"] : ["image/*", "application/pdf"]}
                    onupdatefiles={(items) => handleSetPreviews(items, setter)}
                    labelIdle='Перетащите файлы или <span class="filepond--label-action">выберите</span>'
                />

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                    {previews.map(({ file, url, isImage }, index) => (
                        <div
                            key={index}
                            className="relative group border rounded overflow-hidden hover:shadow"
                        >
                            <div
                                className="block w-full h-64 cursor-pointer"
                                onClick={() => isImage && openLightboxAt(url)}
                            >
                                {isImage ? (
                                    <Image
                                        src={url}
                                        alt={file.name}
                                        width={200}
                                        height={200}
                                        className="size-full h-64 object-contain object-center"
                                    />
                                ) : (
                                    <div className="flex justify-center items-center w-full h-64 bg-muted">
                                        <FileTextIcon className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                )}
                            </div>

                            <div className="p-2 text-sm truncate border-t bg-background">
                                {file.name}
                            </div>

                            <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleRemove(index, setter, previews)}
                            >
                                <Trash2Icon className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>

                {lightboxIndex !== null && (
                    <Lightbox
                        open
                        index={lightboxIndex}
                        close={() => setLightboxIndex(null)}
                        slides={lightboxImages}
                    />
                )}
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {renderGallery("Документы и чеки", docPreviews, setDocPreviews)}
            {renderGallery("Фотографии", photoPreviews, setPhotoPreviews)}
        </div>
    )
}