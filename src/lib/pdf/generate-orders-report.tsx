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

/* ---------- PDF ---------- */
export const GenerateOrdersReport = ({
  title = "Отчёт по заявкам",
  orders,
  period,
}: OrdersReportProps) => {
  const today = format(new Date(), "dd.MM.yyyy", { locale: ru });

  // ⬇️ сортировка по дате выезда
  const sortedOrders = [...orders].sort((a, b) => {
    const aDate = a.visit_date ? new Date(a.visit_date) : null;
    const bDate = b.visit_date ? new Date(b.visit_date) : null;
    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;
    return aDate.getTime() - bDate.getTime();
  });

  // ⬇️ делим на страницы по 6 заказов
  const perPage = 6;
  const pages: OrderProps[][] = [];
  for (let i = 0; i < sortedOrders.length; i += perPage) {
    pages.push(sortedOrders.slice(i, i + perPage));
  }

  return (
    <Document>
      {pages.map((pageOrders, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          {/* ---------- HEADER ---------- */}
          <Text style={styles.headerTitle}>{title}</Text>
          {period?.from && period?.to && (
            <Text style={styles.headerSub}>
              {format(period.from, "dd.MM.yyyy", { locale: ru })} —{" "}
              {format(period.to, "dd.MM.yyyy", { locale: ru })}
            </Text>
          )}
          <Text style={styles.headerDate}>
            Дата формирования: {today} | Стр. {pageIndex + 1}
          </Text>

          {/* ---------- 2 КОЛОНКИ ---------- */}
          <View style={styles.twoCols}>
            {pageOrders.map((order, index) => (
              <View key={order.id || index} style={styles.colItem}>
                <OrderTable
                  order={order}
                  index={pageIndex * perPage + index + 1}
                />
              </View>
            ))}
          </View>
        </Page>
      ))}
    </Document>
  );
};

/* ---------- ОДИН ЗАКАЗ ---------- */
const OrderTable = ({ order, index }: { order: OrderProps; index: number }) => (
  <View style={styles.orderBox}>
    <Text style={styles.orderNumber}>№ {index}</Text>
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

/* ---------- ОДНО ПОЛЕ ---------- */
const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <View style={styles.fieldRow}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value || "—"}</Text>
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
  page: { fontFamily: "Roboto", fontSize: 9, padding: 28, lineHeight: 1.3 },

  headerTitle: { fontSize: 14, textAlign: "center", fontWeight: "bold" },
  headerSub: { fontSize: 10, textAlign: "center", marginBottom: 4 },
  headerDate: { textAlign: "right", fontSize: 9, marginBottom: 10 },

  twoCols: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 2,
  },
  colItem: { width: "49%", marginBottom: 2 },

  orderBox: {
    borderWidth: 0.5,
    borderColor: "#999",
    borderRadius: 2,
    padding: 6,
  },
  orderNumber: {
    fontWeight: "bold",
    color: "#0F3460",
    fontSize: 9,
    marginBottom: 3,
  },
  innerTable: { borderTopWidth: 0.5, borderColor: "#ccc", paddingTop: 2 },

  fieldRow: { flexDirection: "row", marginBottom: 2 },
  fieldLabel: { color: "#0F3460", fontWeight: "bold", width: "45%" },
  fieldValue: { width: "55%", textAlign: "left" },
});
