import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail } from "@/lib/email";
import { formatCoproName } from "@/lib/utils";
import { checkAccess } from "@/lib/api-auth";
import crypto from "crypto";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FREE_ALERTS = 2;
const MAX_PRO_ALERTS = 999;

export async function POST(request: NextRequest) {
  // Require at least free (logged in) access
  const access = await checkAccess("free");
  if (!access) {
    return NextResponse.json({ error: "Connectez-vous pour créer une alerte" }, { status: 401 });
  }

  const maxAlerts = access === "pro" ? MAX_PRO_ALERTS : MAX_FREE_ALERTS;
  let body: { email?: string; slug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, slug } = body;

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  if (!slug) {
    return NextResponse.json({ error: "Slug manquant" }, { status: 400 });
  }

  const copro = await prisma.copropriete.findUnique({
    where: { slug },
    select: { id: true, adresseReference: true, nomUsage: true },
  });

  if (!copro) {
    return NextResponse.json({ error: "Copropriété introuvable" }, { status: 404 });
  }

  // Check free limit
  const alertCount = await prisma.scoreAlert.count({
    where: { email: email.toLowerCase() },
  });

  if (alertCount >= maxAlerts) {
    return NextResponse.json(
      {
        error: "Limite atteinte",
        message: `Vous avez atteint la limite de ${maxAlerts} alertes. ${access === "free" ? "Passez Pro pour en créer davantage." : ""}`,
      },
      { status: 403 }
    );
  }

  const normalizedEmail = email.toLowerCase();
  const coproName = formatCoproName(copro.adresseReference || copro.nomUsage || "cette copropriété");

  // Upsert alert
  const alert = await prisma.scoreAlert.upsert({
    where: {
      email_coproId: { email: normalizedEmail, coproId: copro.id },
    },
    update: {},
    create: {
      email: normalizedEmail,
      coproId: copro.id,
    },
  });

  if (alert.active) {
    return NextResponse.json({ message: "Vous êtes déjà abonné à cette alerte." });
  }

  // Create confirmation token
  const token = crypto.randomUUID();
  await prisma.alertConfirmation.create({
    data: { alertId: alert.id, token },
  });

  // Send confirmation email
  await sendConfirmationEmail({ to: normalizedEmail, token, coproName });

  return NextResponse.json(
    { message: "Un email de confirmation vous a été envoyé." },
    { status: 201 }
  );
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase();

  const alerts: Array<{
    id: number;
    copro_id: number;
    active: boolean;
    created_at: Date;
    slug: string | null;
    adresse_reference: string | null;
    nom_usage: string | null;
    commune_adresse: string | null;
    code_postal: string | null;
    score_global: number | null;
  }> = await prisma.$queryRaw`
    SELECT
      sa.id,
      sa.copro_id,
      sa.active,
      sa.created_at,
      c.slug,
      c.adresse_reference,
      c.nom_usage,
      c.commune_adresse,
      c.code_postal,
      c.score_global
    FROM score_alerts sa
    JOIN coproprietes c ON c.id = sa.copro_id
    WHERE sa.email = ${normalizedEmail}
    ORDER BY sa.created_at DESC
  `;

  const result = alerts.map((a) => ({
    id: a.id,
    coproId: a.copro_id,
    active: a.active,
    createdAt: a.created_at,
    slug: a.slug,
    nom: formatCoproName(a.adresse_reference || a.nom_usage || ""),
    adresse: [a.adresse_reference, a.code_postal, a.commune_adresse].filter(Boolean).join(", "),
    score: a.score_global,
  }));

  return NextResponse.json({ alerts: result });
}
