import { useState } from "react";
import { useApp } from "../context/AppContext";

const TEAM_NAME = "TEAM ETS";
const LEADER_NAME = "DEEPAK MASEEH";

export function RunForm() {
  const { apiBaseUrl, setRunStatus, startPolling, stopPolling, runStatus } = useApp();
  const [repoUrl, setRepoUrl] = useState("");
  const isRunning = runStatus === "running";

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = repoUrl.trim();
    if (!url) return;

    const base = apiBaseUrl.replace(/\/$/, "");
    setRunStatus("running");

    try {
      const res = await fetch(`${base}/api/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: url,
          teamName: TEAM_NAME,
          leaderName: LEADER_NAME,
        }),
      });
      if (res.ok) {
        startPolling();
      } else {
        setRunStatus("failed");
        stopPolling();
      }
    } catch {
      setRunStatus("failed");
      stopPolling();
    }
  };

  return (
    <form className="run-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label htmlFor="repoUrl">GitHub Repository URL</label>
        <input
          id="repoUrl"
          type="url"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          required
          disabled={isRunning}
        />
      </div>
      <div className="form-row">
        <label htmlFor="teamName">Team Name</label>
        <input
          id="teamName"
          type="text"
          value={TEAM_NAME}
          readOnly
          aria-readonly="true"
        />
      </div>
      <div className="form-row">
        <label htmlFor="leaderName">Leader Name</label>
        <input
          id="leaderName"
          type="text"
          value={LEADER_NAME}
          readOnly
          aria-readonly="true"
        />
      </div>
      <div className="form-actions">
        <button type="submit" disabled={isRunning}>
          {isRunning ? "Running…" : "Run Agent"}
        </button>
      </div>
    </form>
  );
}
