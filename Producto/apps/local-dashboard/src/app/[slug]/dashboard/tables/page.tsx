"use client";

import React, { useCallback, useEffect, useState } from "react";
import LocalShell from "../_components/LocalShell";
import { Table, TableRow, TableCell, Modal, Badge } from "@menu-bites/ui";
import { TABLE_STATUSES, TableRecord } from "../_components/localShared";
import { Button, Input } from "@menu-bites/ui";
import { Plus, Pencil, Trash2, Loader2, Download } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

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
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold">
          {error}
        </div>
      )}

      <div className="flex justify-end mb-4">
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Nueva Mesa
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando mesas...</p>
      ) : (
        <Table headers={["Número", "Etiqueta", "Estado", "Acciones"]}>
          {tables.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No hay mesas registradas. Crea la primera.
              </TableCell>
            </TableRow>
          )}
          {tables.map((table) => (
            <TableRow key={table.id}>
              <TableCell className="font-bold text-slate-200">Mesa {table.number}</TableCell>
              <TableCell className="text-slate-400">{table.label || "—"}</TableCell>
              <TableCell>
                <Badge variant={tableStatusVariant(table.status)}>{table.status}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(table)} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(table.id)}
                    disabled={deleteId === table.id}
                    className="p-1.5 rounded hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    {deleteId === table.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTable ? "Editar Mesa" : "Nueva Mesa"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Número *</label>
            <Input type="number" min="1" placeholder="Ej. 1" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Etiqueta</label>
            <Input placeholder="Ej. Terraza Sur" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {TABLE_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {editingTable && editingTable.qrData && (
            <div className="pt-6 border-t border-slate-800 flex flex-col items-center gap-4">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider self-start">Código QR de la Mesa</label>
              <div className="p-4 bg-white rounded-xl shadow-lg shadow-black/50">
                <QRCodeCanvas
                  id={`qr-table-${editingTable.number}`}
                  value={editingTable.qrData}
                  size={160}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <p className="text-[10px] text-slate-500 font-mono break-all text-center max-w-[200px]">
                {editingTable.qrData}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-slate-700 hover:bg-slate-800 text-slate-300"
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
                <Download className="w-4 h-4 mr-2" /> Descargar QR
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </LocalShell>
  );
}
