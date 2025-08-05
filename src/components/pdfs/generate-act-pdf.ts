// generate-act.ts

import jsPDF from "jspdf"

import { OrderProps } from "@/types/order.types"
import "@/lib/fonts/Roboto-Regular-normal"

export const generateActPdf = (order: OrderProps) => {
    const doc = new jsPDF()
    doc.setFont("Roboto-Regular")
    doc.setFontSize(16)

    doc.text(`Акт выполненных работ №${order.title}`, 20, 20)

    doc.setFontSize(12)
    doc.text(`Аппарат: ${order.device_type || ""}`, 20, 40)
    doc.text(`Производитель: ${order.brand || ""}`, 20, 50)
    doc.text(`Модель: ${order.model || ""}`, 20, 60)
    doc.text(`Серийный номер: ${order.serial_number || ""}`, 20, 70)
    doc.text(`Выполненные работы: ${order.completed_work || ""}`, 20, 90)
    doc.text(`Общая стоимость: ${order.total_cost || "0"} руб.`, 20, 100)
    doc.text(`Дата выдачи: ${order.date_of_issue || "—"}`, 20, 110)

    doc.text(`\n\nС условиями сервисного обслуживания ознакомлен`, 20, 130)
    doc.text(`Заказчик: ___________________ / ____________`, 20, 150)
    doc.text(`Исполнитель: ___________________ / ____________`, 20, 160)

    doc.save(`Акт №${order.title}.pdf`)
}