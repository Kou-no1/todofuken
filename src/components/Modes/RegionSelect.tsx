import { regions } from "../../data/regions";
import { loadBestTime } from "../../hooks/useBestTime";
import type { GameMode } from "../../types/puzzle";
import { formatClock } from "../../utils/timeFormat";

type RegionSelectProps = {
  title: string;
  description: string;
  mode: GameMode;
  includeNational?: boolean;
  onSelectRegion: (regionId: string) => void;
  onSelectNational?: () => void;
  onBack: () => void;
};

export function RegionSelect({
  title,
  description,
  mode,
  includeNational = false,
  onSelectRegion,
  onSelectNational,
  onBack
}: RegionSelectProps) {
  const nationalBest = includeNational ? loadBestTime(mode) : null;

  return (
    <main className="select-screen">
      <div className="select-heading">
        <div>
          <p className="hero-kicker">スモールステップ学習</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <button type="button" className="ghost-button" onClick={onBack}>
          戻る
        </button>
      </div>

      <section className="region-grid" aria-label="地方を選ぶ">
        {includeNational && onSelectNational ? (
          <button type="button" className="region-card national-card" onClick={onSelectNational}>
            <strong>全国</strong>
            <span>47問</span>
            <small>{nationalBest ? `ベスト ${formatClock(nationalBest.bestTimeSeconds)}` : "全国で挑戦"}</small>
          </button>
        ) : null}
        {regions.map((region) => {
          const best = loadBestTime(mode, region.id);
          return (
            <button key={region.id} type="button" className="region-card" onClick={() => onSelectRegion(region.id)}>
              <strong>{region.name}</strong>
              <span>{region.prefectureIds.length}都道府県</span>
              <small>{best ? `ベスト ${formatClock(best.bestTimeSeconds)}` : "記録なし"}</small>
            </button>
          );
        })}
      </section>
    </main>
  );
}
