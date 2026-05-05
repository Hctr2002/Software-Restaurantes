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

export async function loadSettings(): Promise<KDSSettings> {
  try {
    const res = await fetch("/api/settings");
    if (!res.ok) return DEFAULT_SETTINGS;
    const data = await res.json();
    if (!data) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...data };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(s: KDSSettings): Promise<void> {
  try {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
  } catch (error) {
    console.error("Error saving KDS settings:", error);
  }
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
