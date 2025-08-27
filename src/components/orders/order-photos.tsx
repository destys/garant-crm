'use client'

import { useState, useRef } from "react"
import { FilePond } from "react-filepond"
import type { FilePond as ReactFilePondType } from "react-filepond"
import { Trash2Icon, FileTextIcon, DownloadIcon } from "lucide-react"
import Image from "next/image"
import Lightbox from "yet-another-react-lightbox"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { API_URL } from "@/constants"
import { useAuth } from "@/providers/auth-provider"
import { useOrders } from "@/hooks/use-orders"
import { OrderProps } from "@/types/order.types"
import { MediaProps } from "@/types/media.types"

import "filepond/dist/filepond.min.css"
import "yet-another-react-lightbox/styles.css"

interface MediaFile {
    id: number
    name: string
    url: string
    mime: string
}

interface Props {
    data: OrderProps
}

export const OrderMedia = ({ data }: Props) => {
    const { updateOrder } = useOrders(1, 1)
    const { jwt } = useAuth()

    const [docs, setDocs] = useState<MediaFile[]>(
        (data.order_docs || []).map((file: MediaProps) => ({
            id: file.id,
            name: file.name,
            url: `${API_URL}${file.url}`,
            mime: file.mime
        }))
    )

    const [photos, setPhotos] = useState<MediaFile[]>(
        (data.device_photos || []).map((file: MediaProps) => ({
            id: file.id,
            name: file.name,
            url: `${API_URL}${file.url}`,
            mime: file.mime
        }))
    )

    const pondDocsRef = useRef<ReactFilePondType | null>(null)
    const pondPhotosRef = useRef<ReactFilePondType | null>(null)

    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
    const [lightboxImages, setLightboxImages] = useState<{ src: string }[]>([])

    /** Удаление файла */
    const handleDeleteFile = async (
        fileId: number,
        fieldName: "order_docs" | "device_photos" | "device_photos_site",
        existing: MediaFile[],
        setExisting: React.Dispatch<React.SetStateAction<MediaFile[]>>
    ) => {
        if (!jwt) return alert("Нет токена")

        try {
            const updatedIds = existing.filter((f) => f.id !== fileId).map((f) => f.id)
            await updateOrder({
                documentId: data.documentId,
                updatedData: { [fieldName]: updatedIds }
            })

            await fetch(`${API_URL}/api/upload/files/${fileId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${jwt}` }
            })

            setExisting((prev) => prev.filter((f) => f.id !== fileId))
        } catch (err) {
            console.error(err)
            alert("Ошибка удаления файла")
        }
    }

    /** Привязка после загрузки */
    const handleAttach = async (
        uploaded: MediaFile[],
        fieldName: "order_docs" | "device_photos" | "device_photos_site",
        existing: MediaFile[],
        setExisting: React.Dispatch<React.SetStateAction<MediaFile[]>>
    ) => {
        try {
            const ids = uploaded.map((f: MediaProps) => f.id)
            const updatedIds = [...existing.map((f) => f.id), ...ids]

            await updateOrder({
                documentId: data.documentId,
                updatedData: { [fieldName]: updatedIds }
            })

            setExisting((prev) => [
                ...prev,
                ...uploaded.map((f: MediaProps) => ({
                    id: f.id,
                    name: f.name,
                    url: `${API_URL}${f.url}`,
                    mime: f.mime
                }))
            ])
        } catch (err) {
            console.error(err)
            alert("Ошибка привязки файлов")
        }
    }

    const renderGallery = (
        title: string,
        fieldName: "order_docs" | "device_photos" | "device_photos_site",
        existing: MediaFile[],
        setExisting: React.Dispatch<React.SetStateAction<MediaFile[]>>,
        pondRef: React.MutableRefObject<ReactFilePondType | null>
    ) => {
        const isPhotoGallery = fieldName === "device_photos"

        const openLightboxAt = (clickedUrl: string) => {
            const images = existing.filter((p) => p.mime.startsWith("image/")).map((p) => ({ src: p.url }))
            const index = images.findIndex((p) => p.src === clickedUrl)
            setLightboxImages(images)
            setLightboxIndex(index)
        }

        return (
            <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">{title}</h3>

                <FilePond
                    ref={pondRef}
                    allowMultiple
                    acceptedFileTypes={isPhotoGallery ? ["image/*"] : ["image/*", "application/pdf"]}
                    labelIdle='Перетащите файлы или <span class="filepond--label-action">выберите</span>'
                    server={{
                        process: (fieldNameParam, file, metadata, load, error, progress, abort) => {
                            if (!jwt) {
                                error("Нет токена")
                                return
                            }

                            const formData = new FormData()
                            formData.append("files", file)

                            const xhr = new XMLHttpRequest()
                            xhr.open("POST", `${API_URL}/api/upload`)
                            xhr.setRequestHeader("Authorization", `Bearer ${jwt}`)

                            xhr.upload.onprogress = (e) => {
                                progress(e.lengthComputable, e.loaded, e.total)
                            }

                            xhr.onload = async () => {
                                if (xhr.status >= 200 && xhr.status < 300) {
                                    const uploaded = JSON.parse(xhr.responseText)
                                    await handleAttach(uploaded, fieldName, existing, setExisting)
                                    load("done")
                                } else {
                                    error("Ошибка загрузки")
                                }
                            }

                            xhr.onerror = () => error("Ошибка сети")
                            xhr.send(formData)

                            return {
                                abort: () => {
                                    xhr.abort()
                                    abort()
                                }
                            }
                        }
                    }}
                />

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                    {existing.map((file) => (
                        <div key={file.id} className="relative group border rounded overflow-hidden hover:shadow">
                            <div
                                className="block w-full h-64 cursor-pointer"
                                onClick={() => file.mime.startsWith("image/") && openLightboxAt(file.url)}
                            >
                                {file.mime.startsWith("image/") ? (
                                    <Image src={file.url} alt={file.name} width={200} height={200} className="size-full h-64 object-contain" />
                                ) : (
                                    <div className="flex justify-center items-center w-full h-64 bg-muted">
                                        <FileTextIcon className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                )}
                            </div>

                            <div className="p-2 text-sm truncate border-t bg-background">{file.name}</div>
                            <div className="flex gap-2 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    type="button"
                                    size="icon"
                                    className=""
                                    asChild
                                >
                                    <Link href={`${file.url}`} target="_blank" download>
                                        <DownloadIcon className="w-4 h-4" />
                                    </Link>
                                </Button>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="destructive"
                                    className=""
                                    onClick={() => handleDeleteFile(file.id, fieldName, existing, setExisting)}
                                >
                                    <Trash2Icon className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>


            </div>
        )
    }

    return (
        <div className="space-y-8">
            {renderGallery("Документы и чеки", "order_docs", docs, setDocs, pondDocsRef)}
            {renderGallery("Фотографии", "device_photos", photos, setPhotos, pondPhotosRef)}
            {renderGallery("Фотографии для сайта", "device_photos_site", photos, setPhotos, pondPhotosRef)}

            {lightboxIndex !== null && (
                <Lightbox open index={lightboxIndex} close={() => setLightboxIndex(null)} slides={lightboxImages} className="relative z-[10000]" />
            )}
        </div>
    )
}