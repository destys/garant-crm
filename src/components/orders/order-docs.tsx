"use client";

import { useState } from "react";
import Link from "next/link";
import { DownloadIcon, EyeIcon, MailIcon, PhoneCallIcon, PrinterIcon } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { OrderProps } from "@/types/order.types";
import { generateTechnicalConclusionPdf } from "@/components/pdfs/generate-technical-conclusion-pdf";
import { generateWarrantyPdf } from "@/components/pdfs/generate-warranty-pdf";

import { generateActPdf } from "../pdfs/generate-act-pdf";
import { generateContractPdf } from "../pdfs/generate-contract-pdf";

type Mode = "download" | "preview";

export const OrderDocs = ({ data }: { data: OrderProps }) => {
    const [signDoc, setSignDoc] = useState<boolean>(false);

    // Унифицированный вызов генератора
    const handleGenerate = async (
        type: "contract" | "act" | "warranty" | "technical",
        mode: Mode
    ) => {
        // ⚠️ Предполагаем, что генераторы поддерживают опции { sign, mode }.
        // Если сейчас они просто сразу скачивают файл, добавь в них второй аргумент options
        // и учти:
        // - mode: "download" | "preview"
        // - sign: boolean
        switch (type) {
            case "act":
                await generateActPdf(data, {
                    sign: signDoc,
                    signatureSrc: "/sign.png",
                    stampSrc: "/stamp.png",
                    mode,
                });
                break;
            case "warranty":
                await generateWarrantyPdf(data, {
                    sign: signDoc,
                    signatureSrc: "/sign.png",
                    stampSrc: "/stamp.png",
                    mode,
                });
                break;
            case "technical":
                await generateTechnicalConclusionPdf(data, {
                    sign: signDoc,
                    signatureSrc: "/sign.png",
                    stampSrc: "/stamp.png",
                    mode,
                });
                break;
            case "contract":
                await generateContractPdf(data, {
                    sign: signDoc,
                    signatureSrc: "/sign.png",
                    stampSrc: "/stamp.png",
                    mode,
                });
                break;
        }
    };

    return (
        <div className="flex gap-2">
            <Button asChild>
                <Link href={`tel:${data.client.phone}`}>
                    <PhoneCallIcon />
                </Link>
            </Button>

            <Button disabled asChild>
                <Link href={`tel:${data.client.phone ?? ""}`}>
                    <MailIcon />
                </Link>
            </Button>

            <Popover>
                <PopoverTrigger asChild>
                    <Button title="Печать / PDF">
                        <PrinterIcon />
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[320px] space-y-4">
                    {/* Опция: Подписать документ */}
                    <div className="flex items-center gap-2">
                        <Checkbox id="sign-doc" checked={signDoc} onCheckedChange={(v) => setSignDoc(Boolean(v))} />
                        <Label htmlFor="sign-doc">Подписать документ</Label>
                    </div>

                    {/* Договор */}
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-sm">Договор</span>
                        <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => handleGenerate("contract", "download")}>
                                <DownloadIcon />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleGenerate("contract", "preview")}>
                                <EyeIcon />
                            </Button>
                        </div>
                    </div>

                    {/* Акт */}
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-sm">Акт</span>
                        <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => handleGenerate("act", "download")}>
                                <DownloadIcon />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleGenerate("act", "preview")}>
                                <EyeIcon />
                            </Button>
                        </div>
                    </div>

                    {/* Гарантия */}
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-sm">Гарантия</span>
                        <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => handleGenerate("warranty", "download")}>
                                <DownloadIcon />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleGenerate("warranty", "preview")}>
                                <EyeIcon />
                            </Button>
                        </div>
                    </div>

                    {/* Техническое заключение */}
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-sm">Техническое заключение</span>
                        <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => handleGenerate("technical", "download")}>
                                <DownloadIcon />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleGenerate("technical", "preview")}>
                                <EyeIcon />
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};