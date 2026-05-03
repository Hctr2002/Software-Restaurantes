"use client";

import React, { useCallback, useEffect, useState } from "react";
import LocalShell from "../_components/LocalShell";
import { Modal, Badge } from "@menu-bites/ui";
import { TABLE_STATUSES, TableRecord } from "../_components/localShared";
import { Button, Input } from "@menu-bites/ui";
import { Plus, Pencil, Trash2, Loader2, Download, Table as TableIcon } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";

const EMPTY_FORM = { number: "", label: "", status: "FREE" };

function tableStatusVariant(status: string) {
  if (status === "FREE") return "success";
  if (status === "OCCUPIED") return "danger";
  if (status === "RESERVED") return "warning";
  return "neutral";
}

export default function TablesPage() {
  const [tables, setTables] = useState<TableRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableRecord | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/local/tables", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error cargando mesas");
      setTables(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  const openCreate = () => {
    setEditingTable(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (table: TableRecord) => {
    setEditingTable(table);
    setForm({ number: String(table.number), label: table.label || "", status: table.status });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.number) return;
    setSaving(true);
    try {
      const payload = { number: parseInt(form.number), label: form.label.trim() || null, status: form.status };

      const res = editingTable
        ? await fetch(`/api/local/tables/${editingTable.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/local/tables", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error guardando mesa");
      setIsModalOpen(false);
      fetchTables();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar esta mesa?")) return;
    setDeleteId(id);
    try {
      const res = await fetch(`/api/local/tables/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Error eliminando mesa");
      }
      fetchTables();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <LocalShell title="Gestión" subtitle="Mesas">
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold mb-6">
          {error}
        </div>
      )}

      <div className="flex justify-end mb-8">
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold h-11 px-6 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95">
          <Plus className="w-4 h-4 mr-2" /> Nueva Mesa
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest">Organizando el salón...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {tables.length === 0 && (
            <div className="col-span-full py-20 text-center glass rounded-[2.5rem] border-white/5">
              <p className="text-foreground/40 font-bold uppercase tracking-widest text-xs">No hay mesas configuradas aún.</p>
            </div>
          )}
          {tables.map((table) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              key={table.id}
              className="glass p-6 rounded-[2.5rem] border-white/5 relative overflow-hidden group cursor-pointer hover:border-primary/20 transition-all duration-300"
              onClick={() => openEdit(table)}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`p-4 rounded-[1.5rem] bg-white/5 transition-transform group-hover:scale-110 ${table.status === 'OCCUPIED' ? 'text-destructive' : table.status === 'RESERVED' ? 'text-amber-500' : 'text-primary'}`}>
                  <TableIcon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-black text-foreground text-2xl tracking-tighter italic uppercase leading-none">Mesa {table.number}</h3>
                  <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-[0.2em] mt-1">{table.label || 'Principal'}</p>
                </div>
                <Badge variant={tableStatusVariant(table.status)} className="px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                  {table.status}
                </Badge>
              </div>

              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(table.id); }}
                  disabled={deleteId === table.id}
                  className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all"
                >
                  {deleteId === table.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTable ? `Mesa ${editingTable.number}` : "Nueva Mesa"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-foreground/50 hover:bg-white/5 hover:text-foreground rounded-xl font-bold uppercase tracking-widest text-[10px]">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-[10px] px-6 shadow-lg shadow-primary/20 transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Mesa"}
            </Button>
          </>
        }
      >
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">Número *</label>
              <Input type="number" min="1" placeholder="Ej. 1" className="bg-white/5 border-white/10 h-12 rounded-2xl focus-visible:ring-primary text-foreground font-black italic text-lg" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">Estado</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
              >
                {TABLE_STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-background">{s}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">Etiqueta de Ubicación</label>
            <Input placeholder="Ej. Terraza, Segundo Piso..." className="bg-white/5 border-white/10 h-12 rounded-2xl focus-visible:ring-primary text-foreground font-medium" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </div>

          {editingTable && editingTable.qrData && (
            <div className="pt-8 mt-4 border-t border-white/5 flex flex-col items-center gap-6">
              <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] self-start px-1">Código QR de la Mesa</label>
              <div className="flex flex-col items-center gap-4">
                <div className="p-6 bg-white rounded-[2rem] shadow-2xl shadow-black/50 group relative">
                  <QRCodeCanvas
                    id={`qr-table-${editingTable.number}`}
                    value={editingTable.qrData}
                    size={180}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <div className="w-full bg-black/20 p-3 rounded-xl border border-white/5 overflow-hidden">
                  <p className="text-[9px] font-mono text-primary/70 break-all text-center">
                    {editingTable.qrData}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full h-12 border-white/10 bg-white/5 hover:bg-primary/10 hover:text-primary hover:border-primary/20 rounded-2xl transition-all group"
                onClick={() => {
                  const canvas = document.getElementById(`qr-table-${editingTable.number}`) as HTMLCanvasElement;
                  if (canvas) {
                    const url = canvas.toDataURL("image/png");
                    const link = document.createElement("a");
                    link.download = `QR_Mesa_${editingTable.number}.png`;
                    link.href = url;
                    link.click();
                  }
                }}
              >
                <Download className="w-4 h-4 mr-2 group-hover:-translate-y-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Descargar Imagen QR</span>
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </LocalShell>
  );
}
