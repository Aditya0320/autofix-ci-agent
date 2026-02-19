import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";

const STATUS_STEPS = [
  "Cloning repository…",
  "Analyzing codebase…",
  "Detecting failures…",
  "Applying fixes…",
  "Running CI/CD iteration…",
];
const CYCLE_MS = 2000;

export function RunProgress() {
  const { runStatus } = useApp();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (runStatus !== "running") return;
    const id = setInterval(() => {
      setStepIndex((i) => (i + 1) % STATUS_STEPS.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [runStatus]);

  if (runStatus !== "running") return null;

  return (
    <section className="run-progress-card" aria-live="polite" aria-busy="true">
      <h2 className="card-title">Agent is running</h2>
      <p className="run-progress-status">{STATUS_STEPS[stepIndex]}</p>
      <div className="run-progress-track" role="progressbar" aria-valuetext="In progress">
        <div className="run-progress-bar" />
      </div>
    </section>
  );
}
