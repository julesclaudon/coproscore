export function generateCsv(headers: string[], rows: string[][]): string {
  const escape = (cell: string): string => {
    if (cell.includes(";") || cell.includes('"') || cell.includes("\n")) {
      return '"' + cell.replace(/"/g, '""') + '"';
    }
    return cell;
  };

  const lines = [headers.map(escape).join(";")];
  for (const row of rows) {
    lines.push(row.map(escape).join(";"));
  }

  return "\uFEFF" + lines.join("\n");
}
