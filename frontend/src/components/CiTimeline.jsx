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
  const timeline = results?.ciTimeline;
  if (!timeline || !Array.isArray(timeline)) return null;

  const maxRetries = results?.maxRetries ?? timeline.length;

  return (
    <section className="ci-timeline-card">
      <h2 className="card-title">CI/CD Status Timeline</h2>
      <ul className="ci-timeline-list">
        {timeline.map((entry, i) => (
          <li key={i} className="ci-timeline-item">
            <span className="ci-timeline-iteration">
              Iteration {entry.iteration} / {maxRetries}
            </span>
            <span
              className={`status-badge status-${(entry.status || "").toLowerCase()}`}
            >
              {entry.status ?? "—"}
            </span>
            <span className="ci-timeline-time">
              {formatTimestamp(entry.timestamp)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
