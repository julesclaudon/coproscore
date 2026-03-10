import "dotenv/config";
import { sendEmail, onboardingEmail } from "../src/lib/mail.js";

const to = "julesclaudon@gmail.com";

async function main() {
  console.log(`Sending test onboarding email to ${to}...`);
  await sendEmail({
    to,
    subject: "Bienvenue sur CoproScore 🏠",
    html: onboardingEmail("Jules"),
  });
  console.log("Email sent successfully!");
}

main().catch((err) => {
  console.error("Failed to send email:", err);
  process.exit(1);
});
