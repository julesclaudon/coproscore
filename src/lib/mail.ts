import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || "noreply@coproscore.fr",
    to,
    subject,
    html,
  });
}

function emailLayout(body: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden">
        <!-- Header -->
        <tr><td style="background:#0d9488;padding:24px 32px;text-align:center">
          <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px">CoproScore</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px">
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0">
          <span style="color:#94a3b8;font-size:12px">&copy; CoproScore 2026 &mdash; coproscore.fr</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function resetPasswordEmail(resetUrl: string) {
  return emailLayout(`
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px">Réinitialisez votre mot de passe</h2>
    <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6">
      Vous avez demandé la réinitialisation de votre mot de passe CoproScore.
      Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px">
      <tr><td style="background:#0d9488;border-radius:8px;text-align:center">
        <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none">
          Réinitialiser mon mot de passe
        </a>
      </td></tr>
    </table>
    <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.5">
      Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.
    </p>
  `);
}

export function welcomeEmail() {
  return emailLayout(`
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px">Bienvenue sur CoproScore !</h2>
    <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6">
      Votre compte a été créé avec succès. Vous pouvez dès maintenant rechercher
      et analyser n'importe quelle copropriété en France.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px">
      <tr><td style="background:#0d9488;border-radius:8px;text-align:center">
        <a href="https://coproscore.fr" style="display:inline-block;padding:12px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none">
          Rechercher une copropriété
        </a>
      </td></tr>
    </table>
    <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.5">
      Merci de votre confiance.
    </p>
  `);
}
