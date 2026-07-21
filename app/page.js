"use client";
import { useState } from "react";

const groups = [
  "All",
  "Homepage",
  "Article",
  "Categories",
  "Search",
  "All Articles",
  "Author",
];

export default function Home() {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState("All");

  function runTests() {
    setLoading(true);
    fetch("/api/run-tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        group: selectedGroup === "All" ? null : selectedGroup,
      }),
    })
      .then((res) => res.json())
      .then((data) => setTestResults(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  return (
    <div className="page">
      <div className="actions">
        <div className="filter-row">
          {groups.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => setSelectedGroup(group)}
              className={`group-button${
                selectedGroup === group ? " selected" : ""
              }`}
            >
              {group}
            </button>
          ))}
        </div>
        <div className="action-row">
          <button type="button" onClick={runTests}>
            Run Tests
          </button>
          <button
            type="button"
            onClick={() => (window.location.href = "./reports")}
          >
            View All Reports
          </button>
          <button
            type="button"
            onClick={() => (window.location.href = "./diff")}
          >
            Compare with Previous
          </button>
        </div>
      </div>

      {loading && <p>Running tests...</p>}
      {error && <p>Error: {error}</p>}

      <div className="card">
        <h2>Results {selectedGroup !== "All" ? `— ${selectedGroup}` : ""}</h2>
        <div className="result-list">
          {testResults && testResults.results
            ? testResults.results.map((result) => (
                <div key={result.name} className="card result-card">
                  <h3>{result.name}</h3>
                  <p className="result-url">URL: {result.url}</p>
                  <p>Passed: {result.passed ? "Yes" : "No"}</p>
                  <p>Status Code: {result.statusCode}</p>
                  <p>Missing Fields: {result.missingFields?.length ?? 0}</p>
                  <p>Type Errors: {result.typeErrors?.length ?? 0}</p>
                  {result.typeErrors?.length > 0 && (
                    <ul>
                      {result.typeErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                  <p style={{ color: result.slow ? "red" : "inherit" }}>
                    Response Time: {result.responseTime}ms{" "}
                    {result.slow ? "⚠️ Slow" : ""}
                  </p>
                </div>
              ))
            : "No results yet."}
        </div>
      </div>
    </div>
  );
}
