import {
  IncomeOutcomeProps,
  UpdateIncomeOutcomeDto,
} from "@/types/income-outcome.types";

export interface SyncOrderIncomesParams {
  orderDocumentId: string;
  prepayValue: number;
  totalCostValue: number;
  currentIncomes: IncomeOutcomeProps[];
  currentUserId?: number;
  currentUserName?: string;
  isAdmin: boolean;
  createIncome: (data: Partial<UpdateIncomeOutcomeDto>) => void;
  updateIncome: (params: {
    documentId: string;
    updatedData: Partial<IncomeOutcomeProps>;
  }) => void;
}

/**
 * Находит income по типу (предоплата/доплата) в массиве incomes
 */
const findIncomeByType = (
  incomes: IncomeOutcomeProps[],
  type: "предоплата" | "доплата"
): IncomeOutcomeProps | undefined => {
  return incomes.find((income) => {
    const note = (income.note || "").toLowerCase();
    return note.includes(type);
  });
};

/**
 * Синхронизирует приходы заказа (предоплата и доплата).
 * - Создаёт приходы, если их нет
 * - Обновляет значения, если они изменились
 * - При изменении ЛЮБОГО значения устанавливает текущего пользователя как автора на ОБА прихода
 */
export const syncOrderIncomes = async ({
  orderDocumentId,
  prepayValue,
  totalCostValue,
  currentIncomes,
  currentUserId,
  currentUserName,
  isAdmin,
  createIncome,
  updateIncome,
}: SyncOrderIncomesParams): Promise<void> => {
  const extraValue = totalCostValue - prepayValue;

  // Находим существующие приходы
  const existingPrepay = findIncomeByType(currentIncomes, "предоплата");
  const existingExtra = findIncomeByType(currentIncomes, "доплата");

  // Определяем, изменились ли значения
  const prepayChanged =
    !existingPrepay || (existingPrepay.count ?? 0) !== prepayValue;
  const extraChanged =
    !existingExtra || (existingExtra.count ?? 0) !== extraValue;

  // Если изменилось хотя бы одно значение — обновляем user на обоих приходах
  const anyValueChanged = prepayChanged || extraChanged;

  // Базовые данные для обновления
  const getUpdateData = (
    newCount: number,
    shouldUpdateUser: boolean
  ): Partial<IncomeOutcomeProps> => {
    const data: Partial<IncomeOutcomeProps> = {
      count: newCount,
      isApproved: isAdmin,
    };

    // Если хотя бы одно значение изменилось — устанавливаем текущего пользователя на оба прихода
    if (shouldUpdateUser && currentUserId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data as any).user = currentUserId;
      data.author = currentUserName;
    }

    return data;
  };

  // === ПРЕДОПЛАТА ===
  if (existingPrepay?.documentId) {
    // Обновляем если изменилось хотя бы одно значение (чтобы обновить user на обоих)
    if (anyValueChanged) {
      await updateIncome({
        documentId: existingPrepay.documentId,
        updatedData: getUpdateData(prepayValue, true),
      });
    }
  } else {
    // Создаём новый приход
    await createIncome({
      count: prepayValue,
      income_category: "Оплата за ремонт",
      note: "Автосоздание (предоплата)",
      order: orderDocumentId,
      user: currentUserId,
      author: currentUserName,
      isApproved: isAdmin,
    });
  }

  // === ДОПЛАТА ===
  if (existingExtra?.documentId) {
    // Обновляем если изменилось хотя бы одно значение (чтобы обновить user на обоих)
    if (anyValueChanged) {
      await updateIncome({
        documentId: existingExtra.documentId,
        updatedData: getUpdateData(extraValue, true),
      });
    }
  } else {
    // Создаём новый приход
    await createIncome({
      count: extraValue,
      income_category: "Оплата за ремонт",
      note: "Автосоздание (доплата)",
      order: orderDocumentId,
      user: currentUserId,
      author: currentUserName,
      isApproved: isAdmin,
    });
  }
};
