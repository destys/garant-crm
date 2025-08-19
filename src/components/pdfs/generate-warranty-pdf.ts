/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import jsPDF from "jspdf";

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
// грузим HTMLImageElement
function loadHTMLImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Image load failed: ${url}`));
    img.src = url;
  });
}

// any→PNG dataURL через canvas (любой исходный формат)
async function toPngDataURL(src?: string) {
  if (!src) return undefined;

  const url = src.startsWith("data:")
    ? src
    : src.startsWith("http")
    ? src
    : `${window.location.origin}${src.startsWith("/") ? "" : "/"}${src}`;

  // если уже dataURL и PNG — вернём как есть
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

// квадратная вставка (обрезаем по короткой стороне)
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

// обычная вставка (с конвертом в PNG)
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
    work_done: input?.completed_work ?? ci.work_done ?? "",
    warranty: input?.warranty ?? ci.warranty ?? "",
  };
}

/* -------------------- generator -------------------- */
export async function generateWarrantyPdf(
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

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // базовые настройки
  doc.setFont("Roboto-Regular");
  doc.setTextColor(0, 0, 0);

  /* ---------- HEADER ---------- */
  const marginX = 10;
  let y = 12;

  // логотип
  await addImageSafe(doc, "/images/logo.png", marginX, y, 40, 12);

  // реквизиты справа
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
  doc.setFontSize(14);
  doc.text(`ГАРАНТИЙНЫЙ ТАЛОН № ${o.number}`, pageWidth / 2, y + 6, {
    align: "center",
  });
  y += 16;

  /* ---------- FIELDS ---------- */
  doc.setFontSize(11);
  const printField = (label: string, value: string) => {
    const text = `${label} ${value ?? ""}`;
    const wrapped = doc.splitTextToSize(text, pageWidth - marginX * 2);
    doc.text(wrapped, marginX, y);
    y += wrapped.length * 6 + 4;
  };

  printField("Тип техники:", o.device || "");
  printField("Произведенные работы:", o.work_done || "");
  printField("Срок гарантийной поддержки:", o.warranty || "—");

  y += 4;

  /* ---------- CONDITIONS ---------- */
  doc.setFontSize(11);
  doc.text("Условия предоставления гарантии", marginX, y);
  y += 8;
  doc.setFontSize(9);

  const provide = [
    "1. Гарантийный ремонт оборудования проводится при предъявлении клиентом полностью заполненного гарантийного талона.",
    "2. Доставка оборудования, подлежащего гарантийному ремонту, в сервисную службу осуществляется клиентом самостоятельно и за свой счет, если иное не оговорено в дополнительных письменных соглашениях.",
    "3. Гарантийные обязательства не распространяются на материалы и детали, относящиеся к расходным в процессе эксплуатации.",
  ];

  provide.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, pageWidth - marginX * 2);
    doc.text(wrapped, marginX, y);
    y += wrapped.length * 5 + 2;
  });

  y += 6;

  doc.setFontSize(11);
  doc.text("Условия прерывания гарантийных обязательств", marginX, y);
  y += 8;
  doc.setFontSize(9);

  const breaks = [
    "1. Несоответствие серийного номера оборудования данным, указанным в гарантийном талоне и/или иных документах.",
    "2. Наличие механических повреждений, возникших в результате нарушения правил транспортировки, хранения или эксплуатации.",
    "3. Нарушение правил и условий эксплуатации, предъявляемых к оборудованию данного типа.",
    "4. Повреждение контрольных этикеток и пломб (если таковые имеются).",
    "5. Наличие внутри корпуса оборудования посторонних предметов, если иное не предусмотрено технической документацией.",
    "6. Отказ, вызванный воздействием непреодолимой силы и/или действиями третьих лиц.",
    "7. Установка и запуск оборудования не сертифицированным персоналом, когда это прямо оговорено в документации.",
  ];

  breaks.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, pageWidth - marginX * 2);
    doc.text(wrapped, marginX, y);
    y += wrapped.length * 5 + 2;
  });

  y += 8;

  doc.setFontSize(10);
  doc.text("Продающая организация ООО «ГАРАНТ»", marginX, y);
  y += 10;

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

  // печать (квадрат) + подпись (обычная), опционально
  if (sign) {
    await addSquareImage(doc, stampSrc, pageWidth / 2 - 25, y - 22, 50); // квадрат 50×50 мм
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
  const fileName = `Гарантийный талон №${o.number || "без-номера"}.pdf`;
  if (mode === "preview") {
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  doc.save(fileName);
}
