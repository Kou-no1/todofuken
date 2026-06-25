import type { ReactNode } from "react";

type BottomTrayProps = {
  children: ReactNode;
  label?: string;
};

export function BottomTray({ children, label = "ピース一覧" }: BottomTrayProps) {
  return (
    <section className="bottom-tray" aria-label={label}>
      <div className="tray-label">{label}</div>
      <div className="tray-scroll">{children}</div>
    </section>
  );
}
