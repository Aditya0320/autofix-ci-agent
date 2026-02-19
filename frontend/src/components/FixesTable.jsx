import { useApp } from "../context/AppContext";

export function FixesTable() {
  const { results } = useApp();
  if (!results) return null;
  if (!Array.isArray(results.fixes)) return null;

  const fixes = results.fixes;
  const hasFixes = fixes.length > 0;

  const emptyStateIcon = (
    <svg className="fixes-empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );

  return (
    <section className="fixes-table-card">
      <h2 className="card-title card-title-with-icon">
        <svg className="card-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
        Fixes Applied
      </h2>
      {!hasFixes ? (
        <div className="fixes-empty-state">
          {emptyStateIcon}
          <p className="fixes-empty-state-title">All clear</p>
          <p className="fixes-empty-state-desc">No fixes were applied in this run. Pipeline passed without changes.</p>
        </div>
      ) : (
        <div className="fixes-table-wrap">
          <table className="fixes-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Bug Type</th>
                <th>Line Number</th>
                <th>Commit Message</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {fixes.map((fix, i) => {
                const isFailed = fix.status === "failed" || fix.status === "FAILED";
                return (
                  <tr key={i}>
                    <td>{fix.file ?? "—"}</td>
                    <td>{fix.bugType ?? "—"}</td>
                    <td>{fix.line ?? "—"}</td>
                    <td>{fix.commitMessage ?? fix.fixDescription ?? "—"}</td>
                    <td>
                      <span className={`fix-status ${isFailed ? "fix-status-failed" : "fix-status-fixed"}`}>
                        {isFailed ? "✗ Failed" : "✓ Fixed"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
