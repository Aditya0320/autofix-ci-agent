import { useApp } from "../context/AppContext";

const BRANCH_NAME = "TEAM_ETS_DEEPAK_MASEEH_AI_Fix";
const TEAM_NAME = "TEAM ETS";
const LEADER_NAME = "DEEPAK MASEEH";

function formatDurationSeconds(startedAt, completedAt) {
  if (!startedAt || !completedAt) return "—";
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const sec = Math.round((end - start) / 1000);
  return `${sec} s`;
}

export function SummaryCard() {
  const { results } = useApp();
  if (!results) return null;

  const totalFixes = results.summary?.totalFixes ?? 0;
  const statusLabel =
    results.status === "completed" ? "PASSED" : "FAILED";

  return (
    <section className="summary-card">
      <h2 className="card-title">Run Summary</h2>
      <dl className="summary-list">
        <div className="summary-row">
          <dt>Repository URL</dt>
          <dd>{results.repoUrl || "—"}</dd>
        </div>
        <div className="summary-row">
          <dt>Team Name</dt>
          <dd>{TEAM_NAME}</dd>
        </div>
        <div className="summary-row">
          <dt>Leader Name</dt>
          <dd>{LEADER_NAME}</dd>
        </div>
        <div className="summary-row">
          <dt>Branch Name</dt>
          <dd><code>{BRANCH_NAME}</code></dd>
        </div>
        <div className="summary-row">
          <dt>Total fixes applied</dt>
          <dd>{totalFixes}</dd>
        </div>
        <div className="summary-row">
          <dt>Final CI/CD status</dt>
          <dd>
            <span className={`status-badge status-${statusLabel.toLowerCase()}`}>
              {statusLabel}
            </span>
          </dd>
        </div>
        <div className="summary-row">
          <dt>Total time</dt>
          <dd>{formatDurationSeconds(results.startedAt, results.completedAt)}</dd>
        </div>
      </dl>
    </section>
  );
}
