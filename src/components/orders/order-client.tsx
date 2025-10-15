import React, { useState } from "react";
import { EditIcon, Link2Icon, PhoneIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderProps } from "@/types/order.types";
import { useModal } from "@/providers/modal-provider";
import { useClients } from "@/hooks/use-clients";

import { RatingStars } from "../rating-stars";

interface Props {
  data: OrderProps;
}

export const OrderClient = ({ data }: Props) => {
  const { openModal } = useModal();
  const { updateClient } = useClients(1, 1);
  const qc = useQueryClient();
  const client = data.client;

  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(client.rating || 0);

  const handleRatingChange = async (newRating: number) => {
    if (!client.documentId) return;

    try {
      setLoading(true);
      setRating(newRating);
      await updateClient({
        documentId: client.documentId,
        updatedData: { rating: newRating },
      });

      // обновим данные заказа
      qc.invalidateQueries({ queryKey: ["order", data.documentId] });

      toast.success("Рейтинг обновлён");
    } catch (err) {
      console.error("Ошибка обновления рейтинга:", err);
      toast.error("Ошибка при обновлении рейтинга");
      setRating(client.rating || 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-6 md:max-w-1/2">
      <CardHeader>
        <CardTitle>{client.name || "Имя не указано"}</CardTitle>
        <CardAction className="space-x-4">
          <Button asChild>
            <Link href={`tel:${client.phone}`}>
              <PhoneIcon />
            </Link>
          </Button>

          <Button
            variant={"secondary"}
            onClick={() =>
              openModal("addClient", {
                title: "Редактировать клиента",
                props: { orderId: data.documentId, client },
              })
            }
          >
            <EditIcon />
          </Button>

          <Button variant={"secondary"} asChild>
            <Link href={`/clients/${client.documentId}`} target="_blank">
              <Link2Icon />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <div className="flex justify-between items-center">
          <span>{client.address || "Адрес не указан"}</span>

          {loading ? (
            <Loader2Icon className="animate-spin size-5 text-muted-foreground" />
          ) : (
            <RatingStars value={rating} onChange={handleRatingChange} />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
