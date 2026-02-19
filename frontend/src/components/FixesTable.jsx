import { useApp } from "../context/AppContext";

export function FixesTable() {
  const { results } = useApp();
  if (!results) return null;
  if (!Array.isArray(results.fixes)) return null;

  const fixes = results.fixes;
  const hasFixes = fixes.length > 0;

  return (
    <section className="fixes-table-card">
      <h2 className="card-title">Fixes Applied</h2>
      {!hasFixes ? (
        <p className="fixes-empty">No fixes were applied in this run.</p>
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
              {fixes.map((fix, i) => (
                <tr key={i}>
                  <td>{fix.file ?? "—"}</td>
                  <td>{fix.bugType ?? "—"}</td>
                  <td>{fix.line ?? "—"}</td>
                  <td>{fix.commitMessage ?? fix.fixDescription ?? "—"}</td>
                  <td>
                    <span className="fix-status fix-status-fixed">
                      ✓ Fixed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
