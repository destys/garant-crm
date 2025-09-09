"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { LayoutGrid, Table as TableIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTableViewStore } from "@/stores/table-view-store";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  cardComponent?: React.ComponentType<{ data: TData }>;
}

export function OrdersTable<TData, TValue>({
  columns,
  data,
  cardComponent: CardComponent,
}: DataTableProps<TData, TValue>) {
  const viewKey = CardComponent?.name ?? "default";
  const { views, setView } = useTableViewStore();
  const currentView = views[viewKey] ?? "table";

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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
  });

  // Переключение на cardView при <1280px
  React.useEffect(() => {
    const handleResize = () => {
      const isSmall = window.innerWidth < 1280;
      if (isSmall && CardComponent && currentView !== "card") {
        setView(viewKey, "card");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [viewKey, currentView, setView]);

  React.useEffect(() => {
    if (!CardComponent && currentView !== "table") {
      setView(viewKey, "table");
    }
  }, [CardComponent, currentView, setView, viewKey]);

  const isTableView = currentView === "table";

  return (
    <div className="w-full">
      <div className="flex justify-end py-4 gap-2">
        {CardComponent && (
          <div className="hidden xl:flex gap-1">
            <Button
              size="icon"
              variant={isTableView ? "outline" : "secondary"}
              onClick={() => setView(viewKey, "card")}
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              size="icon"
              variant={isTableView ? "secondary" : "outline"}
              onClick={() => setView(viewKey, "table")}
            >
              <TableIcon className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {isTableView ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-center">
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
                    Нет данных.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : CardComponent ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {table.getRowModel().rows.length ? (
            table
              .getRowModel()
              .rows.map((row) => (
                <CardComponent key={row.id} data={row.original} />
              ))
          ) : (
            <div className="col-span-full text-center text-muted-foreground py-8">
              Нет данных.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
