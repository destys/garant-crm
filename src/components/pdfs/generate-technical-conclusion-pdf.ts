/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import jsPDF from "jspdf";
import { format } from "date-fns";

import type { OrderProps } from "@/types/order.types";
import "@/lib/fonts/Roboto-Regular-normal"; // регистрирует "Roboto-Regular"

type Mode = "download" | "preview";
type GenerateOptions = {
  sign?: boolean;
  signatureSrc?: string; // /public/... или dataURL
  stampSrc?: string; // /public/... или dataURL
  mode?: Mode;
};

/* -------------------- helpers: изображения -------------------- */
function loadHTMLImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Image load failed: ${url}`));
    img.src = url;
  });
}

// Любой источник → PNG dataURL
async function toPngDataURL(src?: string) {
  if (!src) return undefined;
  const url = src.startsWith("data:")
    ? src
    : src.startsWith("http")
    ? src
    : `${window.location.origin}${src.startsWith("/") ? "" : "/"}${src}`;

  if (url.startsWith("data:image/png")) return url;

  const img = await loadHTMLImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/png");
}

// Квадратная печать: обрезаем по короткой стороне
async function addSquareImage(
  doc: jsPDF,
  src: string | undefined,
  x: number,
  y: number,
  sizeMM: number
) {
  if (!src) return;
  try {
    const url =
      src.startsWith("http") || src.startsWith("data:")
        ? src
        : `${window.location.origin}${src.startsWith("/") ? "" : "/"}${src}`;
    const img = await loadHTMLImage(url);

    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    const dx = (img.naturalWidth - side) / 2;
    const dy = (img.naturalHeight - side) / 2;
    ctx.drawImage(img, dx, dy, side, side, 0, 0, side, side);
    const dataUrl = canvas.toDataURL("image/png");
    doc.addImage(dataUrl, "PNG", x, y, sizeMM, sizeMM, undefined, "FAST");
  } catch (e) {
    console.warn("addSquareImage failed:", e);
  }
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
    console.warn("addImageSafe failed:", e);
  }
}

/* -------------------- normalize data -------------------- */
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
    place: input?.client?.address ?? a?.client?.address ?? "",
    defect: input?.defect ?? ci.defect ?? "",
    conclusion: input?.conclusion ?? ci.conclusion ?? "",
    engineer: input?.master?.name ?? a?.master?.name ?? "",
    client: {
      name: input?.client?.name ?? a?.client?.name ?? "",
      address: input?.client?.address ?? a?.client?.address ?? "",
      phone: input?.client?.phone ?? a?.client?.phone ?? "",
    },
  };
}

/* -------------------- generator -------------------- */
export async function generateTechnicalConclusionPdf(
  order: OrderProps | any,
  opts: GenerateOptions = {}
) {
  const {
    sign = false,
    signatureSrc = "/images/sign.png",
    stampSrc = "/images/seal.png",
    mode = "download",
  } = opts;

  const o = normalizeOrderLike(order);
  const nowDate = format(new Date(), "dd.MM.yyyy");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // базовые настройки
  doc.setFont("Roboto-Regular");
  doc.setTextColor(0, 0, 0);

  /* ---------- HEADER ---------- */
  const marginX = 10;
  let y = 12;

  await addImageSafe(doc, "/images/logo.png", marginX, y, 40, 12);

  doc.setFontSize(8);
  const rightColX = pageWidth - marginX - 70;
  [
    "ООО “Гарант”",
    "ИНН 4705097126",
    "КПП 470501001",
    "Адрес: г. Санкт-Петербург, ул. Фрунзе д.6",
    "Телефон: 8 (812)–220 -70 -70",
    "spbgarant.ru",
  ].forEach((txt, i) => {
    doc.text(txt, rightColX + 70, y + i * 5, { align: "right" });
  });
  y += 22;

  /* ---------- TITLE ---------- */
  doc.setFontSize(12);
  doc.text(`Акт технического заключения № ${o.number}`, pageWidth / 2, y + 6, {
    align: "center",
  });
  y += 16;

  /* ---------- FIELDS (как в примере) ---------- */
  doc.setFontSize(11);
  const printField = (label: string, value: string) => {
    const text = `${label} ${value ?? ""}`;
    const wrapped = doc.splitTextToSize(text, pageWidth - marginX * 2);
    doc.text(wrapped, marginX, y);
    y += wrapped.length * 6 + 4;
  };

  printField("Тип устройства:", o.device || "—");
  printField(
    "Торговая марка/модель/S/N:",
    `${o.brand || "—"}/${o.model || "—"}/${o.serial || "—"}`
  );
  printField("Место пребывания:", o.place || "—");

  y += 4;

  doc.setFontSize(11);
  doc.text("Результат диагностики", marginX, y);
  y += 8;
  doc.setFontSize(11);
  printField("Заявленный владельцем дефект:", o.defect || "—");
  printField("Продиагностировал (Ф.И.О инженера):", o.engineer || "—");
  printField("Заключение:", o.conclusion || "—");

  y += 6;

  doc.setFontSize(11);
  doc.text("Владелец аппарата", marginX, y);
  y += 8;
  doc.setFontSize(11);
  printField("Ф.И.О:", o.client.name || "—");
  printField("Адрес:", o.client.address || "—");
  printField("Телефон:", o.client.phone || "—");

  y += 6;

  doc.setFontSize(11);
  doc.text("Доверенное лицо", marginX, y);
  y += 8;
  doc.setFontSize(11);
  printField("ООО «Гарант»", "");
  printField("Ф.И.О инженера:", o.engineer || "—");
  printField("Дата выдачи акта:", nowDate);

  y += 6;

  /* ---------- SIGNATURES ---------- */
  doc.setFontSize(10);
  doc.text("С условиями сервисного обслуживание ознакомлен:", marginX, y);
  y += 10;

  doc.text("Заказчик:____________________/____________", marginX, y);
  doc.text(
    "Исполнитель:____________________/____________",
    pageWidth - marginX,
    y,
    { align: "right" }
  );

  if (sign) {
    await addSquareImage(doc, stampSrc, pageWidth / 2 - 25, y - 22, 50); // печать 50×50 мм (квадрат)
    await addImageSafe(
      doc,
      signatureSrc,
      pageWidth - marginX - 45,
      y - 24,
      45,
      45
    );
  }

  /* ---------- OUTPUT ---------- */
  const fileName = `Акт_тех_заключения_${
    o.number || "без-номера"
  }_${nowDate}.pdf`;
  if (mode === "preview") {
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  doc.save(fileName);
}
