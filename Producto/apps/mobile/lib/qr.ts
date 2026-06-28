/**
 * Parseo del contenido de un QR de mesa.
 *
 * El QR codifica la URL del portal del cliente con el formato `<host>/<slug>/<mesa>`.
 * Según la configuración de NEXT_PUBLIC_CUSTOMER_PORTAL_URL, el host puede venir
 * con esquema (`https://portal-menubites.vercel.app/...`) o sin él
 * (`portal-menubites.vercel.app/...`). También se soporta una ruta directa
 * (`<slug>/<mesa>`). En todos los casos, slug y mesa son los DOS ÚLTIMOS
 * segmentos de la ruta, por lo que extraerlos así es robusto ante todas las variantes.
 */
export function parseQrTableUrl(data: string): { slug: string; table: string } | null {
  if (!data) return null;
  const clean = data.trim();

  let parts: string[];
  try {
    if (clean.includes("://")) {
      parts = new URL(clean).pathname.split("/").filter(Boolean);
    } else {
      parts = clean.split("?")[0].split("#")[0].split("/").filter(Boolean);
    }
  } catch {
    return null;
  }

  if (parts.length < 2) return null;
  const table = parts[parts.length - 1];
  const slug = parts[parts.length - 2];
  if (!slug || !table) return null;

  return { slug, table };
}
