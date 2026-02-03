import { z } from "zod";

const NEED_DEADLINE = new Set(["Согласовать", "Отремонтировать", "Готово"]);

export const orderFormSchema = z
  .object({
    orderStatus: z.string(),
    source: z.string().optional(),
    warranty: z.string().optional(),
    type_of_repair: z.string(),
    kind_of_repair: z.string(),
    visit_date: z.date().optional(),
    visit_time: z.string().optional(),
    diagnostic_date: z.date().optional(),
    date_of_issue: z.date().optional(),
    deadline: z.date().optional(),
    device_type: z.string().optional(),
    brand: z.string().optional(),
    model: z.string().optional(),
    serial_number: z.string().optional(),
    reason_for_refusal: z.string().optional(),
    defect: z.string().optional(),
    conclusion: z.string().optional(),
    equipment: z.string().optional(),
    completed_work: z.string().optional(),
    note: z.string().optional(),
    add_address: z.string(),
    legal_status: z.string().optional(),
    add_phone: z.string(),
    isNeedReceipt: z.boolean().optional(),
    refusal_comment: z.string().optional(),
    totalCostNoAccounting: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.orderStatus === "Отказ") {
      if (!data.reason_for_refusal?.trim()) {
        ctx.addIssue({
          path: ["reason_for_refusal"],
          code: z.ZodIssueCode.custom,
          message: "Укажите причину отказа",
        });
      }
      if (!data.device_type?.trim()) {
        ctx.addIssue({
          path: ["device_type"],
          code: z.ZodIssueCode.custom,
          message: "Укажите тип устройства",
        });
      }
      if (!data.refusal_comment?.trim()) {
        ctx.addIssue({
          path: ["refusal_comment"],
          code: z.ZodIssueCode.custom,
          message: "Укажите комментарий к причине отказа",
        });
      }
    }

    if (NEED_DEADLINE.has(data.orderStatus) && !data.deadline) {
      ctx.addIssue({
        path: ["deadline"],
        code: z.ZodIssueCode.custom,
        message: "Укажите дедлайн",
      });
    }
  });

export type OrderFormData = z.infer<typeof orderFormSchema>;
