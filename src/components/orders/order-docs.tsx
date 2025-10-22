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

type Mode = "download" | "preview";

export const OrderDocs = ({ data }: { data: OrderProps }) => {
  const [signDoc, setSignDoc] = useState<boolean>(false);

  const handleGenerateContract = async (mode: Mode) => {
    const blob = await pdf(
      <GenerateContractPdf order={data} sign={signDoc} />
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

  const handleSendToSign = async () => {
    // 🔐 Интеграция с Podpislon API (позже)
    console.warn("📤 Отправка договора на подпись...");
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
          <div className="hidden items-center gap-2">
            <Checkbox
              id="sign-doc"
              checked={signDoc}
              onCheckedChange={(v) => setSignDoc(Boolean(v))}
            />
            <Label htmlFor="sign-doc">Подписать документ</Label>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Договор</span>
            <div className="flex gap-2">
              {/* Скачать */}
              <Button
                size="sm"
                onClick={() => handleGenerateContract("download")}
              >
                <DownloadIcon className="size-4" />
              </Button>

              {/* Просмотр */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleGenerateContract("preview")}
              >
                <EyeIcon className="size-4" />
              </Button>

              {/* На подпись */}
              <Button
                size="sm"
                variant="default"
                className="bg-amber-500 hover:bg-amber-600"
                onClick={handleSendToSign}
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
