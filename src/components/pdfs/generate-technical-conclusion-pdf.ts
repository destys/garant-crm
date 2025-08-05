import { jsPDF } from "jspdf";
import { format } from "date-fns";

import { OrderProps } from "@/types/order.types";
import "@/lib/fonts/Roboto-Regular-normal";

export const generateTechnicalConclusionPdf = (order: OrderProps) => {
  const doc = new jsPDF();
  const nowDate = format(new Date(), "dd.MM.yyyy");
  doc.setFont("Roboto-Regular");
  doc.setFontSize(12);

  const fullName = order.master?.name || "";
  const client = order.client || {};

  doc.text(`Акт технического заключения № ${order.title}`, 105, 20, {
    align: "center",
  });

  let y = 30;
  const indent = 20;

  doc.text(`Тип устройства: ${order.device_type || "—"}`, indent, y);
  y += 8;
  doc.text(
    `Бренд/Модель/SN: ${order.brand || "—"}/${order.model || "—"}/${
      order.serial_number || "—"
    }`,
    indent,
    y
  );
  y += 8;
  doc.text(`Место пребывания: ${client.address || "—"}`, indent, y);

  y += 12;
  doc.text("Результат диагностики: ", indent, y);
  y += 8;
  doc.text(`Заявленный владельцем дефект: ${order.defect || "—"}`, indent, y);
  y += 8;
  doc.text(`Продиагностировал: ${fullName}`, indent, y);
  y += 8;
  doc.text(`Заключение: ${order.conclusion || "—"}`, indent, y);

  y += 12;
  doc.text("Владелец аппарата:", indent, y);
  y += 8;
  doc.text(`ФИО: ${client.name || "—"}`, indent, y);
  y += 8;
  doc.text(`Адрес: ${client.address || "—"}`, indent, y);
  y += 8;
  doc.text(`Телефон: ${client.phone || "—"}`, indent, y);

  y += 12;
  doc.text("Доверенное лицо:", indent, y);
  y += 8;
  doc.text(`ООО «Гарант»`, indent, y);
  y += 8;
  doc.text(`ФИО инженера: ${fullName}`, indent, y);
  y += 8;
  doc.text(`Дата выдачи акта: ${nowDate}`, indent, y);

  y += 20;
  doc.text("С условиями сервисного обслуживания ознакомлен:", indent, y);
  y += 12;
  doc.text("Заказчик: ___________________ / ____________", indent, y);
  y += 8;
  doc.text("Исполнитель: ___________________ / ____________", indent, y);

  doc.save(`Акт_тех_заключения_${order.title}_${nowDate}.pdf`);
};
