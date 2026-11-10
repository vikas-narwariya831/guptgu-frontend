import { useState, useEffect } from 'react';

/**
 * Tracks elapsed meeting seconds since meetingStartedAt while in call.
 */
export function useMeetingTimer(inCall: boolean, meetingStartedAt: number): number {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!inCall) {
      setElapsedSeconds(0);
      return;
    }
    const update = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - meetingStartedAt) / 1000)));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [inCall, meetingStartedAt]);

  return elapsedSeconds;
}
