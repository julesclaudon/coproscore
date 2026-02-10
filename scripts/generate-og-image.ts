import { createCanvas } from "canvas";
import * as fs from "fs";
import * as path from "path";

const W = 1200;
const H = 630;
const TEAL = "#0F766E";
const TEAL_LIGHT = "#14B8A6";

const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");

// Background gradient (simulated with two rects)
ctx.fillStyle = TEAL;
ctx.fillRect(0, 0, W, H);

// Subtle lighter gradient overlay at top
const grad = ctx.createLinearGradient(0, 0, 0, H);
grad.addColorStop(0, "rgba(20, 184, 166, 0.3)");
grad.addColorStop(1, "rgba(0, 0, 0, 0)");
ctx.fillStyle = grad;
ctx.fillRect(0, 0, W, H);

// Decorative circles
ctx.beginPath();
ctx.arc(W - 150, 100, 200, 0, Math.PI * 2);
ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
ctx.fill();

ctx.beginPath();
ctx.arc(100, H - 80, 150, 0, Math.PI * 2);
ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
ctx.fill();

// Logo: "CoproScore"
ctx.fillStyle = "#FFFFFF";
ctx.font = "bold 48px sans-serif";
ctx.textAlign = "center";
ctx.fillText("CoproScore", W / 2, 180);

// Separator line
ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(W / 2 - 100, 210);
ctx.lineTo(W / 2 + 100, 210);
ctx.stroke();

// Main tagline
ctx.fillStyle = "#FFFFFF";
ctx.font = "bold 56px sans-serif";
ctx.textAlign = "center";
ctx.fillText("Le score de santé de", W / 2, 310);
ctx.fillText("votre copropriété", W / 2, 380);

// Bottom text
ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
ctx.font = "28px sans-serif";
ctx.fillText("619 402 copropriétés analysées — coproscore.fr", W / 2, 530);

const buf = canvas.toBuffer("image/png");
const outPath = path.resolve(__dirname, "../public/og-default.png");
fs.writeFileSync(outPath, buf);
console.log(`✓ og-default.png (${W}x${H})`);
