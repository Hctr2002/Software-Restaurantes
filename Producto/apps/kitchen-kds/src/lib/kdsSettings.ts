export type CategoryTime = { name: string; minutes: number };

export type KDSSettings = {
  thresholds: { yellow: number; red: number };
  categoryTimes: CategoryTime[];
  sounds: { newTicket: boolean; criticalAlert: boolean };
  autoClear: { enabled: boolean; delaySeconds: number };
};

export const DEFAULT_SETTINGS: KDSSettings = {
  thresholds: { yellow: 10, red: 20 },
  categoryTimes: [],
  sounds: { newTicket: true, criticalAlert: true },
  autoClear: { enabled: false, delaySeconds: 30 },
};

const STORAGE_KEY = "kds-settings";

export function loadSettings(): KDSSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: KDSSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function getTicketUrgency(
  createdAt: string,
  thresholds: KDSSettings["thresholds"]
): "green" | "yellow" | "red" {
  const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (elapsed >= thresholds.red) return "red";
  if (elapsed >= thresholds.yellow) return "yellow";
  return "green";
}
