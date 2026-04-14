"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

import type { OrderProps } from "@/types/order.types";

Font.register({
  family: "Roboto",
  fonts: [
    { src: "/fonts/Roboto-Regular.ttf", fontWeight: "normal" },
    { src: "/fonts/Roboto-Bold.ttf", fontWeight: "bold" },
  ],
});

interface OrdersReportProps {
  title?: string;
  orders: OrderProps[];
  period?: { from?: Date; to?: Date };
}

/** Цвета бейджа статуса для PDF (фон, рамка, текст) */
function getStatusBadgeColors(status?: string | null): {
  bg: string;
  border: string;
  text: string;
} {
  const s = (status ?? "").trim();
  if (!s) {
    return { bg: "#f3f4f6", border: "#d1d5db", text: "#6b7280" };
  }
  const map: Record<string, { bg: string; border: string; text: string }> = {
    Новая: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" },
    Согласовать: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
    Отремонтировать: { bg: "#ffedd5", border: "#ea580c", text: "#9a3412" },
    "Купить запчасти": { bg: "#fce7f3", border: "#db2777", text: "#9d174d" },
    "Отправить курьера": { bg: "#e0e7ff", border: "#6366f1", text: "#3730a3" },
    "Отправить инженера": { bg: "#e0e7ff", border: "#6366f1", text: "#3730a3" },
    "Привезет сам": { bg: "#cffafe", border: "#06b6d4", text: "#155e75" },
    Продать: { bg: "#ede9fe", border: "#7c3aed", text: "#5b21b6" },
    Проблемные: { bg: "#fee2e2", border: "#dc2626", text: "#991b1b" },
    "Отправить КП": { bg: "#f3e8ff", border: "#9333ea", text: "#6b21a8" },
    "Юридический отдел": { bg: "#f1f5f9", border: "#64748b", text: "#334155" },
    Проверить: { bg: "#fef9c3", border: "#ca8a04", text: "#854d0e" },
    Выдан: { bg: "#d1fae5", border: "#059669", text: "#065f46" },
    Отказ: { bg: "#fecaca", border: "#b91c1c", text: "#7f1d1d" },
    Принят: { bg: "#dcfce7", border: "#16a34a", text: "#166534" },
    Готово: { bg: "#bbf7d0", border: "#22c55e", text: "#14532d" },
  };
  return map[s] ?? { bg: "#e5e7eb", border: "#6b7280", text: "#1f2937" };
}

/* ---------- PDF ---------- */
export const GenerateOrdersReport = ({
  title = "Отчёт по заявкам",
  orders,
  period,
}: OrdersReportProps) => {
  const today = format(new Date(), "dd.MM.yyyy", { locale: ru });

  const sortedOrders = [...orders].sort((a, b) => {
    const aDate = a.visit_date ? new Date(a.visit_date) : null;
    const bDate = b.visit_date ? new Date(b.visit_date) : null;
    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;
    return aDate.getTime() - bDate.getTime();
  });

  const perPage = 6;
  const pages: OrderProps[][] = [];
  for (let i = 0; i < sortedOrders.length; i += perPage) {
    pages.push(sortedOrders.slice(i, i + perPage));
  }

  return (
    <Document>
      {pages.map((pageOrders, pageIndex) => {
        const rows: OrderProps[][] = [];
        for (let i = 0; i < pageOrders.length; i += 2) {
          rows.push(pageOrders.slice(i, i + 2));
        }

        return (
          <Page key={pageIndex} size="A4" style={styles.page}>
            <View style={styles.headerBlock}>
              <Text style={styles.headerTitle}>{title}</Text>
              {period?.from && period?.to && (
                <Text style={styles.headerSub}>
                  {format(period.from, "dd.MM.yyyy", { locale: ru })} —{" "}
                  {format(period.to, "dd.MM.yyyy", { locale: ru })}
                </Text>
              )}
              <Text style={styles.headerDate}>
                Дата формирования: {today} · Стр. {pageIndex + 1} из{" "}
                {Math.max(1, pages.length)}
              </Text>
            </View>

            {rows.map((pair, rowIdx) => (
              <View key={rowIdx} style={styles.gridRow}>
                {pair.map((order, colIdx) => {
                  const globalIndex =
                    pageIndex * perPage + rowIdx * 2 + colIdx + 1;
                  return (
                    <View
                      key={order.documentId ?? order.id ?? `${rowIdx}-${colIdx}`}
                      style={styles.gridCell}
                    >
                      <OrderTable order={order} index={globalIndex} />
                    </View>
                  );
                })}
                {pair.length === 1 ? <View style={styles.gridCell} /> : null}
              </View>
            ))}
          </Page>
        );
      })}
    </Document>
  );
};

/* ---------- ОДИН ЗАКАЗ ---------- */
const OrderTable = ({ order, index }: { order: OrderProps; index: number }) => {
  const status = order.orderStatus?.trim();
  const badge = getStatusBadgeColors(status);

  return (
  <View style={styles.orderBox}>
    <View style={styles.orderHeaderRow}>
      <Text style={styles.orderNumber}>Заявка № {index}</Text>
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: badge.bg, borderColor: badge.border },
        ]}
      >
        <Text style={[styles.statusBadgeText, { color: badge.text }]}>
          {status || "—"}
        </Text>
      </View>
    </View>
    <View style={styles.innerTable}>
      <Field label="Номер заявки:" value={order.title} />
      <Field label="Дата выезда:" value={safeDate(order.visit_date)} />
      <Field label="ФИО сотрудника:" value={order.master?.name} />
      <Field
        label="Номер клиента:"
        value={order.client?.phone || order.add_phone}
      />
      <Field
        label="Адрес выезда:"
        value={order.add_address || order.client?.address}
      />
      <Field label="Тип техники:" value={order.device_type} />
      <Field
        label="Производитель и модель:"
        value={[order.brand, order.model].filter(Boolean).join(" ")}
      />
      <Field label="Неисправность:" value={order.defect} />
      <Field label="Комментарий:" value={order.note} />
    </View>
  </View>
  );
};

/* ---------- ОДНО ПОЛЕ ---------- */
const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <View style={styles.fieldRow} wrap={false}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.fieldValueWrap}>
      <Text style={styles.fieldValue}>{value || "—"}</Text>
    </View>
  </View>
);

/* ---------- HELPERS ---------- */
function safeDate(v?: string) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "dd.MM.yyyy HH:mm", { locale: ru });
}

/* ---------- СТИЛИ ---------- */
const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 8,
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 32,
  },

  headerBlock: {
    borderBottomWidth: 1,
    borderBottomColor: "#0F3460",
    paddingBottom: 10,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 13,
    textAlign: "center",
    fontWeight: "bold",
    color: "#0F3460",
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 9,
    textAlign: "center",
    color: "#333",
    marginBottom: 4,
  },
  headerDate: {
    textAlign: "center",
    fontSize: 8,
    color: "#555",
  },

  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 8,
  },
  gridCell: {
    width: "48%",
  },

  orderBox: {
    borderWidth: 1,
    borderColor: "#c5ced6",
    borderRadius: 3,
    padding: 7,
    backgroundColor: "#fafbfc",
  },
  orderHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 5,
  },
  orderNumber: {
    fontWeight: "bold",
    color: "#0F3460",
    fontSize: 8,
    marginRight: 6,
  },
  statusBadge: {
    borderWidth: 0.75,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  statusBadgeText: {
    fontSize: 7,
    fontWeight: "bold",
  },
  innerTable: {
    borderTopWidth: 0.5,
    borderTopColor: "#c5ced6",
    paddingTop: 4,
  },

  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 3,
  },
  fieldLabel: {
    color: "#0F3460",
    fontWeight: "bold",
    width: "34%",
    fontSize: 7,
    paddingTop: 1,
    paddingRight: 4,
  },
  fieldValueWrap: {
    width: "66%",
  },
  fieldValue: {
    fontSize: 8,
    lineHeight: 1.35,
    color: "#222",
  },
});
