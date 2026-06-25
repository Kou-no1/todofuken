import { useCallback, useEffect, useState } from "react";
import type { ViewBox } from "../types/puzzle";
import { fitToJapan, fitToPrefecture, fitToRegion, zoomViewBox } from "../utils/mapViewport";

export function useMapViewport(regionId?: string) {
  const [viewBox, setViewBox] = useState<ViewBox>(() => (regionId ? fitToRegion(regionId) : fitToJapan()));

  useEffect(() => {
    setViewBox(regionId ? fitToRegion(regionId) : fitToJapan());
  }, [regionId]);

  const focusJapan = useCallback(() => setViewBox(fitToJapan()), []);
  const focusRegion = useCallback((nextRegionId: string, padding?: number) => setViewBox(fitToRegion(nextRegionId, padding)), []);
  const focusPrefecture = useCallback((prefectureId: string, padding?: number) => {
    setViewBox(fitToPrefecture(prefectureId, padding));
  }, []);
  const zoomIn = useCallback(() => setViewBox((current) => zoomViewBox(current, 0.78)), []);
  const zoomOut = useCallback(() => setViewBox((current) => zoomViewBox(current, 1.22)), []);

  return {
    viewBox,
    setViewBox,
    fitToJapan: focusJapan,
    fitToRegion: focusRegion,
    fitToPrefecture: focusPrefecture,
    zoomIn,
    zoomOut
  };
}
