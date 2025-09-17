/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CheckIcon,
  HammerIcon,
  Loader2Icon,
  PhoneIcon,
  TrashIcon,
} from "lucide-react";
import type { Row } from "@tanstack/react-table";
import Link from "next/link";
import { toast } from "sonner";
import { MouseEvent, useState } from "react";

import { OrderProps } from "@/types/order.types";

import { Button } from "../ui/button";

// отдельный компонент для ячейки с экшенами
export const ActionsCell = ({
  row,
  roleId,
  updateOrder,
  deleteOrder,
  refetch,
}: {
  row: Row<OrderProps>;
  roleId?: number;
  updateOrder: (data: {
    documentId: string;
    updatedData: any;
  }) => Promise<any> | void;
  deleteOrder: (documentId: string) => Promise<any> | void;
  refetch?: () => void;
}) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isRevising, setIsRevising] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDecide =
    (row.original.orderStatus === "Отказ" ||
      row.original.orderStatus === "Выдан") &&
    roleId === 3;

  const handleApprove = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setIsApproving(true);
      await Promise.resolve(
        updateOrder({
          documentId: row.original.documentId,
          updatedData: { is_revision: false, is_approve: true },
        })
      );
      toast.success("Заказ утверждён");
      refetch?.();
    } catch {
      toast.error("Не удалось утвердить заказ");
    } finally {
      setIsApproving(false);
    }
  };

  const handleRevise = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setIsRevising(true);
      await Promise.resolve(
        updateOrder({
          documentId: row.original.documentId,
          updatedData: { is_revision: true, is_approve: false },
        })
      );
      toast.success("Отправлено на доработку");
      refetch?.();
    } catch {
      toast.error("Не удалось отправить на доработку");
    } finally {
      setIsRevising(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setIsDeleting(true);
      await Promise.resolve(deleteOrder(row.original.documentId));
      refetch?.();
      toast.success("Заказ удалён");
    } catch {
      toast.error("Не удалось удалить заказ");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-2 justify-end">
      {canDecide && (
        <>
          <Button
            type="button"
            size="icon"
            variant="positive"
            title="Подтвердить"
            onClick={handleApprove}
            disabled={isApproving || isRevising || isDeleting}
            aria-busy={isApproving}
          >
            {isApproving ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <CheckIcon className="size-4" />
            )}
          </Button>

          <Button
            type="button"
            size="icon"
            variant="destructive"
            title="Доработать"
            onClick={handleRevise}
            disabled={isApproving || isRevising || isDeleting}
            aria-busy={isRevising}
          >
            {isRevising ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <HammerIcon className="size-4" />
            )}
          </Button>
        </>
      )}

      <Button
        type="button"
        size="icon"
        variant="outline"
        title="Позвонить"
        asChild
      >
        <Link href={`tel:${row.original.client?.phone}`}>
          <PhoneIcon className="size-4" />
        </Link>
      </Button>

      {roleId === 3 && (
        <Button
          type="button"
          size="icon"
          variant="destructive"
          title="Удалить"
          onClick={handleDelete}
          disabled={isApproving || isRevising || isDeleting}
          aria-busy={isDeleting}
        >
          {isDeleting ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <TrashIcon className="size-4" />
          )}
        </Button>
      )}
    </div>
  );
};
