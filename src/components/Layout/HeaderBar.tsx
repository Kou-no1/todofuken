import type { ReactNode } from "react";
import { APP_NAME } from "../../constants";

type HeaderBarProps = {
  children?: ReactNode;
  onHome?: () => void;
};

export function HeaderBar({ children, onHome }: HeaderBarProps) {
  return (
    <header className="header-bar">
      <button className="brand-button" type="button" onClick={onHome} aria-label="モードを選ぶにもどる">
        <span className="brand-mark">地図</span>
        <span className="brand-title">{APP_NAME}</span>
      </button>
      <div className="header-actions">{children}</div>
    </header>
  );
}
