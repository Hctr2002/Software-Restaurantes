"use client";

import { ShoppingBag } from "lucide-react";
import { TableRecord } from "@menu-bites/auth";

interface ConfirmationOverlayProps {
  show: boolean;
  tableData: TableRecord | null;
  restaurantName: string;
  onClose: () => void;
}

export function ConfirmationOverlay({ show, tableData, restaurantName, onClose }: ConfirmationOverlayProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 text-center"
         style={{ backgroundColor: '#0d1117' }}>
      <div className="w-24 h-24 rounded-full flex items-center justify-center mb-8"
           style={{ backgroundColor: '#6b8f71', boxShadow: '0 0 40px rgba(107,143,113,0.4)' }}>
        <ShoppingBag style={{ width: 44, height: 44, color: '#0d1117' }} aria-hidden="true" />
      </div>
      <h2 style={{ fontSize: 28, fontWeight: 900, color: '#f5e6d3', marginBottom: 12 }}>¡Pedido Confirmado!</h2>
      <p style={{ fontSize: 18, color: '#6b8f71', fontWeight: 600, marginBottom: 8 }}>En breve se acercarán a confirmar su pedido.</p>
      {tableData && (
        <p style={{ fontSize: 13, color: 'rgba(245,230,211,0.4)', marginBottom: 40 }}>Mesa #{tableData.number} · {restaurantName}</p>
      )}
      <button 
        onClick={onClose} 
        style={{ 
          backgroundColor: 'rgba(255,255,255,0.05)', 
          color: '#f5e6d3', 
          border: '1px solid rgba(255,255,255,0.1)', 
          borderRadius: 14, 
          padding: '12px 32px', 
          fontWeight: 700, 
          fontSize: 15, 
          cursor: 'pointer' 
        }}
      >
        Volver al Menú
      </button>
    </div>
  );
}
