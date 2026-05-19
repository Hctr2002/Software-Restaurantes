"use client";

export function PrintControls() {
  return (
    <div className="no-print" style={{ display: "flex", gap: 12, justifyContent: "center", padding: "16px 0 0" }}>
      <button
        onClick={() => window.print()}
        style={{ padding: "8px 20px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }}
      >
        Imprimir
      </button>
      <button
        onClick={() => window.close()}
        style={{ padding: "8px 20px", background: "#6b7280", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }}
      >
        Cerrar
      </button>
    </div>
  );
}
