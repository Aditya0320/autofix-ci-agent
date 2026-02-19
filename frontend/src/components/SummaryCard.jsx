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
      <h2 className="card-title card-title-with-icon">
        <svg className="card-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        Run Summary
      </h2>
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
