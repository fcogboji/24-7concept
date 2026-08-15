import { renderBrandMark } from "@/lib/brand-mark";

export const contentType = "image/png";

export function GET() {
  return renderBrandMark(192);
}
