/**
 * TableModal — Modal de creación y edición de mesas.
 * Cuando es edición, muestra el QR generado con la URL del portal de clientes y permite descargarlo.
 */
import React from "react";
import { Modal, Button, Input, TABLE_STATUSES, TableRecord } from "@menu-bites/ui";
import { Loader2, Download } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTable: TableRecord | null;
  form: { number: string; label: string; status: string };
  setForm: (form: any) => void;
  saving: boolean;
  onSave: () => void;
}

export function TableModal({
  isOpen,
  onClose,
  editingTable,
  form,
  setForm,
  saving,
  onSave,
}: TableModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTable ? `Mesa ${editingTable.number}` : "Nueva Mesa"}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-foreground/50 hover:bg-white/5 hover:text-foreground rounded-xl font-bold uppercase tracking-widest text-[10px]"
          >
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-[10px] px-6 shadow-lg shadow-primary/20 transition-all"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Guardar Mesa"
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-6 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">
              Número *
            </label>
            <Input
              type="number"
              min="1"
              placeholder="Ej. 1"
              className="bg-white/5 border-white/10 h-12 rounded-2xl focus-visible:ring-primary text-foreground font-black italic text-lg"
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">
              Estado
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
            >
              {TABLE_STATUSES.map((s) => (
                <option key={s} value={s} className="bg-background">
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">
            Etiqueta de Ubicación
          </label>
          <Input
            placeholder="Ej. Terraza, Segundo Piso..."
            className="bg-white/5 border-white/10 h-12 rounded-2xl focus-visible:ring-primary text-foreground font-medium"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
          />
        </div>

        {editingTable && editingTable.qrData && (
          <div className="pt-8 mt-4 border-t border-white/5 flex flex-col items-center gap-6">
            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] self-start px-1">
              Código QR de la Mesa
            </label>
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
                const canvas = document.getElementById(
                  `qr-table-${editingTable.number}`
                ) as HTMLCanvasElement;
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
              <span className="text-[10px] font-black uppercase tracking-widest">
                Descargar Imagen QR
              </span>
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
