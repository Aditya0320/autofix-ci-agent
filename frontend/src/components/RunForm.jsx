import { useState } from "react";
import { useApp } from "../context/AppContext";

const DEFAULT_TEAM_NAME = "TEAM ETS";
const DEFAULT_LEADER_NAME = "DEEPAK MASEEH";

export function RunForm() {
  const { apiBaseUrl, setRunStatus, startPolling, stopPolling, runStatus } = useApp();
  const [repoUrl, setRepoUrl] = useState("");
  const [teamName, setTeamName] = useState(DEFAULT_TEAM_NAME);
  const [leaderName, setLeaderName] = useState(DEFAULT_LEADER_NAME);
  const isRunning = runStatus === "running";

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = repoUrl.trim();
    const team = teamName.trim() || DEFAULT_TEAM_NAME;
    const leader = leaderName.trim() || DEFAULT_LEADER_NAME;
    if (!url) return;

    const base = apiBaseUrl.replace(/\/$/, "");
    setRunStatus("running");

    try {
      const res = await fetch(`${base}/api/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: url,
          teamName: team,
          leaderName: leader,
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
      <h2 className="card-title card-title-with-icon">
        <svg className="card-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        Start a run
      </h2>
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
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="e.g. RIFT ORGANISERS"
          disabled={isRunning}
        />
      </div>
      <div className="form-row">
        <label htmlFor="leaderName">Leader Name</label>
        <input
          id="leaderName"
          type="text"
          value={leaderName}
          onChange={(e) => setLeaderName(e.target.value)}
          placeholder="e.g. Saiyam Kumar"
          disabled={isRunning}
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
