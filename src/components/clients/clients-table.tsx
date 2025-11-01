"use client";

import * as React from "react";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";

import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { ClientProps } from "@/types/client.types";

import { clientsColumns } from "./client-columns";

export function ClientsTable({
  data,
  deleteClient,
}: {
  data: ClientProps[];
  deleteClient: (documentId: string) => void;
}) {
  const table = useReactTable({
    data,
    columns: clientsColumns(deleteClient),
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-lg border">
      {/* Desktop Table */}
      <div className="hidden md:table w-full">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        cell.column.id === "actions" ? "text-right" : ""
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="text-center py-6 text-muted-foreground"
                >
                  Нет данных
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Mobile Cards */}
      <div className="block md:hidden w-full">
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => (
            <div
              key={row.id}
              className="border rounded-lg p-3 mb-4 bg-white shadow-sm"
            >
              {row.getVisibleCells().map((cell) => {
                const columnHeader = cell.column.columnDef.header;
                const headerContext = table
                  .getHeaderGroups()[0]
                  .headers.find((h) => h.column.id === cell.column.id)
                  ?.getContext();
                const headerContent = headerContext
                  ? flexRender(columnHeader, headerContext)
                  : null;
                const cellValue = flexRender(
                  cell.column.columnDef.cell,
                  cell.getContext()
                );
                return (
                  <div className="p-2 border-b last:border-b-0" key={cell.id}>
                    {headerContent && headerContent !== "" ? (
                      <>
                        <strong>{headerContent}</strong>
                        {cellValue && <span> {cellValue}</span>}
                      </>
                    ) : (
                      cellValue
                    )}
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            Нет данных
          </div>
        )}
      </div>
    </div>
  );
}
