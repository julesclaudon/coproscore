import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const [
    total_users,
    free_users,
    pro_users,
    total_pdf_purchases,
    revenus_pdf_agg,
    derniers_inscrits,
    derniers_pdf,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "FREE" } }),
    prisma.user.count({ where: { role: "PRO" } }),
    prisma.pdfPurchase.count(),
    prisma.pdfPurchase.aggregate({ _sum: { amount: true } }),
    prisma.user.findMany({
      orderBy: { id: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
      },
    }),
    prisma.pdfPurchase.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        slug: true,
        createdAt: true,
        amount: true,
        user: { select: { email: true } },
      },
    }),
  ]);

  // amount is stored in cents
  const revenus_pdf = (revenus_pdf_agg._sum.amount ?? 0) / 100;
  const revenus_pro = pro_users * 29;

  return NextResponse.json({
    total_users,
    free_users,
    pro_users,
    total_pdf_purchases,
    revenus_pdf,
    revenus_pro,
    derniers_inscrits,
    derniers_pdf: derniers_pdf.map((p) => ({
      id: p.id,
      email: p.user.email,
      slug: p.slug,
      amount: p.amount / 100,
      createdAt: p.createdAt,
    })),
  });
}
