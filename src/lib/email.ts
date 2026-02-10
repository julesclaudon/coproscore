import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function sendConfirmationEmail({
  to,
  token,
  coproName,
}: {
  to: string;
  token: string;
  coproName: string;
}) {
  const confirmUrl = `${BASE_URL}/api/alertes/confirm/${token}`;

  await getResend().emails.send({
    from: "CoproScore <alertes@coproscore.fr>",
    to,
    subject: `Confirmez votre alerte pour ${coproName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 16px;">
          Confirmer votre alerte
        </h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
          Vous avez demand&eacute; &agrave; recevoir un email si le score de
          <strong>${coproName}</strong> change.
        </p>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Cliquez sur le bouton ci-dessous pour confirmer :
        </p>
        <a href="${confirmUrl}" style="display: inline-block; background: #0d9488; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
          Confirmer mon alerte
        </a>
        <p style="color: #94a3b8; font-size: 13px; margin: 24px 0 0; line-height: 1.5;">
          Si vous n&rsquo;avez pas demand&eacute; cette alerte, ignorez simplement cet email.
        </p>
      </div>
    `,
  });
}
