import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const email = request.nextUrl.searchParams.get("email");

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }

  const alert = await prisma.scoreAlert.findFirst({
    where: { id, email: email.toLowerCase() },
  });

  if (!alert) {
    return NextResponse.json({ error: "Alerte introuvable" }, { status: 404 });
  }

  await prisma.scoreAlert.delete({ where: { id } });

  return NextResponse.json({ message: "Alerte supprimée" });
}
