import type { TimeTitle } from "../../types/puzzle";

type TimeTitleBadgeProps = {
  title: TimeTitle;
};

export function TimeTitleBadge({ title }: TimeTitleBadgeProps) {
  return (
    <div className="time-title-badge" aria-label={`称号 ${title.title}`}>
      <span className="badge-label">称号</span>
      <strong>{title.title}</strong>
    </div>
  );
}
