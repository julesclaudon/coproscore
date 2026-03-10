import "dotenv/config";
import { sendEmail, abandonedCartEmail } from "../src/lib/mail.js";

const to = "julesclaudon@gmail.com";
const adresse = "45 Boulevard Saint-Marcel, Paris 13e";
const slug = "score-copropriete-45-bd-saint-marcel-75013-paris";

async function main() {
  console.log(`Sending test abandoned cart email to ${to}...`);
  await sendEmail({
    to,
    subject: "Votre rapport CoproScore vous attend 🏠",
    html: abandonedCartEmail(adresse, slug),
  });
  console.log("Email sent successfully!");
}

main().catch((err) => {
  console.error("Failed to send email:", err);
  process.exit(1);
});
