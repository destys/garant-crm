// pdfs/generate-orders-report-pdf.ts
import jsPDF from "jspdf";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { OrderProps } from "@/types/order.types";
import "@/lib/fonts/Roboto-Regular-normal"; // один шрифт

type Period = { from?: Date; to?: Date };

const FONT = "Roboto-Regular";

export const generateOrdersReportPdf = (
    orders: OrderProps[],
    period?: Period
) => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    // базовые настройки
    doc.setFont(FONT, "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // сетка → 2 колонки × 4 строки = 8 карточек
    const margin = 10;
    const gutterX = 5;
    const gutterY = 6;
    const cols = 2;
    const rows = 4;
    const cardsPerPage = cols * rows;

    const colW = round1((pageW - margin * 2 - gutterX) / cols);
    const rowH = round1((pageH - margin * 2 - gutterY * (rows - 1)) / rows);
    const padX = 2;
    const padTop = 2;
    const lineH = 5;

    // заголовок
    if (period?.from && period?.to) {
        doc.setFontSize(11);
        const title = `${format(period.from, "dd.MM.yyyy", { locale: ru })} — ${format(
            period.to,
            "dd.MM.yyyy",
            { locale: ru }
        )}`;
        doc.text(title, pageW / 2, margin - 2, { align: "center" });
        doc.setFontSize(9); // вернуть базовый
    }

    const labelColor = { r: 15, g: 52, b: 96 };
    const labelGap = 2.5;

    // настройки рамки карточки
    const borderColor = { r: 180, g: 180, b: 180 };
    const borderLineWidth = 0.3; // мм

    const cards = orders.map((o) => {
        const number =
            o.title?.trim() ||
            (o.id ? `#${o.id}` : o.documentId?.slice(0, 8) || "—");

        const departure =
            safeDate(o.departure_date) ||
            safeDate(o.visit_date) ||
            safeDate(o.createdAt) ||
            "—";

        const master = o.master?.name || "—";
        const clientNumber = o.client?.phone || o.add_phone || "—";
        const address = o.add_address || o.client?.address || "—";
        const deviceType = o.device_type || "—";
        const brandModel = [o.brand, o.model].filter(Boolean).join(" ") || "—";
        const defect = o.defect || "—";
        const note = o.note || "—";

        return {
            lines: [
                { label: "Номер заявки:", value: number },
                { label: "Дата выезда:", value: departure },
                { label: "ФИО мастера:", value: master },
                { label: "Номер клиента:", value: clientNumber },
                { label: "Адрес выезда:", value: address },
                { label: "Тип техники:", value: deviceType },
                { label: "Производитель и модель:", value: brandModel },
                { label: "Неисправность:", value: defect },
                { label: "Комментарий:", value: note },
            ],
        };
    });

    cards.forEach((card, idx) => {
        const pageIndex = Math.floor(idx / cardsPerPage);
        const idxOnPage = idx % cardsPerPage;
        const row = Math.floor(idxOnPage / cols);
        const col = idxOnPage % cols;

        if (idxOnPage === 0 && pageIndex > 0) {
            doc.addPage();
            doc.setFont(FONT, "normal");
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
        }

        const x = round1(margin + col * (colW + gutterX));
        const y = round1(margin + row * (rowH + gutterY));

        // === РАМКА КАРТОЧКИ (граница) ===
        doc.setDrawColor(borderColor.r, borderColor.g, borderColor.b);
        doc.setLineWidth(borderLineWidth);
        doc.rect(x, y, colW, rowH); // сплошной прямоугольник-рамка

        const contentX = x + padX;
        let curY = y + padTop;

        // максимальная ширина лейблов
        const labelMaxW = Math.max(...card.lines.map((l) => doc.getTextWidth(l.label)));
        const valueStartX = contentX + labelMaxW + labelGap;
        const valueMaxW = colW - padX * 2 - labelMaxW - labelGap;

        // вернуть цвет текста для контента
        doc.setTextColor(0, 0, 0);

        card.lines.forEach(({ label, value }) => {
            doc.setTextColor(labelColor.r, labelColor.g, labelColor.b);
            doc.text(label, contentX, curY);

            doc.setTextColor(0, 0, 0);
            const wrapped = doc.splitTextToSize(safeStr(value), valueMaxW) as string[];
            doc.text(wrapped[0] ?? "—", valueStartX, curY);

            let localY = curY + lineH;
            for (let j = 1; j < wrapped.length; j++) {
                if (localY > y + rowH - 1) break; // -1 чтобы не упираться в рамку
                doc.text(wrapped[j], valueStartX, localY);
                localY += lineH;
            }

            curY = localY;
        });
    });

    doc.save(buildFilename(period));
};

// helpers
function safeStr(v?: string) {
    if (v == null) return "—";
    const s = String(v).trim();
    return s.length ? s : "—";
}
function safeDate(v?: string) {
    if (!v) return "";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    try {
        return format(d, "dd.MM.yyyy", { locale: ru });
    } catch {
        return "";
    }
}
function buildFilename(period?: Period) {
    if (period?.from && period?.to) {
        return `Отчет_заявки_${format(period.from, "dd.MM.yy")}_${format(
            period.to,
            "dd.MM.yy"
        )}.pdf`;
    }
    return "Отчет_заявки.pdf";
}
function round1(n: number) {
    return Math.round(n * 10) / 10;
}