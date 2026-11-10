import { useEffect } from 'react';

interface UseMeetingShortcutsOptions {
  enabled: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
}

/**
 * Global keyboard shortcuts during a meeting:
 * M -> Mute/Unmute mic, V -> Toggle camera
 */
export function useMeetingShortcuts({
  enabled,
  onToggleMute,
  onToggleCamera
}: UseMeetingShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        onToggleMute();
      } else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        onToggleCamera();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, onToggleMute, onToggleCamera]);
}
