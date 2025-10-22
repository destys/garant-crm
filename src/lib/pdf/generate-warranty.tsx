/* eslint-disable jsx-a11y/alt-text */
"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
  pdf,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { OrderProps } from "@/types/order.types";

Font.register({
  family: "Roboto",
  fonts: [
    { src: "/fonts/Roboto-Regular.ttf", fontWeight: "normal" },
    { src: "/fonts/Roboto-Bold.ttf", fontWeight: "bold" },
  ],
});

interface PdfOptions {
  sign?: boolean;
  signatureSrc?: string;
  stampSrc?: string;
  mode?: "download" | "preview";
}

/* ---------- Основная функция ---------- */
export const generateWarrantyPdf = async (
  order: OrderProps,
  options?: PdfOptions
) => {
  const blob = await pdf(
    <WarrantyDocument order={order} options={options} />
  ).toBlob();

  const fileName = `Гарантийный_талон_${order.title || "без-номера"}.pdf`;
  const url = URL.createObjectURL(blob);

  if (options?.mode === "preview") {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
};

/* ---------- Документ ---------- */
const WarrantyDocument = ({
  order,
  options,
}: {
  order: OrderProps;
  options?: PdfOptions;
}) => {
  const today = format(new Date(), "dd.MM.yyyy", { locale: ru });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Image src={"/images/logo.png"} style={styles.logo} />
          <View style={{ textAlign: "right", fontSize: 9 }}>
            <Text>ООО “Гарант”</Text>
            <Text>ИНН 4705097126 / КПП 470501001</Text>
            <Text>г. Санкт-Петербург, пр. Вознесенский дом 55 Литер А</Text>
            <Text>Тел.: 8 (812) 220-70-70</Text>
            <Text>spbgarant.ru</Text>
          </View>
        </View>

        <Text style={styles.title}>
          ГАРАНТИЙНЫЙ ТАЛОН № {order.title || "—"}
        </Text>

        {/* Основная таблица */}
        <View style={styles.table}>
          <Row label="Тип техники:" value={order.device_type} />
          <Row
            label="Произведенные работы:"
            value={order.completed_work || "—"}
          />
          <Row
            label="Срок гарантийной поддержки:"
            value={order.warranty || "180 календарных дней"}
            isLast
          />
        </View>

        {/* Описание */}
        <Text style={styles.paragraphTitle}>
          Условия предоставления гарантии
        </Text>
        <Paragraph text="1. Гарантийный ремонт оборудования проводится при предъявлении клиентом полностью заполненного гарантийного талона." />
        <Paragraph text="2. Доставка оборудования в сервисную службу осуществляется клиентом самостоятельно и за свой счет, если иное не оговорено в письменных соглашениях." />
        <Paragraph text="3. Гарантийные обязательства не распространяются на материалы и детали, считающиеся расходными в процессе эксплуатации." />

        <Text style={styles.paragraphTitle}>
          Условия прерывания гарантийных обязательств
        </Text>
        <Paragraph text="1. Несоответствие серийного номера оборудования данным гарантийного талона." />
        <Paragraph text="2. Наличие механических повреждений, вызванных нарушением правил эксплуатации." />
        <Paragraph text="3. Нарушение правил использования, описанных в технической документации." />
        <Paragraph text="4. Повреждение контрольных пломб." />
        <Paragraph text="5. Наличие внутри корпуса оборудования посторонних предметов." />
        <Paragraph text="6. Воздействие форс-мажорных факторов или действий третьих лиц." />
        <Paragraph text="7. Установка оборудования неквалифицированным персоналом, если требовалась сертифицированная установка." />

        <Text style={[styles.paragraph, { marginTop: 10 }]}>
          Продающая организация: ООО «ГАРАНТ»
        </Text>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={{ marginBottom: 10 }}>
            С условиями сервисного обслуживания ознакомлен:
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              position: "relative",
            }}
          >
            <Text>Заказчик: ____________________/____________</Text>
            <Text>Исполнитель: ____________________/____________</Text>

            {options?.sign && (
              <>
                {options?.stampSrc && (
                  <Image src={options.stampSrc} style={styles.stamp} />
                )}
                {options?.signatureSrc && (
                  <Image src={options.signatureSrc} style={styles.sign} />
                )}
              </>
            )}
          </View>
          <Text
            style={{
              textAlign: "right",
              fontSize: 9,
              marginTop: 16,
              color: "#555",
            }}
          >
            Дата формирования: {today}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

/* ---------- Элементы ---------- */
const Row = ({
  label,
  value,
  isLast,
}: {
  label: string;
  value?: string;
  isLast?: boolean;
}) => (
  <View
    style={[
      styles.row,
      isLast ? { borderBottomWidth: 0.5 } : { borderBottomWidth: 0 },
    ]}
  >
    <Text style={styles.cellLabel}>{label}</Text>
    <Text style={styles.cellValue}>{value || "—"}</Text>
  </View>
);

const Paragraph = ({ text }: { text: string }) => (
  <Text style={styles.paragraph}>{text}</Text>
);

/* ---------- Стили ---------- */
const styles = StyleSheet.create({
  page: { fontFamily: "Roboto", fontSize: 9, padding: 30, lineHeight: 1.4 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  logo: { width: 100, height: 30 },
  title: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 12,
  },
  table: {
    borderWidth: 0.5,
    borderColor: "#aaa",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: "#aaa",
  },
  cellLabel: {
    width: "40%",
    padding: 4,
    fontWeight: "bold",
    backgroundColor: "#f8f8f8",
  },
  cellValue: { width: "60%", padding: 4 },
  paragraphTitle: {
    fontWeight: "bold",
    marginTop: 6,
    marginBottom: 4,
  },
  paragraph: { marginBottom: 3, textAlign: "justify" },
  footer: { marginTop: 16 },
  stamp: {
    position: "absolute",
    left: "40%",
    bottom: -60,
    width: 120,
  },
  sign: {
    position: "absolute",
    right: 40,
    bottom: -50,
    width: 100,
  },
});
