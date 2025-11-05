"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  cardComponent?: React.ComponentType<{ data: TData }>;
  isLoading?: boolean;
}

export function AccountingTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 15, // 🔹 здесь задаёшь нужное количество строк
      },
    },
  });

  const renderPagination = React.useCallback(() => {
    const pageCount = table.getPageCount();
    const current = table.getState().pagination.pageIndex + 1;
    const pages: (number | string)[] = [];
    if (pageCount <= 6) {
      pages.push(...Array.from({ length: pageCount }, (_, i) => i + 1));
    } else {
      if (current <= 3) {
        pages.push(1, 2, 3, 4, "...", pageCount);
      } else if (current >= pageCount - 2) {
        pages.push(
          1,
          "...",
          pageCount - 3,
          pageCount - 2,
          pageCount - 1,
          pageCount
        );
      } else {
        pages.push(
          1,
          "...",
          current - 1,
          current,
          current + 1,
          "...",
          pageCount
        );
      }
    }
    return pages.map((p, i) => (
      <PaginationItem key={i}>
        {p === "..." ? (
          <span className="px-2">...</span>
        ) : (
          <PaginationLink
            href="#"
            isActive={p === current}
            className="px-2 py-1 text-sm"
            onClick={(e) => {
              e.preventDefault();
              table.setPageIndex((p as number) - 1);
            }}
          >
            {p}
          </PaginationLink>
        )}
      </PaginationItem>
    ));
  }, [table]);

  return (
    <div className="w-full">
      <div className="hidden items-center py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table className="hidden md:table">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {/* Mobile cards view */}
        <div className="block md:hidden">
          {table.getRowModel().rows?.length ? (
            <div className="flex flex-col space-y-4">
              {table.getRowModel().rows.map((row) => (
                <div
                  key={row.id}
                  className="border rounded-md p-4 space-y-2 bg-white shadow"
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => {
                    const header = table
                      .getHeaderGroups()
                      .flatMap((hg) => hg.headers)
                      .find((h) => h.id === cell.column.id);
                    const headerName = header
                      ? typeof header.column.columnDef.header === "function"
                        ? header.column.columnDef.header(header.getContext())
                        : header.column.columnDef.header
                      : cell.column.id;
                    return (
                      <div
                        key={cell.id}
                        className="p-2 border-b last:border-b-0"
                      >
                        {headerName && headerName !== "" ? (
                          <>
                            <strong className="inline-block w-28">
                              {headerName}
                            </strong>
                            <span>
                              {" "}
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </span>
                          </>
                        ) : (
                          flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center h-24 flex items-center justify-center">
              No results.
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-4 mt-10">
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          {table.getFilteredRowModel().rows.length
            ? `${
                table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                1
              }–${Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )} из ${table.getFilteredRowModel().rows.length}`
            : "Нет данных"}
        </div>

        <div className="max-md:flex gap-3">
          <div className="block md:hidden w-full">
            <Select
              value={String(table.getState().pagination.pageIndex + 1)}
              onValueChange={(val) => {
                const num = Number(val);
                if (!isNaN(num)) table.setPageIndex(num - 1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите страницу" />
              </SelectTrigger>
              <SelectContent>
                {Array.from(
                  { length: table.getPageCount() },
                  (_, i) => i + 1
                ).map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    Стр. {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Pagination>
            <PaginationContent className="gap-2 overflow-x-auto">
              {renderPagination()}
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
