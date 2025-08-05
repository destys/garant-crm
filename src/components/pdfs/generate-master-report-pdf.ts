// generate-period-report.ts

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format, eachDayOfInterval, isSameDay } from "date-fns"

import { OrderProps } from "@/types/order.types"
import "@/lib/fonts/Roboto-Regular-normal"

export const generateMasterReportPdf = (
    orders: OrderProps[],
    from: Date,
    to: Date
) => {
    const doc = new jsPDF()
    doc.setFont("Roboto-Regular")
    doc.setFontSize(14)

    const formattedTitle = `${format(from, "dd.MM.yy")} — ${format(to, "dd.MM.yy")}`
    doc.text(formattedTitle, 105, 15, { align: "center" })

    const days = eachDayOfInterval({ start: from, end: to })
    let yOffset = 25

    days.forEach((day) => {
        const ordersForDay = orders.filter((o) => isSameDay(new Date(o.createdAt), day))
        if (ordersForDay.length === 0) return

        const refused = ordersForDay.filter((o) => o.orderStatus === "Отказ")
        const actual = ordersForDay.filter((o) => o.orderStatus !== "Отказ" && o.orderStatus !== "Выдан")

        const title = format(day, "dd.MM.yy")
        doc.setFontSize(12)
        doc.text(title, 14, yOffset)
        yOffset += 6

        // 1. Общая статистика
        autoTable(doc, {
            startY: yOffset,
            head: [["Принято", "Актуальные", "Отказные"]],
            body: [[ordersForDay.length, actual.length, refused.length]],
            styles: { font: "Roboto-Regular", fontStyle: "normal" },
            headStyles: { font: "Roboto-Regular", fontStyle: "normal" },
        })
        yOffset = doc.lastAutoTable!.finalY + 6

        yOffset += 10
        doc.text("Актуальные заявки", 14, yOffset)
        yOffset += 6
        // 2. Актуальные заявки
        autoTable(doc, {
            startY: yOffset,
            head: [[
                "номер заявки",
                "об устройстве",
                "данные клиента",
                "мастер",
                "стоимость работ",
                "расход",
                "доход",
            ]],
            body: actual.map((o) => [
                o.title,
                `${o.device_type} ${o.brand} ${o.model}`,
                [
                    o.client?.name ?? "",
                    o.client?.phone ?? "",
                    o.client?.address ?? "",
                ].filter(Boolean).join("\n"),
                o.master?.name ?? "",
                o.total_cost ?? "",
                `${o.outcomes.reduce((sum, out) => sum + (out.count || 0), 0)} ₽`,
                `${o.incomes.reduce((sum, inc) => sum + (inc.count || 0), 0)} ₽`,
            ]),
            styles: { font: "Roboto-Regular", fontStyle: "normal" },
            headStyles: { font: "Roboto-Regular", fontStyle: "normal" },
        })
        yOffset = doc.lastAutoTable!.finalY + 6

        yOffset += 10
        doc.text("Отказные заявки", 14, yOffset)
        yOffset += 6
        // 3. Отказные заявки
        autoTable(doc, {
            startY: yOffset,
            head: [[
                "номер заявки",
                "об устройстве",
                "данные клиента",
                "мастер",
                "причина отказа",
            ]],
            body: refused.map((o) => [
                o.title,
                `${o.device_type} ${o.brand} ${o.model}`,
                [
                    o.client?.name ?? "",
                    o.client?.phone ?? "",
                    o.client?.address ?? "",
                ].filter(Boolean).join("\n"),
                o.master?.name ?? "",
                o.reason_for_refusal ?? "",
            ]),
            styles: { font: "Roboto-Regular", fontStyle: "normal" },
            headStyles: { font: "Roboto-Regular", fontStyle: "normal" },
        })
        yOffset = doc.lastAutoTable!.finalY + 10
    })

    doc.save(`Отчет_${format(from, "dd.MM.yy")}_${format(to, "dd.MM.yy")}.pdf`)
}