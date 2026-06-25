import type { ReactNode } from "react";
import { APP_NAME } from "../../constants";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell" aria-label={APP_NAME}>
      {children}
    </div>
  );
}
