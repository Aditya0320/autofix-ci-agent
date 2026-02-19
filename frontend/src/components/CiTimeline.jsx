import { useApp } from "../context/AppContext";

function formatTimestamp(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "medium",
    });
  } catch {
    return iso;
  }
}

export function CiTimeline() {
  const { results } = useApp();
  const timeline = results && Array.isArray(results.ciTimeline) ? results.ciTimeline : [];
  const iterationsUsed = results?.iterationsUsed ?? 0;
  const maxRetries = results?.maxRetries ?? 5;
  const hasResults = results != null;
  if (!hasResults) return null;

  const statusLower = (s) => (s || "").toLowerCase();
  const CheckIcon = () => (
    <svg className="ci-timeline-status-icon passed" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
  const XIcon = () => (
    <svg className="ci-timeline-status-icon failed" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );

  return (
    <section className="ci-timeline-card">
      <h2 className="card-title card-title-with-icon">
        <svg className="card-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        CI/CD Status Timeline
      </h2>
      <p className="ci-timeline-summary">
        Iterations used: <strong>{iterationsUsed}/{maxRetries}</strong>
      </p>
      <ul className="ci-timeline-list">
        {timeline.length === 0 ? (
          <li className="ci-timeline-item ci-timeline-empty">No CI runs recorded for this execution.</li>
        ) : timeline.map((entry, i) => {
          const status = statusLower(entry.status);
          return (
            <li key={i} className={`ci-timeline-item status-${status}`}>
              <span className="ci-timeline-iteration">
                Iteration {entry.iteration} / {maxRetries}
              </span>
              {status === "passed" ? <CheckIcon /> : status === "failed" ? <XIcon /> : null}
              <span className={`status-badge status-${status}`}>
                {entry.status ?? "—"}
              </span>
              <span className="ci-timeline-time">
                {formatTimestamp(entry.timestamp)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
