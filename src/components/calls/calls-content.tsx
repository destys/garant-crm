"use client";

import { useMemo, useState } from "react";
import { Loader2Icon, PhoneIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useCalls } from "@/hooks/use-calls";
import { useAuth } from "@/providers/auth-provider";
import { CallProps } from "@/types/call.types";

import { buildCallsColumns } from "./calls-columns";
import { CallAudioPlayer } from "./call-audio-player";

const PAGE_SIZE = 25;

export const CallsContent = () => {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "unseen" | "unknown">("all");
  const [playingCall, setPlayingCall] = useState<CallProps | null>(null);
  const { roleId } = useAuth();

  const filters = useMemo(() => {
    if (filter === "unseen") {
      return { seen: { $eq: false } };
    }
    if (filter === "unknown") {
      return { isKnownClient: { $eq: false } };
    }
    return undefined;
  }, [filter]);

  const {
    calls,
    total,
    meta,
    isLoading,
    isError,
    error,
    updateCall,
    deleteCall,
  } = useCalls(page, PAGE_SIZE, filters);

  const handlePlay = (call: CallProps) => {
    setPlayingCall(call);
    if (!call.seen) {
      updateCall({ documentId: call.documentId, updatedData: { seen: true } });
    }
  };

  const handleMarkSeen = async (call: CallProps) => {
    const confirmMark = confirm("Отметить звонок как просмотренный?");
    if (!confirmMark) return;
    await updateCall({
      documentId: call.documentId,
      updatedData: { seen: true },
    });
  };

  const handleDelete = async (call: CallProps) => {
    const confirmDelete = confirm("Удалить этот звонок?");
    if (!confirmDelete) return;
    await deleteCall(call.documentId);
  };

  const columns = useMemo(
    () =>
      buildCallsColumns({
        roleId,
        onPlay: handlePlay,
        onMarkSeen: handleMarkSeen,
        onDelete: handleDelete,
      }),
    [roleId],
  );

  const unseenCount = calls.filter((c) => !c.seen).length;
  const pageCount = meta?.pagination?.pageCount ?? 1;

  const renderPagination = () => {
    const pages: (number | string)[] = [];
    if (pageCount <= 6) {
      pages.push(...Array.from({ length: pageCount }, (_, i) => i + 1));
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, "...", pageCount);
      } else if (page >= pageCount - 2) {
        pages.push(
          1,
          "...",
          pageCount - 3,
          pageCount - 2,
          pageCount - 1,
          pageCount,
        );
      } else {
        pages.push(1, "...", page - 1, page, page + 1, "...", pageCount);
      }
    }
    return pages.map((p, i) => (
      <PaginationItem key={i}>
        {p === "..." ? (
          <span className="px-2">...</span>
        ) : (
          <PaginationLink
            href="#"
            isActive={p === page}
            className="px-2 py-1 text-sm"
            onClick={(e) => {
              e.preventDefault();
              if (!isLoading && p !== page) setPage(p as number);
            }}
          >
            {p}
          </PaginationLink>
        )}
      </PaginationItem>
    ));
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PhoneIcon className="h-5 w-5" />
            Звонки
            {unseenCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unseenCount} новых
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4 flex-wrap">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilter("all");
                setPage(1);
              }}
            >
              Все
            </Button>
            <Button
              variant={filter === "unseen" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilter("unseen");
                setPage(1);
              }}
            >
              Непросмотренные
            </Button>
            <Button
              variant={filter === "unknown" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilter("unknown");
                setPage(1);
              }}
            >
              Неизвестные номера
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-red-500 mb-2">Ошибка загрузки звонков</p>
              <p className="text-sm text-muted-foreground">
                {error?.message || "Попробуйте обновить страницу"}
              </p>
            </div>
          ) : calls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <PhoneIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Звонков пока нет</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="min-w-[500px] px-4 sm:px-0">
                  <DataTable
                    columns={columns}
                    data={calls}
                    isLoading={isLoading}
                  />
                </div>
              </div>

              {pageCount > 1 && (
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    Показано {(page - 1) * PAGE_SIZE + 1} -{" "}
                    {Math.min(page * PAGE_SIZE, total)} из {total}
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (page > 1) setPage(page - 1);
                          }}
                          className={
                            page <= 1 ? "pointer-events-none opacity-50" : ""
                          }
                        />
                      </PaginationItem>
                      {renderPagination()}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (page < pageCount) setPage(page + 1);
                          }}
                          className={
                            page >= pageCount
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
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
