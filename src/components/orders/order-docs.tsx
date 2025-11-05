"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DownloadIcon,
  EyeIcon,
  PhoneCallIcon,
  PrinterIcon,
  PenLineIcon,
} from "lucide-react";
import { IconBrandTelegram, IconBrandWhatsapp } from "@tabler/icons-react";
import { pdf } from "@react-pdf/renderer";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { OrderProps } from "@/types/order.types";
import { GenerateContractPdf } from "@/lib/pdf/generate-contract";
import { generateActPdf } from "@/lib/pdf/generate-act";
import { generateTechnicalConclusionPdf } from "@/lib/pdf/generate-technical-conclusion";
import { generateWarrantyPdf } from "@/lib/pdf/generate-warranty";

type Mode = "download" | "preview";

export const OrderDocs = ({ data }: { data: OrderProps }) => {
  const [signDoc, setSignDoc] = useState<boolean>(false);

  // ---------- Договор ----------
  const handleGenerateContract = async (mode: Mode) => {
    const blob = await pdf(
      <GenerateContractPdf order={data} sign={!signDoc} />
    ).toBlob();

    const fileName = `Договор_${data.title || "без-номера"}.pdf`;
    const url = URL.createObjectURL(blob);

    if (mode === "download") {
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // ---------- Акт ----------
  const handleGenerateAct = async (mode: Mode) => {
    await generateActPdf(data, {
      sign: !signDoc,
      signatureSrc: "/sign.png",
      stampSrc: "/stamp.png",
      mode,
    });
  };

  const handleSendToSign = async (
    type: "contract" | "act" | "technical" | "warranty"
  ) => {
    // 🔐 Подключим Podpislon позже
    console.warn(`📤 Отправка на подпись документа: ${type}`);
  };

  return (
    <div className="flex gap-2">
      {/* Звонок */}
      <Button asChild>
        <Link href={`tel:${data.client?.phone}`}>
          <PhoneCallIcon />
        </Link>
      </Button>

      {/* WhatsApp */}
      <Button asChild className="bg-[#2cb742] hover:bg-[#2ca83c]">
        <Link
          href={`https://wa.me/${data.client?.phone?.replace(/\D/g, "")}`}
          target="_blank"
        >
          <IconBrandWhatsapp />
        </Link>
      </Button>

      {/* Telegram */}
      <Button asChild className="bg-[#27a7e7] hover:bg-[#1b95d1]">
        <Link
          href={`https://t.me/${data.client?.phone?.replace(/\D/g, "")}`}
          target="_blank"
        >
          <IconBrandTelegram />
        </Link>
      </Button>

      {/* PDF / Печать */}
      <Popover>
        <PopoverTrigger asChild>
          <Button title="Печать / PDF">
            <PrinterIcon />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[340px] space-y-4">
          {/* Подпись */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="sign-doc"
              checked={signDoc}
              onCheckedChange={(v) => setSignDoc(Boolean(v))}
            />
            <Label htmlFor="sign-doc">Убрать печать и подпись</Label>
          </div>

          {/* ---------- ДОГОВОР ---------- */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Договор</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleGenerateContract("download")}
              >
                <DownloadIcon className="size-4" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleGenerateContract("preview")}
              >
                <EyeIcon className="size-4" />
              </Button>

              <Button
                size="sm"
                variant="default"
                className="bg-amber-500 hover:bg-amber-600"
                onClick={() => handleSendToSign("contract")}
              >
                <PenLineIcon className="size-4" />
              </Button>
            </div>
          </div>

          {/* ---------- АКТ ВЫПОЛНЕННЫХ РАБОТ ---------- */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Акт выполненных работ</span>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleGenerateAct("download")}>
                <DownloadIcon className="size-4" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleGenerateAct("preview")}
              >
                <EyeIcon className="size-4" />
              </Button>

              <Button
                size="sm"
                variant="default"
                className="bg-amber-500 hover:bg-amber-600"
                onClick={() => handleSendToSign("act")}
              >
                <PenLineIcon className="size-4" />
              </Button>
            </div>
          </div>

          {/* ---------- ТЕХНИЧЕСКОЕ ЗАКЛЮЧЕНИЕ ---------- */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">
              Акт технического заключения
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() =>
                  generateTechnicalConclusionPdf(data, {
                    sign: !signDoc,
                    signatureSrc: "/sign.png",
                    stampSrc: "/stamp.png",
                    mode: "download",
                  })
                }
              >
                <DownloadIcon className="size-4" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  generateTechnicalConclusionPdf(data, {
                    sign: !signDoc,
                    signatureSrc: "/sign.png",
                    stampSrc: "/stamp.png",
                    mode: "preview",
                  })
                }
              >
                <EyeIcon className="size-4" />
              </Button>

              <Button
                size="sm"
                variant="default"
                className="bg-amber-500 hover:bg-amber-600"
                onClick={() => handleSendToSign("technical")}
              >
                <PenLineIcon className="size-4" />
              </Button>
            </div>
          </div>
          {/* ---------- ГАРАНТИЙНЫЙ ТАЛОН ---------- */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Гарантийный талон</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() =>
                  generateWarrantyPdf(data, {
                    sign: !signDoc,
                    signatureSrc: "/sign.png",
                    stampSrc: "/stamp.png",
                    mode: "download",
                  })
                }
              >
                <DownloadIcon className="size-4" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  generateWarrantyPdf(data, {
                    sign: !signDoc,
                    signatureSrc: "/sign.png",
                    stampSrc: "/stamp.png",
                    mode: "preview",
                  })
                }
              >
                <EyeIcon className="size-4" />
              </Button>

              <Button
                size="sm"
                variant="default"
                className="bg-amber-500 hover:bg-amber-600"
                onClick={() => handleSendToSign("warranty")}
              >
                <PenLineIcon className="size-4" />
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
