/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// components/pdfs/generate-act-pdf.tsx  (или .ts)
"use client";

import jsPDF from "jspdf";

import type { OrderProps } from "@/types/order.types";
import "@/lib/fonts/Roboto-Regular-normal"; // регистрирует "Roboto-Regular"

type Mode = "download" | "preview";
type GenerateOptions = {
  sign?: boolean;
  signatureSrc?: string;
  stampSrc?: string;
  mode?: Mode;
};

// Всегда получает ПНГ dataURL независимо от исходного формата
const toPngDataURL = async (src?: string) => {
  if (!src) return undefined;
  if (src.startsWith("data:")) {
    // если это уже dataURL, но не PNG — перекодируем в PNG через canvas
    if (src.startsWith("data:image/png")) return src;
    const img = await loadHTMLImage(src);
    return drawToCanvasPNG(img);
  }

  const url = src.startsWith("http")
    ? src
    : `${window.location.origin}${src.startsWith("/") ? "" : "/"}${src}`;

  const img = await loadHTMLImage(url);
  return drawToCanvasPNG(img);
};

function loadHTMLImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // на своём домене обычно не нужно, но пусть будет
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Image load failed: ${url}`));
    img.src = url;
  });
}

function drawToCanvasPNG(img: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(img, 0, 0);
  // Конвертим в PNG (поддерживается jsPDF на 100%)
  return canvas.toDataURL("image/png");
}

async function addImageSafe(
  doc: jsPDF,
  src: string | undefined,
  x: number,
  y: number,
  w: number,
  h: number
) {
  if (!src) return;
  try {
    const dataUrl = await toPngDataURL(src);
    if (!dataUrl) return;
    doc.addImage(dataUrl, "PNG", x, y, w, h, undefined, "FAST");
  } catch (e) {
    // не валимся из‑за картинки
    console.warn("addImageSafe failed:", e);
  }
}

function normalizeOrderLike(input: any) {
  const a = input?.attributes ?? {};
  const ci = input?.correct_info ?? a?.correct_info ?? {};
  return {
    number:
      input?.order_number ?? a?.order_number ?? input?.title ?? input?.id ?? "",
    device: input?.device_type ?? ci.device ?? "",
    brand: input?.brand ?? ci.brand ?? "",
    model: input?.model ?? ci.model ?? "",
    serial: input?.serial_number ?? ci.serial_number ?? "",
    work_done: input?.completed_work ?? ci.work_done ?? "",
    total_cost: input?.total_cost ?? ci.estimation ?? 0,
    date_issue: input?.date_of_issue ?? ci.date_issue ?? "",
  };
}

export const generateActPdf = async (
  order: OrderProps | any,
  opts: GenerateOptions = {}
) => {
  const {
    sign = false,
    signatureSrc = "/images/sign.png",
    stampSrc = "/images/seal.png",
    mode = "download",
  } = opts;

  const o = normalizeOrderLike(order);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("Roboto-Regular");
  doc.setTextColor(0, 0, 0);

  // ---------- HEADER ----------
  const marginX = 10;
  let y = 12;

  // Логотип слева (через addImageSafe → всегда PNG)
  await addImageSafe(doc, "/images/logo.png", marginX, y, 40, 12);

  // Реквизиты справа
  doc.setFontSize(8);
  const rightColX = pageWidth - marginX - 70;
  [
    "ООО “Гарант”",
    "ИНН 4705097126",
    "КПП 470501001",
    "Адрес: г. Санкт-Петербург, Вознесенский проспект д. 55",
    "Телефон: 8 (812)–220 -70 -70",
    "spbgarant.ru",
  ].forEach((txt, i) => {
    doc.text(txt, rightColX + 70, y + i * 5, { align: "right" });
  });
  y += 22;

  // ---------- TITLE ----------
  doc.setFontSize(12);
  doc.text(`Акт выполненных работ № ${o.number}`, pageWidth / 2, y + 6, {
    align: "center",
  });
  y += 16;

  // ---------- TABLE ----------
  const tableX = marginX;
  const colW = (pageWidth - marginX * 2) / 2;
  const rowH = 8;

  const drawRow = (leftLabel: string, rightValue: string, isLast = false) => {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(tableX, y, colW * 2, rowH);
    doc.line(tableX + colW, y, tableX + colW, y + rowH);

    doc.setFontSize(9);
    doc.text(leftLabel, tableX + 2, y + 5);
    doc.text(rightValue || "", tableX + colW + 2, y + 5);

    y += rowH;
  };

  drawRow("Аппарат:", o.device);
  drawRow("Производитель/модель:", `${o.brand}/${o.model}`, true);

  y += 6;

  // ---------- BODY ----------
  doc.setFontSize(11);
  const printField = (label: string, value: string) => {
    const text = `${label} ${value ?? ""}`;
    const wrapped = doc.splitTextToSize(text, pageWidth - marginX * 2);
    doc.text(wrapped, marginX, y);
    y += wrapped.length * 6 + 4;
  };

  printField("Выполненные работы:", o.work_done || "");
  printField("Общая стоимость:", `${o.total_cost || 0} руб`);
  printField("Дата выдачи:", o.date_issue || "");

  y += 6;

  // ---------- FOOTER ----------
  doc.setFontSize(10);
  doc.text("С условиями сервисного обслуживания ознакомлен:", marginX, y);
  y += 10;

  doc.text("Заказчик:____________________/____________", marginX, y);
  doc.text(
    "Исполнитель:____________________/____________",
    pageWidth - marginX,
    y,
    { align: "right" }
  );

  // печать + подпись (через safe-конвертацию)
  if (sign) {
    await addImageSafe(doc, stampSrc, pageWidth / 2 - 25, y - 22, 50, 50);
    await addImageSafe(
      doc,
      signatureSrc,
      pageWidth - marginX - 45,
      y - 24,
      45,
      45
    );
  }

  // ---------- OUTPUT ----------
  const fileName = `Акт №${o.number || "без-номера"}.pdf`;
  if (mode === "preview") {
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  doc.save(fileName);
};
