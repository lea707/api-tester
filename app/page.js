"use client";
import { useState } from "react";
export default function Home() {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  function runTests() {
    setLoading(true);
    fetch("/api/run-tests", { method: "POST" })
      .then((res) => res.json())
      .then((data) => setTestResults(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  return (
    <div>
      <button onClick={runTests}>Run Tests</button>
      {loading && <p>Running tests...</p>}
      {error && <p>Error: {error}</p>}
      <div>
        Results:
        {testResults && testResults.results
          ? testResults.results.map((result) => (
              <div key={result.name}>
                <h2>{result.name}</h2>
                <p>URL: {result.url}</p>
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
              </div>
            ))
          : "No results yet."}
      </div>
      <button onClick={() => (window.location.href = "./reports")}>
        View All Reports
      </button>
    </div>
  );
}
