import { useApp } from "../context/AppContext";

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
          <dd>{results.teamName ?? "—"}</dd>
        </div>
        <div className="summary-row">
          <dt>Leader Name</dt>
          <dd>{results.leaderName ?? "—"}</dd>
        </div>
        <div className="summary-row">
          <dt>Branch Name</dt>
          <dd><code>{results.branch ?? "—"}</code></dd>
        </div>
        {results.summary?.totalFailuresDetected != null && (
          <div className="summary-row">
            <dt>Total failures detected</dt>
            <dd>{results.summary.totalFailuresDetected}</dd>
          </div>
        )}
        <div className="summary-row">
          <dt>Total fixes applied</dt>
          <dd>
            {totalFixes}
            {results.status === "completed" &&
              (results.fixes?.length ?? 0) === 0 && (
                <p className="summary-info-note">
                  No issues were detected in this repository. The pipeline
                  completed successfully on the first iteration.
                </p>
              )}
          </dd>
        </div>
        {results.error && (
          <div className="summary-row">
            <dt>Run error</dt>
            <dd>
              <p className="summary-error-note">{results.error}</p>
            </dd>
          </div>
        )}
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
