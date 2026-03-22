"use client";

import { useState } from "react";
import {
  CheckIcon,
  Loader2Icon,
  PhoneIcon,
  PhoneIncomingIcon,
  PhoneMissedIcon,
  PhoneOffIcon,
  PhoneOutgoingIcon,
  PlayIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useClientCalls } from "@/hooks/use-calls";
import { OrderProps } from "@/types/order.types";
import { CallProps } from "@/types/call.types";
import { formatDate } from "@/lib/utils";
import { CallAudioPlayer } from "@/components/calls/call-audio-player";

interface Props {
  data: OrderProps;
}

function getCallStatusInfo(call: CallProps) {
  const status = call.callStatus?.toLowerCase() || "";
  const duration = call.duration || 0;

  if (status.includes("success") || status.includes("connected") || duration > 0) {
    return {
      label: "Отвечен",
      variant: "default" as const,
      icon: <CheckIcon className="h-3 w-3" />,
    };
  }

  if (status.includes("busy")) {
    return {
      label: "Занято",
      variant: "secondary" as const,
      icon: <PhoneOffIcon className="h-3 w-3" />,
    };
  }

  if (call.direction === "inbound") {
    return {
      label: "Пропущен",
      variant: "destructive" as const,
      icon: <PhoneMissedIcon className="h-3 w-3" />,
    };
  }

  return {
    label: "Не отвечен",
    variant: "secondary" as const,
    icon: <PhoneOffIcon className="h-3 w-3" />,
  };
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return minutes > 0
    ? `${minutes}:${secs.toString().padStart(2, "0")}`
    : `${secs}с`;
}

export const OrderCalls = ({ data }: Props) => {
  const clientPhone = data.client?.phone || data.add_phone || "";
  const [playingCall, setPlayingCall] = useState<CallProps | null>(null);

  const { calls, isLoading, updateCall } = useClientCalls(clientPhone);

  const handlePlay = (call: CallProps) => {
    setPlayingCall(call);
    if (!call.seen) {
      updateCall({ documentId: call.documentId, updatedData: { seen: true } });
    }
  };

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PhoneIcon className="h-5 w-5" />
            Звонки по клиенту
            {clientPhone && (
              <span className="text-sm font-normal text-muted-foreground">
                ({clientPhone})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!clientPhone ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
              У клиента не указан номер телефона
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : calls.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Звонков с этим клиентом пока нет
            </p>
          ) : (
            <div className="space-y-3">
              {calls.map((call) => {
                const statusInfo = getCallStatusInfo(call);
                const hasRecording = call.recordingId || call.recording;

                return (
                  <div
                    key={call.id}
                    className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {call.direction === "inbound" ? (
                          <PhoneIncomingIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <PhoneOutgoingIcon className="h-5 w-5 text-blue-500" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm">
                            {call.direction === "inbound"
                              ? call.fromNumber
                              : call.toNumber || call.fromNumber}
                          </span>
                          <Badge variant={statusInfo.variant} className="gap-1 text-xs">
                            {statusInfo.icon}
                            {statusInfo.label}
                          </Badge>
                          {!call.seen && (
                            <Badge variant="destructive" className="text-xs">
                              Новый
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                          <span>
                            {formatDate(
                              call.startedAt || call.createdAt,
                              "dd.MM.yyyy HH:mm"
                            )}
                          </span>
                          <span>Длительность: {formatDuration(call.duration || 0)}</span>
                        </div>
                      </div>
                    </div>

                    {hasRecording && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePlay(call)}
                        className="flex-shrink-0"
                      >
                        <PlayIcon className="h-4 w-4 mr-2" />
                        Запись
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {playingCall && (
        <CallAudioPlayer
          call={playingCall}
          onClose={() => setPlayingCall(null)}
        />
      )}
    </div>
  );
};
