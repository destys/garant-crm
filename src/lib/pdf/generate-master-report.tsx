"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";
import { format, eachDayOfInterval, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";

import { OrderProps } from "@/types/order.types";

// 🔤 Регистрируем шрифты
Font.register({
  family: "Roboto",
  fonts: [
    { src: "/fonts/Roboto-Regular.ttf", fontWeight: "normal" },
    { src: "/fonts/Roboto-Bold.ttf", fontWeight: "bold" },
  ],
});

interface PdfOptions {
  mode?: "download" | "preview";
}

/* =====================================================
   Главная функция
   ===================================================== */
export const generateMasterReportPdf = async (
  orders: OrderProps[],
  from?: Date,
  to?: Date,
  masterName?: string,
  options?: PdfOptions
) => {
  const doc = (
    <MasterReportDocument
      orders={orders}
      from={from || new Date()}
      to={to || new Date()}
      masterName={masterName}
    />
  );
  const blob = await pdf(doc).toBlob();

  if (options?.mode === "preview") {
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeFrom = from ?? new Date();
  const safeTo = to ?? new Date();

  a.download = `Отчет_${masterName || "мастер"}_${format(
    safeFrom,
    "dd.MM.yy"
  )}_${format(safeTo, "dd.MM.yy")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};

/* =====================================================
   Документ PDF
   ===================================================== */
const MasterReportDocument = ({
  orders,
  from,
  to,
  masterName,
}: {
  orders: OrderProps[];
  from: Date;
  to: Date;
  masterName?: string;
}) => {
  const days = eachDayOfInterval({ start: from, end: to });
  const period = `${format(from, "dd.MM.yy", { locale: ru })} — ${format(
    to,
    "dd.MM.yy",
    { locale: ru }
  )}`;
  const today = format(new Date(), "dd.MM.yyyy", { locale: ru });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.company}>ООО “Гарант”</Text>
          <Text style={styles.subtext}>Ежедневный отчет по мастеру</Text>
          <Text style={styles.subtext}>Период: {period}</Text>
          {masterName && (
            <Text style={[styles.subtext, { marginTop: 2 }]}>
              Мастер: {masterName}
            </Text>
          )}
        </View>

        {days.map((day) => {
          const ordersForDay = orders.filter((o) =>
            isSameDay(new Date(o.createdAt), day)
          );
          if (ordersForDay.length === 0) return null;

          const refused = ordersForDay.filter((o) => o.orderStatus === "Отказ");
          const actual = ordersForDay.filter(
            (o) => o.orderStatus !== "Отказ" && o.orderStatus !== "Выдан"
          );

          return (
            <View key={day.toISOString()} style={styles.daySection}>
              <Text style={styles.dayTitle}>
                {format(day, "dd.MM.yyyy", { locale: ru })}
              </Text>

              {/* Таблица статистики */}
              <Table
                head={["Принято", "Актуальные", "Отказные"]}
                rows={[
                  [
                    ordersForDay.length.toString(),
                    actual.length.toString(),
                    refused.length.toString(),
                  ],
                ]}
              />

              {/* Актуальные */}
              {actual.length > 0 && (
                <>
                  <Text style={styles.subsectionTitle}>Актуальные заявки</Text>
                  <Table
                    head={[
                      "Номер",
                      "Устройство",
                      "Клиент",
                      "Мастер",
                      "Стоимость",
                      "Расход",
                      "Доход",
                    ]}
                    rows={actual.map((o) => [
                      o.title,
                      `${o.device_type} ${o.brand} ${o.model}`,
                      [o.client?.name, o.client?.phone, o.client?.address]
                        .filter(Boolean)
                        .join("\n"),
                      o.master?.name || "",
                      o.total_cost ? `${o.total_cost} ₽` : "—",
                      `${o.outcomes.reduce(
                        (sum, out) => sum + (out.count || 0),
                        0
                      )} ₽`,
                      `${o.incomes.reduce(
                        (sum, inc) => sum + (inc.count || 0),
                        0
                      )} ₽`,
                    ])}
                  />
                </>
              )}

              {/* Отказные */}
              {refused.length > 0 && (
                <>
                  <Text style={styles.subsectionTitle}>Отказные заявки</Text>
                  <Table
                    head={[
                      "Номер",
                      "Устройство",
                      "Клиент",
                      "Мастер",
                      "Причина",
                    ]}
                    rows={refused.map((o) => [
                      o.title,
                      `${o.device_type} ${o.brand} ${o.model}`,
                      [o.client?.name, o.client?.phone, o.client?.address]
                        .filter(Boolean)
                        .join("\n"),
                      o.master?.name || "",
                      o.reason_for_refusal || "",
                    ])}
                  />
                </>
              )}
            </View>
          );
        })}

        <Text style={styles.footer}>Дата формирования: {today}</Text>
      </Page>
    </Document>
  );
};

/* =====================================================
   Таблица (универсальная)
   ===================================================== */
const Table = ({
  head,
  rows,
}: {
  head: string[];
  rows: (string | number)[][];
}) => (
  <View style={styles.table}>
    <View style={[styles.row, styles.rowHead]}>
      {head.map((h, i) => (
        <Text key={i} style={[styles.cell, styles.cellHead]}>
          {h}
        </Text>
      ))}
    </View>

    {rows.map((r, i) => (
      <View key={i} style={styles.row}>
        {r.map((c, j) => (
          <Text key={j} style={styles.cell}>
            {c || "—"}
          </Text>
        ))}
      </View>
    ))}
  </View>
);

/* =====================================================
   Стили
   ===================================================== */
const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 9,
    padding: 30,
    lineHeight: 1.4,
  },
  header: {
    textAlign: "center",
    marginBottom: 10,
  },
  company: {
    fontWeight: "bold",
    fontSize: 12,
  },
  subtext: {
    fontSize: 9,
  },
  daySection: {
    marginTop: 12,
  },
  dayTitle: {
    fontWeight: "bold",
    fontSize: 10,
    marginBottom: 6,
    borderBottomWidth: 0.5,
    borderColor: "#aaa",
    paddingBottom: 2,
  },
  subsectionTitle: {
    fontWeight: "bold",
    fontSize: 9,
    marginTop: 6,
    marginBottom: 2,
  },
  table: {
    borderWidth: 0.5,
    borderColor: "#aaa",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: "#aaa",
  },
  rowHead: {
    backgroundColor: "#f8f8f8",
  },
  cell: {
    flex: 1,
    padding: 3,
    borderRightWidth: 0.5,
    borderColor: "#aaa",
  },
  cellHead: {
    fontWeight: "bold",
    fontSize: 8,
  },
  footer: {
    textAlign: "right",
    marginTop: 20,
    fontSize: 8,
    color: "#555",
  },
});
