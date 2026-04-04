type CsvCell = string | number | null | undefined;

const escapeCell = (val: CsvCell): string => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const buildCsv = (rows: CsvCell[][]): string =>
  rows.map((row) => row.map(escapeCell).join(',')).join('\n');

export const downloadCsv = (filename: string, rows: CsvCell[][]): void => {
  const csv = buildCsv(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
