import type { CSSProperties, ReactNode } from "react";
import { getRegionColor } from "../../data/regionColors";
import { regions } from "../../data/regions";
import { loadBestTime } from "../../hooks/useBestTime";
import type { GameMode } from "../../types/puzzle";
import { formatClock } from "../../utils/timeFormat";

type ExtraRegionCard = {
  emoji: string;
  label: string;
  title: ReactNode;
  description: ReactNode;
  meta: string;
  onClick: () => void;
  mode?: GameMode;
};

type RegionSelectProps = {
  title: ReactNode;
  description: ReactNode;
  mode: GameMode;
  includeNational?: boolean;
  extraCards?: ExtraRegionCard[];
  onSelectRegion: (regionId: string) => void;
  onSelectNational?: () => void;
  onBack: () => void;
};

function regionCardStyle(regionId: string): CSSProperties {
  const color = getRegionColor(regionId);
  return {
    "--card-accent": color.main,
    "--region-main": color.main,
    "--region-soft": color.soft,
    "--region-ink": color.ink
  } as CSSProperties;
}

export function RegionSelect({
  title,
  description,
  mode,
  includeNational = false,
  extraCards = [],
  onSelectRegion,
  onSelectNational,
  onBack
}: RegionSelectProps) {
  const nationalBest = includeNational ? loadBestTime(mode) : null;

  return (
    <main className="select-screen">
      <div className="select-heading">
        <div>
          <p className="hero-kicker">少しずつ学ぶ</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <button type="button" className="ghost-button" onClick={onBack}>
          もどる
        </button>
      </div>

      <section className="region-grid" aria-label="地方を選ぶ">
        {includeNational && onSelectNational ? (
          <button type="button" className="region-card national-card" onClick={onSelectNational}>
            <span className="region-card-top">
              <span className="region-emoji" aria-hidden="true">
                🗾
              </span>
              <span className="region-pill">ぜんぶ</span>
            </span>
            <strong>全国</strong>
            <span>47問</span>
            <small>{nationalBest ? `ベスト ${formatClock(nationalBest.bestTimeSeconds)}` : "全国でちょうせん"}</small>
          </button>
        ) : null}
        {extraCards.map((card) => {
          const best = card.mode ? loadBestTime(card.mode) : null;
          return (
            <button key={card.label} type="button" className="region-card special-card" onClick={card.onClick}>
              <span className="region-card-top">
                <span className="region-emoji" aria-hidden="true">
                  {card.emoji}
                </span>
                <span className="region-pill">{card.label}</span>
              </span>
              <strong>{card.title}</strong>
              <span>{card.description}</span>
              <small>{best ? `ベスト ${formatClock(best.bestTimeSeconds)}` : card.meta}</small>
            </button>
          );
        })}
        {regions.map((region) => {
          const best = loadBestTime(mode, region.id);
          return (
            <button
              key={region.id}
              type="button"
              className="region-card"
              style={regionCardStyle(region.id)}
              onClick={() => onSelectRegion(region.id)}
            >
              <span className="region-card-top">
                <span className="region-emoji" aria-hidden="true">
                  ●
                </span>
                <span className="region-pill">{region.prefectureIds.length}問</span>
              </span>
              <strong>{region.name}</strong>
              <span>{region.prefectureIds.length}都道府県</span>
              <small>{best ? `ベスト ${formatClock(best.bestTimeSeconds)}` : "きろくなし"}</small>
            </button>
          );
        })}
      </section>
    </main>
  );
}
