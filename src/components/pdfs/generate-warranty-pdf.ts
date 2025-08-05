import { jsPDF } from "jspdf";

import { OrderProps } from "@/types/order.types";
import "@/lib/fonts/Roboto-Regular-normal";

export const generateWarrantyPdf = (order: OrderProps) => {
  const doc = new jsPDF();
  doc.setFont("Roboto-Regular");
  doc.setFontSize(12);

  doc.text(`Гарантийный талон № ${order.title}`, 105, 20, { align: "center" });

  doc.setFontSize(10);
  let y = 40;

  doc.text(`Тип техники: ${order.device_type || ""}`, 20, y);
  y += 10;
  doc.text(`Произведенные работы: ${order.completed_work || ""}`, 20, y);
  y += 10;
  doc.text(
    `Срок гарантийной поддержки: ${order.warranty || "Не указан"}`,
    20,
    y
  );
  y += 20;

  doc.setFontSize(11);
  doc.text("Условия предоставления гарантии", 20, y);
  y += 10;
  doc.setFontSize(9);
  const conditions = [
    "1. Гарантийный ремонт проводится при предъявлении заполненного гарантийного талона.",
    "2. Доставка оборудования в сервис осуществляется за счёт клиента.",
    "3. Гарантия не распространяется на расходные материалы.",
    "4. Гарантия аннулируется при наличии механических повреждений.",
    "5. Установка и запуск должны быть выполнены сертифицированным персоналом.",
  ];
  conditions.forEach((line) => {
    doc.text(line, 20, y);
    y += 6;
  });

  y += 10;
  doc.setFontSize(11);
  doc.text("Подписи сторон", 20, y);
  y += 10;
  doc.text("Заказчик: ___________________ / ____________", 20, y);
  y += 10;
  doc.text("Исполнитель: ___________________ / ____________", 20, y);

  doc.save(`Гарантийный_талон_${order.title}.pdf`);
};
