"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

interface UseNotificationSoundOptions {
  /** Valor que se compara contra su valor anterior; al aumentar, suena la alerta. */
  count: number;
  /** Si es false, no se reproduce sonido aunque `count` aumente. */
  enabled?: boolean;
  /** URL del archivo de audio a reproducir. */
  soundUrl?: string;
}

/**
 * useNotificationSound: hook compartido de alarma sonora in-app.
 * Reproduce `soundUrl` cada vez que `count` aumenta respecto al render anterior.
 * Expone `audioBlocked`/`enableAudio` para el patrón de desbloqueo de autoplay
 * (el navegador requiere un gesto del usuario antes de permitir audio).
 */
export function useNotificationSound({ count, enabled = true, soundUrl = DEFAULT_SOUND_URL }: UseNotificationSoundOptions) {
  const prevCount = useRef(count);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);

  if (!audioRef.current && typeof window !== "undefined") {
    audioRef.current = new Audio(soundUrl);
    audioRef.current.preload = "auto";
  }

  useEffect(() => {
    if (enabled && count > prevCount.current) {
      audioRef.current?.play().then(
        () => setAudioBlocked(false),
        (err) => {
          if (err?.name === "NotAllowedError") setAudioBlocked(true);
        }
      );
    }
    prevCount.current = count;
  }, [count, enabled]);

  const enableAudio = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    const prevVolume = audio.volume;
    try {
      audio.volume = 0;
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1;
      setAudioBlocked(false);
    } catch {
      audio.volume = prevVolume;
    }
  };

  return { audioBlocked, enableAudio };
}
