import React, { useState, useEffect, useMemo } from 'react';
import { ScheduledEmailItem, ScheduleStatus } from '../types';
import { Badge } from './Badge';
import { SearchInput } from './SearchInput';
import { Select } from './Select';
import { EmptyState } from './EmptyState';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ChevronLeft, ChevronRight, Mail, Calendar, User, Clock, AlertCircle } from 'lucide-react';

export interface EmailTableProps {
  type: 'scheduled' | 'sent';
  items: ScheduledEmailItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onRowClick?: (email: ScheduledEmailItem) => void;
}

export const EmailTable: React.FC<EmailTableProps> = ({ type, items, isLoading = false, onRowClick }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;

  // Reset status filter when type changes
  React.useEffect(() => {
    setStatusFilter('ALL');
    setCurrentPage(1);
    setSearch('');
  }, [type]);

  // Status options based on table type
  const statusOptions = React.useMemo(() => {
    if (type === 'scheduled') {
      return [
        { value: 'ALL', label: 'All Statuses' },
        { value: 'SCHEDULED', label: 'Scheduled' },
        { value: 'PROCESSING', label: 'Processing' },
      ];
    } else {
      return [
        { value: 'ALL', label: 'All Statuses' },
        { value: 'SENT', label: 'Sent' },
        { value: 'FAILED', label: 'Failed' },
      ];
    }
  }, [type]);

  
  const filteredItems = items.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) {
      return false;
    }
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      const matchRecipient = item.recipientEmail.toLowerCase().includes(q) || (item.recipientName && item.recipientName.toLowerCase().includes(q));
      const matchSubject = item.subject.toLowerCase().includes(q);
      const matchSender = item.senderEmail.toLowerCase().includes(q) || item.senderName.toLowerCase().includes(q);
      return matchRecipient || matchSubject || matchSender;
    }
    return true;
  });

  
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return <LoadingSkeleton variant="table" rows={5} />;
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--surface)] p-3 rounded-ten border border-[var(--border)] shadow-subtle">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setCurrentPage(1);
          }}
          placeholder="Filter by recipient, subject, or sender..."
        />

        <div className="flex items-center gap-3">
          <div className="w-44">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap hidden lg:inline">
            Showing <strong>{filteredItems.length}</strong> items
          </span>
        </div>
      </div>

      {}
      {filteredItems.length === 0 ? (
        <EmptyState
          type={search || statusFilter !== 'ALL' ? 'generic' : type}
          onActionClick={() => {
            setSearch('');
            setStatusFilter('ALL');
          }}
          actionLabel={search || statusFilter !== 'ALL' ? 'Reset Filters' : undefined}
        />
      ) : (
        <div className="w-full bg-surface border border-border rounded-ten overflow-hidden shadow-subtle animate-scale-in">
          {/* Table Toolbar */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-surface-muted border-b border-border text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="py-4 px-5 font-semibold">Recipient</th>
                  <th className="py-4 px-5 font-semibold">Subject</th>
                  <th className="py-4 px-5 font-semibold">{type === 'scheduled' ? 'Scheduled' : 'Sent'}</th>
                  <th className="py-4 px-5 font-semibold">Sender</th>
                  <th className="py-4 px-5 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedItems.map((item, idx) => (
                  <tr 
                    key={item.id} 
                    onClick={() => onRowClick?.(item)}
                    className="cursor-pointer table-row-hover transition-smooth hover:bg-surface-alt"
                    style={{ animationDelay: `${idx * 25}ms` }}
                  >
                    {/* Recipient Cell */}
                    <td className="py-4 px-5 font-medium text-text-primary">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                          {(item.recipientName || item.recipientEmail)[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-text-primary truncate">
                            {item.recipientName || item.recipientEmail}
                          </span>
                          <span className="text-xs text-text-tertiary font-mono truncate">
                            {item.recipientEmail}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Subject Cell */}
                    <td className="py-4 px-5 max-w-xs">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-text-primary truncate" title={item.subject}>
                          {item.subject || '(No subject)'}
                        </span>
                        <span className="text-xs text-text-tertiary truncate" title={item.body}>
                          {item.body || '(No preview)'}
                        </span>
                        {item.errorMessage && (
                          <span className="text-[11px] text-danger font-medium flex items-center gap-1 mt-1" title={item.errorMessage}>
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {item.errorMessage}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Timestamp Cell */}
                    <td className="py-4 px-5 text-xs whitespace-nowrap">
                      <div className="flex items-center gap-2 font-medium text-text-primary">
                        <Clock className="w-4 h-4 text-text-tertiary" />
                        {formatDateTime(type === 'scheduled' ? item.scheduledTime : item.sentTime || item.scheduledTime)}
                      </div>
                    </td>

                    {/* Sender Cell */}
                    <td className="py-4 px-5 text-xs">
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-text-primary truncate">{item.senderName}</span>
                        <span className="font-mono text-[11px] text-text-tertiary truncate">{item.senderEmail}</span>
                      </div>
                    </td>

                    {/* Status Cell */}
                    <td className="py-4 px-5 text-right">
                      <Badge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-5 py-4 border-t border-border bg-surface-muted flex items-center justify-between text-xs text-text-secondary">
            <span className="font-medium">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> 
              <span className="text-text-tertiary ml-2">({filteredItems.length} total)</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-border bg-surface hover:bg-surface-alt transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-border bg-surface hover:bg-surface-alt transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
