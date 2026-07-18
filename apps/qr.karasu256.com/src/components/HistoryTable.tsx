'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
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
 * multi-selectable table backed by `/history`'s `p` search param, with a
 * bulk-delete action and a per-row dialog showing the full-size QR code.
 */
export function HistoryTable({ items, page, totalPages }: HistoryTableProps) {
  const t = useTranslations('history');
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [viewingItem, setViewingItem] = React.useState<HistoryTableItem | null>(null);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  const allSelected = items.length > 0 && items.every((item) => selected.has(item.id));

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((item) => item.id)));
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function goToPage(n: number) {
    router.push(`/history?p=${n}`);
  }

  async function handleDelete() {
    const res = await apiFetch('/api/history', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    if (res.ok) {
      setSelected(new Set());
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button variant="destructive" size="sm" disabled={selected.size === 0} onClick={() => setConfirmingDelete(true)}>
          <Trash2 className="size-4" />
          {t('delete')}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} aria-label={t('selectAll')} />
            </TableHead>
            <TableHead>{t('columns.preview')}</TableHead>
            <TableHead>{t('columns.createdAt')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} data-state={selected.has(item.id) ? 'selected' : undefined}>
              <TableCell>
                <Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} aria-label={t('selectRow')} />
              </TableCell>
              <TableCell className="cursor-pointer" onClick={() => setViewingItem(item)}>
                <R2Image src={item.url} alt={t('columns.preview')} className="size-10" />
              </TableCell>
              <TableCell className="cursor-pointer" onClick={() => setViewingItem(item)}>
                {new Date(item.createdAt).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {items.length === 0 && <p className="text-center text-sm text-muted-foreground">{t('empty')}</p>}

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
          {viewingItem && <R2Image src={viewingItem.url} alt={t('columns.preview')} className="mx-auto size-64" />}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={t('deleteConfirm.title')}
        description={t('deleteConfirm.description', { count: selected.size })}
        confirmLabel={t('deleteConfirm.confirm')}
        cancelLabel={t('deleteConfirm.cancel')}
        onConfirm={handleDelete}
      />
    </div>
  );
}
