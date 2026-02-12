import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchDvfTransactions } from "@/lib/dvf-queries";
import { generateCsv } from "@/lib/csv-export";
import { generateXlsx } from "@/lib/xlsx-export";
import { formatCoproName } from "@/lib/utils";
import { checkAccess } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Pro-only endpoint
  const access = await checkAccess("pro");
  if (!access) {
    return NextResponse.json({ error: "Accès réservé aux abonnés Pro" }, { status: 403 });
  }

  const { slug } = await params;
  const format = request.nextUrl.searchParams.get("format") ?? "csv";

  if (format !== "csv" && format !== "xlsx") {
    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  }

  const copro = await prisma.copropriete.findUnique({
    where: { slug },
    select: {
      longitude: true,
      latitude: true,
      adresseReference: true,
      nomUsage: true,
    },
  });

  if (!copro || copro.longitude == null || copro.latitude == null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const transactions = await fetchDvfTransactions(
    copro.longitude,
    copro.latitude,
    5000
  );

  const headers = [
    "Date",
    "Adresse",
    "Surface (m²)",
    "Pièces",
    "Prix (€)",
    "Prix/m² (€/m²)",
  ];

  const today = new Date().toISOString().slice(0, 10);
  const displayName = formatCoproName(
    copro.nomUsage || copro.adresseReference || "Copropriété"
  );

  if (format === "csv") {
    const rows = transactions.map((t) => [
      new Date(t.date_mutation).toLocaleDateString("fr-FR"),
      t.adresse ?? "—",
      String(Math.round(Number(t.surface))),
      t.nb_pieces != null ? String(t.nb_pieces) : "—",
      String(Math.round(Number(t.prix))),
      String(Number(t.prix_m2)),
    ]);

    const csv = generateCsv(headers, rows);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="dvf-${slug}-${today}.csv"`,
      },
    });
  }

  // XLSX
  const rows = transactions.map((t) => [
    new Date(t.date_mutation).toLocaleDateString("fr-FR"),
    t.adresse ?? "—",
    Math.round(Number(t.surface)),
    t.nb_pieces != null ? Number(t.nb_pieces) : null,
    Math.round(Number(t.prix)),
    Number(t.prix_m2),
  ]);

  const buffer = await generateXlsx({
    sheetName: "Transactions DVF",
    headers,
    rows,
    title: `${displayName} — Export DVF ${today}`,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="dvf-${slug}-${today}.xlsx"`,
    },
  });
}
