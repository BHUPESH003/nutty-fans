'use client';

import { Loader2 } from 'lucide-react';

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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            {isCreator && <TableHead>Earnings</TableHead>}
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TableRow key={t.id}>
              <TableCell>{formatDate(t.createdAt)}</TableCell>
              <TableCell>{getTypeLabel(t.transactionType)}</TableCell>
              <TableCell className="max-w-[200px] truncate" title={t.description || ''}>
                {t.description || '-'}
              </TableCell>
              <TableCell className={t.transactionType === 'wallet_topup' ? 'text-green-600' : ''}>
                {formatCurrency(t.amount)}
              </TableCell>
              {isCreator && (
                <TableCell className="font-medium text-green-600">
                  {t.creatorEarnings ? formatCurrency(t.creatorEarnings) : '-'}
                </TableCell>
              )}
              <TableCell>{getStatusBadge(t.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
