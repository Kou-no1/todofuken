import { useCallback, useState } from "react";

export type ActiveDrag = {
  prefectureId: string;
  clientX: number;
  clientY: number;
};

export function useDragAndDrop() {
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);

  const startDrag = useCallback((prefectureId: string, clientX: number, clientY: number) => {
    setActiveDrag({ prefectureId, clientX, clientY });
  }, []);

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    setActiveDrag((current) => (current ? { ...current, clientX, clientY } : current));
  }, []);

  const endDrag = useCallback(() => {
    setActiveDrag(null);
  }, []);

  return {
    activeDrag,
    startDrag,
    moveDrag,
    endDrag
  };
}
