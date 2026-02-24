'use client';

import { useCallback } from 'react';
import { useToast } from './ToastProvider';

type Column = {
  header: string;
  accessor: (row: Record<string, unknown>) => string | number;
};

function escapeCsvCell(val: string | number): string {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

type ExportCsvProps = {
  filename?: string;
} & (
  | { data: Record<string, unknown>[]; columns: Column[]; headers?: never; rows?: never }
  | { headers: string[]; rows: string[][]; data?: never; columns?: never }
);

export default function ExportCsvButton(props: ExportCsvProps) {
  const { filename = 'export' } = props;
  const toast = useToast();

  const handleExport = useCallback(() => {
    let csvHeaders: string[];
    let csvRows: string[][];

    if (props.headers && props.rows) {
      if (props.rows.length === 0) {
        toast.warning('No hi ha dades per exportar');
        return;
      }
      csvHeaders = props.headers;
      csvRows = props.rows.map((row) => row.map(escapeCsvCell));
    } else if (props.data && props.columns) {
      if (props.data.length === 0) {
        toast.warning('No hi ha dades per exportar');
        return;
      }
      csvHeaders = props.columns.map((c) => c.header);
      csvRows = props.data.map((row) =>
        props.columns!.map((col) => escapeCsvCell(col.accessor(row)))
      );
    } else {
      return;
    }

    const csv = [csvHeaders.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportat correctament');
  }, [props, filename, toast]);

  return (
    <button
      type="button"
      onClick={handleExport}
      className="ap-btn ap-btn--secondary"
    >
      Exportar CSV
    </button>
  );
}
