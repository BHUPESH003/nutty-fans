'use client';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Transaction {
  id: string;
  transactionType: string;
  amount: number;
  status: string;
  description: string | null;
  createdAt: Date | string;
  creatorEarnings?: number | null;
  platformFee?: number | null;
}

interface TransactionListProps {
  transactions: Transaction[];
  loading?: boolean;
  isCreator?: boolean;
}

export function TransactionList({ transactions, loading, isCreator }: TransactionListProps) {
  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <span className="material-symbols-outlined animate-spin text-[40px] text-on-surface-variant">
          progress_activity
        </span>
      </div>
    );
  }

  if (transactions.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">No transactions found.</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
        return (
          <Badge variant="outline" className="border-yellow-600 text-yellow-600">
            Pending
          </Badge>
        );
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'refunded':
        return <Badge variant="secondary">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    return type
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  // Mobile view - card layout
  return (
    <>
      {/* Desktop table view */}
      <div className="hidden w-full max-w-full overflow-x-auto rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Date</TableHead>
              <TableHead className="whitespace-nowrap">Type</TableHead>
              <TableHead className="min-w-[200px]">Description</TableHead>
              <TableHead className="whitespace-nowrap">Amount</TableHead>
              {isCreator && <TableHead className="whitespace-nowrap">Earnings</TableHead>}
              <TableHead className="whitespace-nowrap">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="whitespace-nowrap">{formatDate(t.createdAt)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {getTypeLabel(t.transactionType)}
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={t.description || ''}>
                  {t.description || '-'}
                </TableCell>
                <TableCell
                  className={
                    t.transactionType === 'wallet_topup'
                      ? 'whitespace-nowrap text-green-600'
                      : 'whitespace-nowrap'
                  }
                >
                  {formatCurrency(t.amount)}
                </TableCell>
                {isCreator && (
                  <TableCell className="whitespace-nowrap font-medium text-green-600">
                    {t.creatorEarnings ? formatCurrency(t.creatorEarnings) : '-'}
                  </TableCell>
                )}
                <TableCell className="whitespace-nowrap">{getStatusBadge(t.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card view */}
      <div className="space-y-3 md:hidden">
        {transactions.map((t) => (
          <div key={t.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{getTypeLabel(t.transactionType)}</span>
                  {getStatusBadge(t.status)}
                </div>
                {t.description && (
                  <p className="break-words text-sm text-muted-foreground" title={t.description}>
                    {t.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1 sm:items-end">
                <span
                  className={
                    t.transactionType === 'wallet_topup'
                      ? 'break-all font-semibold text-green-600 sm:break-normal'
                      : 'break-all font-semibold sm:break-normal'
                  }
                >
                  {formatCurrency(t.amount)}
                </span>
                {isCreator && t.creatorEarnings && (
                  <span className="break-words text-xs font-medium text-green-600 sm:text-right">
                    Earned: {formatCurrency(t.creatorEarnings)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
