import { useCallback, useEffect, useRef, useState } from "react";
import type { ViewBox } from "../types/puzzle";
import { fitToJapan, fitToPrefecture, fitToRegion, zoomViewBox } from "../utils/mapViewport";

export function useMapViewport(regionId?: string) {
  const [viewBox, setViewBox] = useState<ViewBox>(() => (regionId ? fitToRegion(regionId) : fitToJapan()));
  const viewBoxRef = useRef(viewBox);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    viewBoxRef.current = viewBox;
  }, [viewBox]);

  const cancelAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      window.cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const setViewBoxDirect = useCallback(
    (nextViewBox: ViewBox | ((current: ViewBox) => ViewBox)) => {
      cancelAnimation();
      setViewBox((current) => {
        const resolved = typeof nextViewBox === "function" ? nextViewBox(current) : nextViewBox;
        viewBoxRef.current = resolved;
        return resolved;
      });
    },
    [cancelAnimation]
  );

  useEffect(() => {
    setViewBoxDirect(regionId ? fitToRegion(regionId) : fitToJapan());
  }, [regionId, setViewBoxDirect]);

  const animateToViewBox = useCallback(
    (nextViewBox: ViewBox, durationMs = 260) => {
      cancelAnimation();

      const startViewBox = viewBoxRef.current;
      const startTime = window.performance.now();
      const ease = (value: number) => 1 - Math.pow(1 - value, 3);

      const step = (now: number) => {
        const progress = Math.min(1, (now - startTime) / durationMs);
        const eased = ease(progress);
        const current = {
          x: startViewBox.x + (nextViewBox.x - startViewBox.x) * eased,
          y: startViewBox.y + (nextViewBox.y - startViewBox.y) * eased,
          width: startViewBox.width + (nextViewBox.width - startViewBox.width) * eased,
          height: startViewBox.height + (nextViewBox.height - startViewBox.height) * eased
        };

        viewBoxRef.current = current;
        setViewBox(current);

        if (progress < 1) {
          animationRef.current = window.requestAnimationFrame(step);
        } else {
          animationRef.current = null;
        }
      };

      animationRef.current = window.requestAnimationFrame(step);
    },
    [cancelAnimation]
  );

  useEffect(() => () => cancelAnimation(), [cancelAnimation]);

  const focusJapan = useCallback(() => setViewBoxDirect(fitToJapan()), [setViewBoxDirect]);
  const focusRegion = useCallback(
    (nextRegionId: string, padding?: number) => setViewBoxDirect(fitToRegion(nextRegionId, padding)),
    [setViewBoxDirect]
  );
  const focusPrefecture = useCallback((prefectureId: string, padding?: number) => {
    setViewBoxDirect(fitToPrefecture(prefectureId, padding));
  }, [setViewBoxDirect]);
  const zoomIn = useCallback(() => setViewBoxDirect((current) => zoomViewBox(current, 0.78)), [setViewBoxDirect]);
  const zoomOut = useCallback(() => setViewBoxDirect((current) => zoomViewBox(current, 1.22)), [setViewBoxDirect]);

  return {
    viewBox,
    setViewBox: setViewBoxDirect,
    animateToViewBox,
    fitToJapan: focusJapan,
    fitToRegion: focusRegion,
    fitToPrefecture: focusPrefecture,
    zoomIn,
    zoomOut
  };
}
