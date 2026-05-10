"use client";

import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle, Download, Loader2, Upload } from "lucide-react";
import { cn } from "@menu-bites/ui";

type Status = "idle" | "downloading" | "uploading" | "success" | "error";

interface CriticalItem { name: string; stock: number; unit: string; }

interface Props {
  restaurantId: string | undefined;
}

export function InventoryTab({ restaurantId }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [critical, setCritical] = useState<CriticalItem[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDownload = async () => {
    if (!restaurantId) return;
    setStatus("downloading");
    setMessage("");
    try {
      const res = await fetch("/api/inventory");
      if (!res.ok) throw new Error("Error al descargar");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = "inventario.csv"; a.click();
      URL.revokeObjectURL(url);
      setStatus("idle");
    } catch {
      setStatus("error");
      setMessage("Error al descargar el inventario.");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurantId) return;
    setStatus("uploading"); setMessage(""); setCritical([]);
    try {
      const text = await file.text();
      const res  = await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "text/plain; charset=utf-8" }, body: text });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al importar");
      setStatus("success");
      setMessage(`${json.updated} ítem(s) actualizado(s)${json.errors?.length ? ` · ${json.errors.length} error(es)` : ""}.`);
      setCritical(json.critical ?? []);
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Error inesperado al importar.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-foreground/40 text-sm">Descarga el inventario actual como CSV, actualiza los conteos y vuelve a subirlo.</p>
      <div className="p-4 bg-foreground/5 rounded-2xl border border-foreground/5 space-y-2 text-xs text-foreground/50">
        <p className="font-bold text-foreground/70 uppercase tracking-widest text-[10px] mb-2">Cómo usar</p>
        <p>1. Descarga el CSV. 2. Edita la columna <span className="font-black text-foreground/80">stock_actual</span>. 3. Súbelo con el botón "Subir Conteo".</p>
        <p className="text-yellow-400/70 pt-1">Solo se actualizan los stocks. El nombre y la unidad no cambian.</p>
      </div>

      <div className="flex gap-3">
        <button onClick={handleDownload} disabled={!restaurantId || status === "downloading"}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary/20 text-primary border border-primary/30 text-xs font-bold uppercase tracking-widest hover:bg-primary/30 transition-all disabled:opacity-40">
          {status === "downloading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Descargar CSV
        </button>
        <label className={cn("flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all cursor-pointer",
          !restaurantId || status === "uploading" ? "opacity-40 pointer-events-none bg-foreground/5 border-foreground/10 text-foreground/40" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30")}>
          {status === "uploading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Subir Conteo
          <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={handleUpload} disabled={!restaurantId || status === "uploading"} />
        </label>
      </div>

      {status === "success" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <CheckCircle className="w-4 h-4 shrink-0" />{message}
          </div>
          {critical.length > 0 ? (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              <div className="flex items-center gap-2 text-[10px] font-black text-red-400 uppercase tracking-widest">
                <AlertTriangle className="w-3.5 h-3.5" />Stock Crítico — {critical.length} ítem(s) bajo el umbral
              </div>
              {critical.map((item, i) => (
                <div key={i} className="flex justify-between px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                  <span className="text-red-300 text-xs font-bold">{item.name}</span>
                  <span className="text-red-400 text-xs font-black tabular-nums">{Number(item.stock).toFixed(2)} {item.unit}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-emerald-400/60 text-center font-bold uppercase tracking-widest">Todos los ítems tienen stock suficiente</p>
          )}
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
          <AlertTriangle className="w-4 h-4 shrink-0" />{message}
        </div>
      )}
    </div>
  );
}
