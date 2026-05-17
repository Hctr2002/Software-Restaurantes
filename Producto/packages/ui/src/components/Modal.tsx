"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/80 z-[100] transition-opacity duration-500 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-card border-l border-border z-[101] shadow-2xl transform transition-transform duration-500 ease-[0.16,1,0.3,1] flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-muted/30">
          <h2 className="text-xl font-black text-foreground tracking-tighter uppercase italic">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 text-foreground/40 hover:text-foreground hover:bg-muted/30 rounded-2xl transition-all"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 text-foreground/80 no-scrollbar">{children}</div>
        {footer && (
          <div className="px-8 py-6 border-t border-border bg-muted/30 flex justify-end gap-4">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
