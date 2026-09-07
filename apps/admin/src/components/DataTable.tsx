import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyField: keyof T;
  emptyMessage?: string;
  /** Invoked when a row is clicked. Also enables a pointer cursor. */
  onRowClick?: (row: T) => void;
  /** Renders a leading checkbox column for multi-select. */
  selectable?: boolean;
  /** Currently selected row ids (stringified values of keyField). */
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
}

export default function DataTable<T>({
  columns,
  rows,
  keyField,
  emptyMessage = 'No records found.',
  onRowClick,
  selectable = false,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
}: DataTableProps<T>) {
  const selectedSet = new Set(selectedIds);
  const rowId = (row: T) => String(row[keyField]);
  const allSelected = rows.length > 0 && rows.every((r) => selectedSet.has(rowId(r)));
  const someSelected = rows.some((r) => selectedSet.has(rowId(r)));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {selectable && (
              <th scope="col" className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all rows"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = !allSelected && someSelected;
                  }}
                  onChange={() => onToggleSelectAll?.()}
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 text-brand focus:ring-brand"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-5 py-10 text-center text-sm text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const id = rowId(row);
              const isSelected = selectedSet.has(id);
              return (
                <tr
                  key={id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'transition-colors',
                    isSelected
                      ? 'bg-rose-50/70 hover:bg-rose-50'
                      : 'odd:bg-white even:bg-gray-50/60 hover:bg-brand/5',
                    onRowClick && 'cursor-pointer',
                  )}
                >
                  {selectable && (
                    <td
                      className="w-10 px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        aria-label="Select row"
                        checked={isSelected}
                        onChange={() => onToggleSelect?.(id)}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-brand focus:ring-brand"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-5 py-3 text-gray-700', col.className)}>
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
