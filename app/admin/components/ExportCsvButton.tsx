'use client';

import { useCallback } from 'react';
import { useToast } from './ToastProvider';

type Column = {
  header: string;
  accessor: (row: Record<string, unknown>) => string | number;
};

export default function ExportCsvButton({
  data,
  columns,
  filename = 'export',
}: {
  data: Record<string, unknown>[];
  columns: Column[];
  filename?: string;
}) {
  const toast = useToast();

  const handleExport = useCallback(() => {
    if (data.length === 0) {
      toast.warning('No hi ha dades per exportar');
      return;
    }

    const headers = columns.map((c) => c.header);
    const rows = data.map((row) =>
      columns.map((col) => {
        const val = col.accessor(row);
        const str = String(val ?? '');
        // Escapar cometes i wrap si conté separadors
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
    );

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportat correctament');
  }, [data, columns, filename, toast]);

  return (
    <button
      type="button"
      onClick={handleExport}
      className="ap-btn ap-btn--secondary"
    >
      📥 Exportar CSV
    </button>
  );
}
