import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const confirmation = await prisma.alertConfirmation.findUnique({
    where: { token },
    include: { alert: true },
  });

  if (!confirmation) {
    return NextResponse.redirect(new URL("/alertes?confirmed=invalid", _request.url));
  }

  if (confirmation.confirmedAt) {
    return NextResponse.redirect(new URL("/alertes?confirmed=already", _request.url));
  }

  await prisma.$transaction([
    prisma.alertConfirmation.update({
      where: { id: confirmation.id },
      data: { confirmedAt: new Date() },
    }),
    prisma.scoreAlert.update({
      where: { id: confirmation.alertId },
      data: { active: true },
    }),
  ]);

  return NextResponse.redirect(new URL("/alertes?confirmed=ok", _request.url));
}
