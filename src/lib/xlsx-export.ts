import ExcelJS from "exceljs";

export async function generateXlsx(opts: {
  sheetName: string;
  headers: string[];
  rows: (string | number | null)[][];
  title?: string;
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(opts.sheetName);

  let startRow = 1;

  // Optional title row
  if (opts.title) {
    sheet.mergeCells(1, 1, 1, opts.headers.length);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = opts.title;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: "left" };
    startRow = 3;
  }

  // Header row
  const headerRow = sheet.getRow(startRow);
  opts.headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0D9488" },
    };
    cell.alignment = { horizontal: "center" };
  });
  headerRow.commit();

  // Data rows
  for (const row of opts.rows) {
    const dataRow = sheet.addRow(row.map((v) => v ?? ""));
    dataRow.eachCell((cell, colNumber) => {
      const val = row[colNumber - 1];
      if (typeof val === "number") {
        cell.numFmt = "#,##0";
      }
    });
  }

  // Auto-width columns
  sheet.columns.forEach((col, i) => {
    let maxLen = opts.headers[i]?.length ?? 10;
    for (const row of opts.rows) {
      const val = row[i];
      const len = val != null ? String(val).length : 0;
      if (len > maxLen) maxLen = len;
    }
    col.width = Math.min(maxLen + 4, 40);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
