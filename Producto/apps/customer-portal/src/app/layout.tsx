import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Menu Bites | Premium Dining Experience",
  description: "Experience fine dining at your fingertips with our digital menu.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Script bloqueante que aplica el tema cacheado antes del primer paint.
// Elimina el FOUC (flash of default dark/green colors) en visitas repetidas.
const THEME_INIT_SCRIPT = `
(function(){
  try {
    var slug = window.location.pathname.split('/').filter(Boolean)[0];
    if (!slug) return;
    var raw = localStorage.getItem('mb-theme-' + slug);
    if (!raw) return;
    var t = JSON.parse(raw);
    function toHsl(hex) {
      var c = hex.startsWith('#') ? hex.slice(1) : hex;
      if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
      var r = parseInt(c.slice(0,2),16)/255,
          g = parseInt(c.slice(2,4),16)/255,
          b = parseInt(c.slice(4,6),16)/255;
      var max = Math.max(r,g,b), min = Math.min(r,g,b);
      var h=0, s=0, l=(max+min)/2;
      if (max !== min) {
        var d = max - min;
        s = l > 0.5 ? d/(2-max-min) : d/(max+min);
        if (max===r) h=(g-b)/d+(g<b?6:0);
        else if (max===g) h=(b-r)/d+2;
        else h=(r-g)/d+4;
        h/=6;
      }
      return Math.round(h*360)+' '+Math.round(s*100)+'% '+Math.round(l*100)+'%';
    }
    var root = document.documentElement;
    var set = root.style.setProperty.bind(root.style);
    set('--background',   toHsl(t.backgroundColor));
    set('--foreground',   toHsl(t.textColor));
    set('--card',         toHsl(t.cardBackground));
    set('--primary',      toHsl(t.primaryColor));
    set('--accent',       toHsl(t.accentColor));
    set('--border',       toHsl(t.secondaryColor));
    set('--muted',        toHsl(t.secondaryColor));
    set('--card-foreground',       toHsl(t.textColor));
    set('--primary-foreground',    toHsl(t.backgroundColor));
    set('--muted-foreground',      toHsl(t.textColor));
    if (t.fontTitle)  set('--font-title',  '"' + t.fontTitle  + '", system-ui, sans-serif');
    if (t.fontBody)   set('--font-body',   '"' + t.fontBody   + '", system-ui, sans-serif');
    if (t.fontAccent) set('--font-accent', '"' + t.fontAccent + '", system-ui, sans-serif');
    var fonts = [t.fontTitle, t.fontBody, t.fontAccent]
      .filter(function(f){ return f && f !== 'Outfit' && f !== 'Inter'; });
    if (fonts.length > 0) {
      var lnk = document.createElement('link');
      lnk.rel = 'stylesheet';
      lnk.href = 'https://fonts.googleapis.com/css2?' +
        fonts.map(function(f){ return 'family=' + f.replace(/\s+/g, '+') + ':wght@300;400;500;600;700;800;900'; }).join('&') +
        '&display=swap';
      document.head.appendChild(lnk);
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Aplicar tema cacheado antes del primer paint para eliminar el FOUC */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
