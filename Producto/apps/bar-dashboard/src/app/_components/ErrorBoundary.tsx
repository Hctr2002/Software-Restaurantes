"use client";

import React, { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  onError?: (error: Error) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SettingsErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("[SettingsErrorBoundary]", error);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="text-sm text-red-400 flex-1">
            Error en configuración:{" "}
            {this.state.error?.message ?? "Error desconocido"}
          </span>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-red-400 hover:text-red-300 transition-colors"
            aria-label="Reintentar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
