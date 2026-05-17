/**
 * SectionHeader — Encabezado de sección para la landing page del portal.
 * Muestra una etiqueta pequeña en verde (label) y un título principal (title).
 * Acepta un id para permitir navegación por anclas desde el menú.
 */

interface SectionHeaderProps {
  label: string;
  title: string;
  id?: string;
}

export function SectionHeader({ label, title, id }: SectionHeaderProps) {
  return (
    <div id={id} className="flex flex-col items-center gap-3 scroll-mt-24">
      <h2 className="text-xs font-black uppercase tracking-[0.4em] text-emerald-500/50">
        {label}
      </h2>
      <p className="text-2xl md:text-3xl font-black tracking-tight text-white text-center">
        {title}
      </p>
    </div>
  );
}
