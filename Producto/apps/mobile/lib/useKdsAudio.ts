import { useEffect, useRef, useCallback } from 'react';
import { Platform, Vibration } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

// Same CDN sources used by the web KDS apps
const NEW_TICKET_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
const CRITICAL_URL   = 'https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3';

export function useKdsAudio(enabled: boolean) {
  const newTicketRef = useRef<Audio.Sound | null>(null);
  const criticalRef  = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function load() {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const [nt, cr] = await Promise.all([
          Audio.Sound.createAsync({ uri: NEW_TICKET_URL }, { shouldPlay: false }),
          Audio.Sound.createAsync({ uri: CRITICAL_URL },   { shouldPlay: false }),
        ]);
        if (!cancelled) {
          newTicketRef.current = nt.sound;
          criticalRef.current  = cr.sound;
        } else {
          nt.sound.unloadAsync();
          cr.sound.unloadAsync();
        }
      } catch {
        // Network unavailable — haptic fallback will handle it
      }
    }

    load();

    return () => {
      cancelled = true;
      newTicketRef.current?.unloadAsync();
      criticalRef.current?.unloadAsync();
      newTicketRef.current = null;
      criticalRef.current  = null;
    };
  }, [enabled]);

  const playNewOrder = useCallback(async () => {
    const sound = newTicketRef.current;
    if (sound) {
      try { await sound.replayAsync(); return; } catch {}
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (Platform.OS === 'android') Vibration.vibrate([0, 150, 80, 150]);
  }, []);

  const playUrgent = useCallback(async () => {
    const sound = criticalRef.current;
    if (sound) {
      try { await sound.replayAsync(); return; } catch {}
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (Platform.OS === 'android') Vibration.vibrate([0, 300, 100, 300, 100, 300]);
  }, []);

  return { playNewOrder, playUrgent };
}
