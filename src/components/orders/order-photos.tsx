"use client";

import { useState, useRef } from "react";
import { FilePond } from "react-filepond";
import type { FilePond as ReactFilePondType } from "react-filepond";
import { Trash2Icon, FileTextIcon, DownloadIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Lightbox from "yet-another-react-lightbox";
import "filepond/dist/filepond.min.css";
import "yet-another-react-lightbox/styles.css";

import { Button } from "@/components/ui/button";
import { API_URL } from "@/constants";
import { useAuth } from "@/providers/auth-provider";
import { useOrders } from "@/hooks/use-orders";
import { OrderProps } from "@/types/order.types";
import { MediaProps } from "@/types/media.types";

interface MediaFile {
  id: number;
  name: string;
  url: string;
  mime: string;
}

interface Props {
  data: OrderProps;
}

export const OrderMedia = ({ data }: Props) => {
  const { updateOrder } = useOrders(1, 1);
  const { jwt, roleId } = useAuth();

  const pondRefs = useRef<Record<string, ReactFilePondType | null>>({});
  const [lightbox, setLightbox] = useState<{
    index: number | null;
    images: { src: string }[];
  }>({
    index: null,
    images: [],
  });

  /** Хранилище всех групп файлов */
  const [files, setFiles] = useState<Record<string, MediaFile[]>>({
    order_docs: (data.order_docs || []).map(mapMedia),
    order_receipts: (data.order_receipts || []).map(mapMedia),
    device_photos: (data.device_photos || []).map(mapMedia),
    device_photos_site: (data.device_photos_site || []).map(mapMedia),
  });

  /** Утилита: преобразование media */
  function mapMedia(file: MediaProps): MediaFile {
    return {
      id: file.id,
      name: file.name,
      url: `${API_URL}${file.url}`,
      mime: file.mime,
    };
  }

  /** Общий обработчик удаления */
  const handleDelete = async (field: string, fileId: number) => {
    if (!jwt) return alert("Нет токена");
    try {
      const updated = files[field].filter((f) => f.id !== fileId);
      await updateOrder({
        documentId: data.documentId,
        updatedData: { [field]: updated.map((f) => f.id) },
      });
      await fetch(`${API_URL}/api/upload/files/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      setFiles((prev) => ({ ...prev, [field]: updated }));
    } catch (err) {
      console.error(err);
      alert("Ошибка удаления файла");
    }
  };

  /** Общий обработчик загрузки */
  const handleAttach = async (field: string, uploaded: MediaProps[]) => {
    const newFiles = uploaded.map(mapMedia);
    const updated = [...files[field], ...newFiles];
    await updateOrder({
      documentId: data.documentId,
      updatedData: { [field]: updated.map((f) => f.id) },
    });
    setFiles((prev) => ({ ...prev, [field]: updated }));
  };

  /** Lightbox */
  const openLightbox = (field: string, clickedUrl: string) => {
    const imgs = files[field]
      .filter((f) => f.mime.startsWith("image/"))
      .map((f) => ({ src: f.url }));
    const index = imgs.findIndex((p) => p.src === clickedUrl);
    setLightbox({ index, images: imgs });
  };

  /** Конфигурация секций */
  const sections = [
    { title: "Документы", field: "order_docs" },
    { title: "Чеки", field: "order_receipts" },
    { title: "Фотографии", field: "device_photos" },
    { title: "Фотографии для сайта", field: "device_photos_site" },
  ] as const;

  return (
    <div className="space-y-8">
      {sections.map(({ title, field }) => (
        <OrderGallerySection
          key={field}
          title={title}
          field={field}
          items={files[field]}
          jwt={jwt}
          roleId={roleId}
          pondRef={(ref) => (pondRefs.current[field] = ref)}
          onAttach={(uploaded) => handleAttach(field, uploaded)}
          onDelete={(id) => handleDelete(field, id)}
          onOpenLightbox={(url) => openLightbox(field, url)}
        />
      ))}

      {lightbox.index !== null && (
        <Lightbox
          open
          index={lightbox.index}
          close={() => setLightbox({ index: null, images: [] })}
          slides={lightbox.images}
          className="relative z-[10000]"
        />
      )}
    </div>
  );
};

/** Отдельный компонент секции */
function OrderGallerySection({
  title,
  field,
  items,
  jwt,
  roleId,
  pondRef,
  onAttach,
  onDelete,
  onOpenLightbox,
}: {
  title: string;
  field: string;
  items: MediaFile[];
  jwt: string | null;
  roleId: number | null;
  pondRef: (ref: ReactFilePondType | null) => void;
  onAttach: (uploaded: MediaProps[]) => void;
  onDelete: (fileId: number) => void;
  onOpenLightbox: (url: string) => void;
}) {
  const isPhoto = field.includes("photo");

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <FilePond
        ref={pondRef}
        allowMultiple
        acceptedFileTypes={
          isPhoto ? ["image/*"] : ["image/*", "application/pdf"]
        }
        labelIdle='Перетащите файлы или <span class="filepond--label-action">выберите</span>'
        server={{
          process: (_, file, __, load, error, progress) => {
            if (!jwt) return error("Нет токена");

            const formData = new FormData();
            formData.append("files", file);

            const xhr = new XMLHttpRequest();
            xhr.open("POST", `${API_URL}/api/upload`);
            xhr.setRequestHeader("Authorization", `Bearer ${jwt}`);

            xhr.upload.onprogress = (e) =>
              progress(e.lengthComputable, e.loaded, e.total);
            xhr.onload = async () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                const uploaded = JSON.parse(xhr.responseText);
                await onAttach(uploaded);
                load("done");
              } else error("Ошибка загрузки");
            };
            xhr.onerror = () => error("Ошибка сети");

            xhr.send(formData);
            return { abort: () => xhr.abort() };
          },
        }}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {items.map((file) => (
          <div
            key={file.id}
            className="relative group border rounded overflow-hidden hover:shadow"
          >
            <div
              className="block w-full h-64 cursor-pointer"
              onClick={() =>
                file.mime.startsWith("image/") && onOpenLightbox(file.url)
              }
            >
              {file.mime.startsWith("image/") ? (
                <Image
                  src={file.url}
                  alt={file.name}
                  width={200}
                  height={200}
                  className="size-full h-64 object-contain"
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
            <div className="flex gap-2 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button asChild size="icon">
                <Link href={file.url} target="_blank" download>
                  <DownloadIcon className="w-4 h-4" />
                </Link>
              </Button>
              {roleId === 3 && (
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => onDelete(file.id)}
                >
                  <Trash2Icon className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
