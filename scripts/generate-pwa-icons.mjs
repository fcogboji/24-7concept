#!/usr/bin/env node
/**
 * Generate PWA icons from logo.png
 * Requires: npm install sharp
 * Run: node scripts/generate-pwa-icons.mjs
 */

import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, "../public");

const sizes = [192, 512];

async function generateIcons() {
  console.log("Generating PWA icons...");

  for (const size of sizes) {
    await sharp(join(publicDir, "logo.png"))
      .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(join(publicDir, `icon-${size}.png`));

    console.log(`✓ Generated icon-${size}.png`);
  }

  console.log("✓ All icons generated successfully");
}

generateIcons().catch((error) => {
  console.error("Error generating icons:", error);
  process.exit(1);
});
