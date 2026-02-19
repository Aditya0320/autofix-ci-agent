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
      <h2 className="card-title">Score</h2>
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
