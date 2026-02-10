import { createCanvas } from "canvas";
import * as fs from "fs";
import * as path from "path";

const TEAL = "#0F766E";
const SIZES = [
  { name: "favicon-32.png", size: 32, radius: 6 },
  { name: "apple-touch-icon.png", size: 180, radius: 36 },
  { name: "icon-192.png", size: 192, radius: 38 },
  { name: "icon-512.png", size: 512, radius: 96 },
];

const publicDir = path.resolve(__dirname, "../public");

for (const { name, size, radius } of SIZES) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Rounded rectangle background
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fillStyle = TEAL;
  ctx.fill();

  // "CS" text
  const fontSize = Math.round(size * 0.44);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CS", size / 2, size / 2 + fontSize * 0.04);

  const buf = canvas.toBuffer("image/png");
  fs.writeFileSync(path.join(publicDir, name), buf);
  console.log(`✓ ${name} (${size}x${size})`);
}

// Generate .ico from the 32px PNG (simple single-image ICO)
const canvas32 = createCanvas(32, 32);
const ctx32 = canvas32.getContext("2d");
const r = 6;
ctx32.beginPath();
ctx32.moveTo(r, 0);
ctx32.lineTo(32 - r, 0);
ctx32.quadraticCurveTo(32, 0, 32, r);
ctx32.lineTo(32, 32 - r);
ctx32.quadraticCurveTo(32, 32, 32 - r, 32);
ctx32.lineTo(r, 32);
ctx32.quadraticCurveTo(0, 32, 0, 32 - r);
ctx32.lineTo(0, r);
ctx32.quadraticCurveTo(0, 0, r, 0);
ctx32.closePath();
ctx32.fillStyle = TEAL;
ctx32.fill();
const fs32 = Math.round(32 * 0.44);
ctx32.fillStyle = "#FFFFFF";
ctx32.font = `bold ${fs32}px sans-serif`;
ctx32.textAlign = "center";
ctx32.textBaseline = "middle";
ctx32.fillText("CS", 16, 16 + fs32 * 0.04);

// Build ICO file (single 32x32 PNG image)
const png32 = canvas32.toBuffer("image/png");
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // ICO type
icoHeader.writeUInt16LE(1, 4); // 1 image

const icoEntry = Buffer.alloc(16);
icoEntry.writeUInt8(32, 0);  // width
icoEntry.writeUInt8(32, 1);  // height
icoEntry.writeUInt8(0, 2);   // palette
icoEntry.writeUInt8(0, 3);   // reserved
icoEntry.writeUInt16LE(1, 4);  // color planes
icoEntry.writeUInt16LE(32, 6); // bits per pixel
icoEntry.writeUInt32LE(png32.length, 8); // size
icoEntry.writeUInt32LE(22, 12); // offset (6 + 16 = 22)

const ico = Buffer.concat([icoHeader, icoEntry, png32]);
fs.writeFileSync(path.join(publicDir, "favicon.ico"), ico);
console.log("✓ favicon.ico (32x32 ICO)");
