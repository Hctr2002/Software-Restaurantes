import type { Metadata } from "next";
import { cn } from "@menu-bites/ui/lib/utils";
import "@menu-bites/ui/styles/globals.css";
export const metadata: Metadata = {
  title: "Menu Bites | Caja",
  description: "Terminal de Cajero",
};

const FOUC_SCRIPT = `(function(){try{var p=window.location.pathname;if(p==='/login'||p.startsWith('/auth/'))return;var t=JSON.parse(localStorage.getItem('mb-theme-cashier')||'null');if(!t)return;function h(x){var c=x.startsWith('#')?x.slice(1):x;if(c.length===3)c=c[0]+c[0]+c[1]+c[1]+c[2]+c[2];var r=parseInt(c.slice(0,2),16)/255,g=parseInt(c.slice(2,4),16)/255,b=parseInt(c.slice(4,6),16)/255;var M=Math.max(r,g,b),m=Math.min(r,g,b),hh=0,s=0,l=(M+m)/2;if(M!==m){var d=M-m;s=l>0.5?d/(2-M-m):d/(M+m);if(M===r)hh=(g-b)/d+(g<b?6:0);else if(M===g)hh=(b-r)/d+2;else hh=(r-g)/d+4;hh/=6;}return Math.round(hh*360)+' '+Math.round(s*100)+'% '+Math.round(l*100)+'%';}function a(hsl,d){var p=hsl.split(' ');return p[0]+' '+p[1]+' '+Math.min(97,Math.max(3,parseInt(p[2])+d))+'%';}var ro=document.documentElement,sv=ro.style.setProperty.bind(ro.style);var card=h(t.cardBackground),cL=parseInt(card.split(' ')[2]),dk=cL<50;sv('--primary',h(t.primaryColor));sv('--secondary',h(t.secondaryColor));sv('--background',h(t.backgroundColor));sv('--foreground',h(t.textColor));sv('--card',card);sv('--accent',h(t.accentColor));sv('--card-foreground',h(t.textColor));sv('--primary-foreground',h(t.backgroundColor));sv('--muted',a(card,dk?6:-6));sv('--border',a(card,dk?10:-10));if(t.fontTitle)sv('--font-title','"'+t.fontTitle+'",system-ui,sans-serif');if(t.fontBody)sv('--font-body','"'+t.fontBody+'",system-ui,sans-serif');if(t.fontAccent)sv('--font-accent','"'+t.fontAccent+'",system-ui,sans-serif');var ff=[t.fontTitle,t.fontBody,t.fontAccent].filter(function(f){return f&&f!=='Outfit'&&f!=='Inter';});if(ff.length>0){var lk=document.createElement('link');lk.rel='stylesheet';lk.href='https://fonts.googleapis.com/css2?'+ff.map(function(f){return'family='+f.replace(/\\s+/g,'+')+':wght@300;400;500;600;700;800;900';}).join('&')+'&display=swap';document.head.appendChild(lk);}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: FOUC_SCRIPT }} />
      </head>
      <body className={cn("font-sans antialiased bg-background text-foreground min-h-screen")}>
        {children}
      </body>
    </html>
  );
}
