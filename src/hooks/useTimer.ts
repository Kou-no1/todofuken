import { useCallback, useEffect, useRef, useState } from "react";

export function useTimer() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const storedSecondsRef = useRef(0);

  const getCurrentSeconds = useCallback(() => {
    if (startedAtRef.current === null) {
      return storedSecondsRef.current;
    }

    return storedSecondsRef.current + (performance.now() - startedAtRef.current) / 1000;
  }, []);

  const start = useCallback(() => {
    storedSecondsRef.current = 0;
    startedAtRef.current = performance.now();
    setElapsedSeconds(0);
    setIsRunning(true);
  }, []);

  const reset = useCallback(() => {
    storedSecondsRef.current = 0;
    startedAtRef.current = null;
    setElapsedSeconds(0);
    setIsRunning(false);
  }, []);

  const stop = useCallback(() => {
    const finalSeconds = getCurrentSeconds();
    storedSecondsRef.current = finalSeconds;
    startedAtRef.current = null;
    setElapsedSeconds(finalSeconds);
    setIsRunning(false);
    return finalSeconds;
  }, [getCurrentSeconds]);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds(getCurrentSeconds());
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [getCurrentSeconds, isRunning]);

  return {
    elapsedSeconds,
    isRunning,
    start,
    stop,
    reset
  };
}
