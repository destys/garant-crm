"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import {
  CheckIcon,
  EyeIcon,
  PhoneIncomingIcon,
  PhoneMissedIcon,
  PhoneOffIcon,
  PhoneOutgoingIcon,
  PlayIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CallProps } from "@/types/call.types";
import { formatDate } from "@/lib/utils";

type CallStatusInfo = {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ReactNode;
};

function getCallStatusInfo(call: CallProps): CallStatusInfo {
  const status = call.callStatus?.toLowerCase() || "";
  const duration = call.duration || 0;

  if (status.includes("success") || status.includes("connected") || duration > 0) {
    return {
      label: "Отвечен",
      variant: "default",
      icon: <CheckIcon className="h-3 w-3" />,
    };
  }

  if (status.includes("busy")) {
    return {
      label: "Занято",
      variant: "secondary",
      icon: <PhoneOffIcon className="h-3 w-3" />,
    };
  }

  if (call.direction === "inbound") {
    return {
      label: "Пропущен",
      variant: "destructive",
      icon: <PhoneMissedIcon className="h-3 w-3" />,
    };
  }

  return {
    label: "Не отвечен",
    variant: "secondary",
    icon: <PhoneOffIcon className="h-3 w-3" />,
  };
}

interface BuildColumnsProps {
  roleId: number | null;
  onPlay: (call: CallProps) => void;
  onMarkSeen: (call: CallProps) => void;
  onDelete: (call: CallProps) => void;
}

export const buildCallsColumns = ({
  roleId,
  onPlay,
  onMarkSeen,
  onDelete,
}: BuildColumnsProps): ColumnDef<CallProps>[] => {
  return [
    {
      accessorKey: "direction",
      header: "Тип",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {row.original.direction === "inbound" ? (
            <PhoneIncomingIcon className="h-4 w-4 text-green-500" />
          ) : (
            <PhoneOutgoingIcon className="h-4 w-4 text-blue-500" />
          )}
          <span className="hidden sm:inline">
            {row.original.direction === "inbound" ? "Вх" : "Исх"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "fromNumber",
      header: "Номер",
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm">
          {row.original.fromNumber || "—"}
        </span>
      ),
    },
    {
      accessorKey: "client",
      header: "Клиент",
      cell: ({ row }) => {
        const client = row.original.client;
        if (client?.documentId) {
          return (
            <Link
              href={`/clients/${client.documentId}`}
              className="flex items-center gap-1 text-blue-600 hover:underline text-xs sm:text-sm"
            >
              <UserIcon className="h-3 w-3 hidden sm:inline" />
              {client.name || client.phone || "Клиент"}
            </Link>
          );
        }
        return (
          <span className="text-muted-foreground text-xs">—</span>
        );
      },
    },
    {
      accessorKey: "startedAt",
      header: "Дата",
      cell: ({ row }) => (
        <span className="text-xs sm:text-sm whitespace-nowrap">
          {formatDate(
            row.original.startedAt || row.original.createdAt,
            "dd.MM HH:mm"
          )}
        </span>
      ),
    },
    {
      accessorKey: "duration",
      header: "Длит.",
      cell: ({ row }) => {
        const duration = row.original.duration || 0;
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return (
          <span className="text-xs sm:text-sm whitespace-nowrap">
            {minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, "0")}` : `${seconds}с`}
          </span>
        );
      },
    },
    {
      accessorKey: "callStatus",
      header: "Статус",
      cell: ({ row }) => {
        const statusInfo = getCallStatusInfo(row.original);
        return (
          <Badge variant={statusInfo.variant} className="text-xs gap-1 whitespace-nowrap">
            {statusInfo.icon}
            <span className="hidden sm:inline">{statusInfo.label}</span>
          </Badge>
        );
      },
    },
    {
      accessorKey: "seen",
      header: "",
      cell: ({ row }) =>
        !row.original.seen && (
          <Badge variant="destructive" className="text-xs px-1">
            Новый
          </Badge>
        ),
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }) => {
        const call = row.original;
        const hasRecording = call.recordingId || call.recording;

        return (
          <div className="flex justify-end gap-1">
            {hasRecording && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onPlay(call)}
                title="Прослушать запись"
              >
                <PlayIcon className="h-3 w-3" />
              </Button>
            )}
            {!call.seen && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onMarkSeen(call)}
                title="Отметить просмотренным"
              >
                <EyeIcon className="h-3 w-3" />
              </Button>
            )}
            {roleId === 3 && (
              <Button
                variant="destructive"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onDelete(call)}
                title="Удалить"
              >
                <Trash2Icon className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];
};
