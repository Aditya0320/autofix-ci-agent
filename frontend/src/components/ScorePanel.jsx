import { useApp } from "../context/AppContext";

const MAX_SCORE = 110;

export function ScorePanel() {
  const { results } = useApp();
  const score = results?.score;
  if (!score) return null;

  const baseScore = score.baseScore ?? 0;
  const speedBonus = score.speedBonus ?? 0;
  const efficiencyPenalty = score.efficiencyPenalty ?? 0;
  const finalScore = score.finalScore ?? 0;
  const pct = Math.min(100, Math.max(0, (finalScore / MAX_SCORE) * 100));

  return (
    <section className="score-panel">
      <h2 className="card-title card-title-with-icon">
        <svg className="card-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
        Score
      </h2>
      <div className="score-breakdown">
        <div className="score-row">
          <span>Base score</span>
          <span>{baseScore}</span>
        </div>
        <div className="score-row">
          <span>Speed bonus</span>
          <span className="score-positive">+{speedBonus}</span>
        </div>
        <div className="score-row">
          <span>Efficiency penalty</span>
          <span className="score-negative">−{efficiencyPenalty}</span>
        </div>
      </div>
      <div className="score-hero-wrap">
        <div className="score-hero-ring" style={{ "--score-pct": String(pct) }} aria-hidden="true">
          <span className="score-hero-value">{finalScore}</span>
        </div>
      </div>
      <div className="final-score">
        <span className="final-score-label">FINAL SCORE</span>
        <span className="final-score-value">{finalScore}</span>
      </div>
      <div className="score-progress" role="progressbar" aria-valuenow={finalScore} aria-valuemin={0} aria-valuemax={MAX_SCORE}>
        <div className="score-progress-bar" style={{ width: `${pct}%` }} />
      </div>
    </section>
  );
}
