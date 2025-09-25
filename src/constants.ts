import {
  AlertCircle,
  Archive,
  Calculator,
  Check,
  ClipboardList,
  Clock2Icon,
  DollarSign,
  FileText,
  ListChecks,
  Mail,
  ReceiptIcon,
  Scale,
  Send,
  Settings2,
  ShoppingCart,
  Truck,
  Undo2Icon,
  Wrench,
} from "lucide-react";

export const API_URL = "https://admin.spbgarant.ru";

export const SIDEBAR_MENU = [
  {
    to: "/orders?filter=all",
    title: "Все заявки",
    icon: FileText,
    filters: {
      $and: [{ orderStatus: { $ne: "Выдан" } }],
    },
  },
  {
    to: "/orders",
    title: "Новые заявки",
    icon: ClipboardList,
    filters: { orderStatus: { $eq: "Новая" } },
  },
  {
    to: "/orders",
    title: "Согласовать",
    icon: ListChecks,
    filters: { orderStatus: { $eq: "Согласовать" } },
  },
  {
    to: "/orders",
    title: "Отремонтировать",
    icon: Wrench,
    filters: { orderStatus: { $eq: "Отремонтировать" } },
  },
  {
    to: "/orders",
    title: "Купить запчасти",
    icon: ShoppingCart,
    filters: { orderStatus: { $eq: "Купить запчасти" } },
  },
  {
    to: "/orders",
    title: "Готово",
    icon: Check,
    filters: { orderStatus: { $eq: "Готово" } },
  },
  {
    to: "/orders",
    title: "Отправить курьера",
    icon: Truck,
    adminOnly: true,
    filters: { orderStatus: { $eq: "Отправить курьера" } },
  },
  {
    to: "/orders",
    title: "Отправить инженера",
    icon: Send,
    filters: { orderStatus: { $eq: "Отправить инженера" } },
  },
  {
    to: "/orders",
    title: "Отправить КП",
    icon: Mail,
    filters: { orderStatus: { $eq: "Отправить КП" } },
  },
  {
    to: "/orders",
    title: "Привезет сам",
    icon: Send,
    filters: { orderStatus: { $eq: "Привезет сам" } },
  },
  {
    to: "/orders",
    title: "Продать",
    icon: DollarSign,
    filters: { orderStatus: { $eq: "Продать" } },
  },
  {
    to: "/orders",
    title: "Юридический отдел",
    icon: Scale,
    filters: { orderStatus: { $eq: "Юридический отдел" } },
  },
  {
    to: "/orders",
    title: "Проблемные",
    icon: AlertCircle,
    filters: { orderStatus: { $eq: "Проблемные" } },
  },
  {
    to: "/orders",
    title: "UMedia",
    icon: Undo2Icon,
    filters: {
      kind_of_repair: { $eq: "UMedia" },
    },
  },
  {
    to: "/orders",
    title: "Пробить чек",
    icon: ReceiptIcon,
    filters: { isNeedReceipt: { $eq: true } },
  },
  { separator: true },
  {
    to: "/orders",
    title: "Дедлайны",
    icon: Clock2Icon,
    managerOnly: true,
    filters: {
      orderStatus: {
        $in: [
          "Новая",
          "Согласовать",
          "Отремонтировать",
          "Купить запчасти",
          "Готово",
          "Отправить курьера",
          "Отправить инженера",
        ],
      },
    },
  },
  {
    to: "/orders",
    title: "Доработка",
    icon: Settings2,
    hideForAdmin: true,
    filters: {
      $and: [
        {
          $or: [
            { orderStatus: { $eq: "Отказ" } },
            { orderStatus: { $eq: "Выдан" } },
          ],
        },
        { is_revision: { $eq: true } },
      ],
    },
  },
  { separator: true },
  {
    to: "/orders",
    title: "Проверить",
    icon: Calculator,
    adminOnly: true,
    filters: {
      $and: [
        {
          $or: [
            { orderStatus: { $eq: "Отказ" } },
            { orderStatus: { $eq: "Выдан" } },
          ],
        },
        {
          $or: [
            { is_revision: { $eq: false } },
            { is_revision: { $null: true } },
          ],
        },
        {
          $or: [
            { is_approve: { $eq: false } },
            { is_approve: { $null: true } },
          ],
        },
      ],
    },
  },
  {
    to: "/orders",
    title: "Архив",
    icon: Archive,
    adminOnly: true,
    filters: {
      $and: [
        {
          $or: [
            { orderStatus: { $eq: "Отказ" } },
            { orderStatus: { $eq: "Выдан" } },
          ],
        },
        { is_approve: { $eq: true } },
      ],
    },
  },
];

export const ORDER_STATUSES = [
  "Новая",
  "Согласовать",
  "Отремонтировать",
  "Купить запчасти",
  "Отправить курьера",
  "Отправить инженера",
  "Привезет сам",
  "Продать",
  "Проблемные",
  "Отправить КП",
  "Юридический отдел",
  "Проверить",
  "Выдан",
  "Отказ",
  "Принят",
  "Готово",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_SOURCES = [
  "Самообращение",
  "Директ",
  "Авито",
  "ПрофиРУ",
] as const;

export type OrderSource = (typeof ORDER_STATUSES)[number];

export const REPAIR_KIND = ["Выездной", "Стационарный", "UMedia"] as const;

export type RepairKind = (typeof REPAIR_KIND)[number];

export const REPAIR_TYPE = [
  "Платный",
  "Гарантийный",
  "Гарантия СЦ",
  "На продажу",
] as const;

export type RepairType = (typeof REPAIR_TYPE)[number];

export const TRANSACTION_STATUSES = ["Приход", "Расход", "Корректировка"];
