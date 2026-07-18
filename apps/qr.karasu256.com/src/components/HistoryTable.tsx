'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { type ColumnDef, type RowSelectionState, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  Button,
  Checkbox,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  R2Image,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@Hashibutogarasu/ui';
import { apiFetch } from '@Hashibutogarasu/utils/client';

export interface HistoryTableItem {
  id: string;
  url: string;
  createdAt: string;
}

export interface HistoryTableProps {
  items: HistoryTableItem[];
  page: number;
  totalPages: number;
}

/** Builds the page numbers to render around `page`, collapsing distant runs into a single `'ellipsis'` entry. */
function pageNumbers(page: number, totalPages: number): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = [];
  for (let n = 1; n <= totalPages; n++) {
    if (n === 1 || n === totalPages || Math.abs(n - page) <= 1) {
      pages.push(n);
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis');
    }
  }
  return pages;
}

/**
 * Lists the signed-in caller's own QR generation history: a paginated,
 * multi-selectable table (built on TanStack Table, following
 * https://ui.shadcn.com/docs/components/data-table) backed by `/history`'s
 * `p` search param, with a bulk-delete action and a per-row dialog showing
 * the full-size QR code.
 */
export function HistoryTable({ items, page, totalPages }: HistoryTableProps) {
  const t = useTranslations('history');
  const router = useRouter();
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [viewingItem, setViewingItem] = React.useState<HistoryTableItem | null>(null);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  const columns = React.useMemo<ColumnDef<HistoryTableItem>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
              onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)}
              aria-label={t('selectAll')}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox checked={row.getIsSelected()} onCheckedChange={(checked) => row.toggleSelected(!!checked)} aria-label={t('selectRow')} />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'createdAt',
        header: t('columns.createdAt'),
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
      },
    ],
    [t]
  );

  const table = useReactTable({
    data: items,
    columns,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
  });

  const selectedIds = Object.keys(rowSelection);

  function goToPage(n: number) {
    router.push(`/history?p=${n}`);
  }

  async function handleDelete() {
    const res = await apiFetch('/api/history', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds }),
    });
    if (res.ok) {
      setRowSelection({});
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button variant="destructive" size="sm" disabled={selectedIds.length === 0} onClick={() => setConfirmingDelete(true)}>
          <Trash2 className="size-4" />
          {t('delete')}
        </Button>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className={header.column.id === 'select' ? 'w-10' : undefined}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                data-state={row.getIsSelected() ? 'selected' : undefined}
                className="cursor-pointer"
                onClick={() => setViewingItem(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} onClick={cell.column.id === 'select' ? (e) => e.stopPropagation() : undefined}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                {t('empty')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={`/history?p=${page - 1}`}
                text={t('pagination.previous')}
                aria-label={t('pagination.previous')}
                aria-disabled={page <= 1}
                className={page <= 1 ? 'pointer-events-none opacity-50' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) goToPage(page - 1);
                }}
              />
            </PaginationItem>
            {pageNumbers(page, totalPages).map((n, index) =>
              n === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={n}>
                  <PaginationLink
                    href={`/history?p=${n}`}
                    isActive={n === page}
                    aria-label={t('pagination.pageLabel', { page: n, totalPages })}
                    onClick={(e) => {
                      e.preventDefault();
                      goToPage(n);
                    }}
                  >
                    {n}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                href={`/history?p=${page + 1}`}
                text={t('pagination.next')}
                aria-label={t('pagination.next')}
                aria-disabled={page >= totalPages}
                className={page >= totalPages ? 'pointer-events-none opacity-50' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  if (page < totalPages) goToPage(page + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <Dialog open={viewingItem !== null} onOpenChange={(open) => !open && setViewingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('viewDialog.title')}</DialogTitle>
          </DialogHeader>
          {viewingItem && <R2Image src={viewingItem.url} alt={t('viewDialog.title')} className="mx-auto size-64" />}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={t('deleteConfirm.title')}
        description={t('deleteConfirm.description', { count: selectedIds.length })}
        confirmLabel={t('deleteConfirm.confirm')}
        cancelLabel={t('deleteConfirm.cancel')}
        onConfirm={handleDelete}
      />
    </div>
  );
}
