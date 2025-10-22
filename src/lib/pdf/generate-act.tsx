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

// Шрифты
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

export const generateActPdf = async (
  order: OrderProps,
  options?: PdfOptions
) => {
  const doc = <ActDocument order={order} options={options} />;
  const blob = await pdf(doc).toBlob();

  if (options?.mode === "preview") {
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Акт_${order.title || "без-номера"}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};

/* ---------- PDF COMPONENT ---------- */
const ActDocument = ({
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
        {/* ---------- HEADER ---------- */}
        <View style={styles.header}>
          <Image src="/images/logo.png" style={styles.logo} />
          <View style={{ textAlign: "right", fontSize: 9 }}>
            <Text>ООО “Гарант”</Text>
            <Text>ИНН 4705097126 / КПП 470501001</Text>
            <Text>Адрес: г. Санкт-Петербург, Вознесенский пр. 55</Text>
            <Text>Телефон: 8 (812) 220-70-70</Text>
            <Text>spbgarant.ru</Text>
          </View>
        </View>

        {/* ---------- TITLE ---------- */}
        <Text style={styles.title}>
          Акт выполненных работ № {order.title || "____"}
        </Text>

        {/* ---------- TABLE ---------- */}
        <View style={styles.table}>
          <Row label="Аппарат:" value={order.device_type} />
          <Row
            label="Производитель/модель:"
            value={`${order.brand || ""} ${order.model || ""}`}
          />
          <Row label="Выполненные работы:" value={order.note} />
          <Row label="Общая стоимость:" value={`${order.total_cost || 0} ₽`} />
          <Row
            label="Дата выдачи:"
            value={format(new Date(order.date_of_issue), "dd.MM.yyyy", {
              locale: ru,
            })}
          />
        </View>

        {/* ---------- FOOTER ---------- */}
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

/* ---------- REUSABLE ROW ---------- */
const Row = ({ label, value }: { label: string; value?: string | number }) => (
  <View style={styles.row}>
    <Text style={styles.cellLabel}>{label}</Text>
    <Text style={styles.cellValue}>{value || "—"}</Text>
  </View>
);

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 9,
    padding: 30,
    lineHeight: 1.4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  logo: {
    width: 100,
    height: 30,
  },
  title: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 12,
  },
  table: {
    borderWidth: 0.5,
    borderColor: "#aaa",
    marginBottom: 20,
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
  cellValue: {
    width: "60%",
    padding: 4,
  },
  footer: {
    marginTop: 20,
  },
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
