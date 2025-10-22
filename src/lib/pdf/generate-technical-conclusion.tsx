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

/* ---------- Генерация PDF ---------- */
export const generateTechnicalConclusionPdf = async (
  order: OrderProps,
  options?: PdfOptions
) => {
  const doc = <TechnicalConclusionDocument order={order} options={options} />;
  const blob = await pdf(doc).toBlob();

  const fileName = `Техническое_заключение_${order.title || "без-номера"}.pdf`;
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

/* ---------- Документ PDF ---------- */
const TechnicalConclusionDocument = ({
  order,
  options,
}: {
  order: OrderProps;
  options?: PdfOptions;
}) => {
  const today = format(new Date(), "dd.MM.yyyy", { locale: ru });
  const engineer = order.master?.name || "—";
  const client = order.client || {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ---------- HEADER ---------- */}
        <View style={styles.header}>
          <Image src="/images/logo.png" style={styles.logo} />
          <View style={{ textAlign: "right", fontSize: 9 }}>
            <Text>ООО “Гарант”</Text>
            <Text>ИНН 4705097126 / КПП 470501001</Text>
            <Text>г. Санкт-Петербург, пр. Вознесенский дом 55 Литер А </Text>
            <Text>Тел.: 8 (812) 220-70-70</Text>
            <Text>spbgarant.ru</Text>
          </View>
        </View>

        <Text style={styles.title}>
          Акт технического заключения № {order.title || "—"}
        </Text>

        {/* ---------- ОБЩИЕ ДАННЫЕ ---------- */}
        <Section title="Аппарат">
          <Row label="Модель:" value={order.device_type || "—"} />
          <Row
            label="Производитель / модель / S/N:"
            value={`${order.brand || "—"} ${order.model || ""} ${
              order.serial_number || ""
            }`}
          />
          <Row
            label="Место пребывания:"
            value={client.address || order.add_address || "—"}
          />
        </Section>

        {/* ---------- РЕЗУЛЬТАТ ДИАГНОСТИКИ ---------- */}
        <Section title="Результат диагностики">
          <Row label="Заявленный дефект:" value={order.defect || "—"} />
          <Row label="Продиагностировал:" value={engineer} />
          <Row label="Заключение:" value={order.conclusion || "—"} />
        </Section>

        {/* ---------- ВЛАДЕЛЕЦ АППАРАТА ---------- */}
        <Section title="Владелец аппарата">
          <Row label="Ф.И.О:" value={client.name || "—"} />
          <Row label="Адрес:" value={client.address || "—"} />
          <Row label="Телефон:" value={client.phone || "—"} />
        </Section>

        {/* ---------- ДОВЕРЕННОЕ ЛИЦО ---------- */}
        <Section title="Доверенное лицо">
          <Row label="Организация:" value="ООО «Гарант»" />
          <Row label="Ф.И.О инженера:" value={engineer} />
          <Row label="Дата выдачи акта:" value={today} />
        </Section>

        {/* ---------- ПОДПИСИ ---------- */}
        <View style={styles.footer}>
          <Text style={{ marginBottom: 14 }}>
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

/* ---------- ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ ---------- */
const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.table}>{children}</View>
  </View>
);

const Row = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.row}>
    <Text style={styles.cellLabel}>{label}</Text>
    <Text style={styles.cellValue}>{value || "—"}</Text>
  </View>
);

/* ---------- СТИЛИ ---------- */
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
  section: { marginBottom: 12 },
  sectionTitle: {
    backgroundColor: "#f2f2f2",
    fontWeight: "bold",
    padding: 4,
    marginBottom: 4,
  },
  table: {
    borderWidth: 0.5,
    borderColor: "#aaa",
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
  footer: { marginTop: 20 },
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
