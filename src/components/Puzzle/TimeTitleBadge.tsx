import type { TimeTitle } from "../../types/puzzle";

type TimeTitleBadgeProps = {
  title: TimeTitle;
};

export function TimeTitleBadge({ title }: TimeTitleBadgeProps) {
  return (
    <div className="time-title-badge" aria-label={`しょうごう ${title.title}`}>
      <span className="badge-label">しょうごう</span>
      <strong>{title.title}</strong>
    </div>
  );
}
