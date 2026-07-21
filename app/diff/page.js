export default async function DiffPage() {
  const json = await fetch(
    `${process.env.STRAPI_URL}/api/reports?sort=createdAt:desc&pagination[pageSize]=2`,
    { cache: "no-store" },
  ).then((res) => res.json());

  const reports = json.data;

  if (!reports || reports.length < 2) {
    return <div>Not enough reports to compare. Run tests at least twice.</div>;
  }

  const latest = reports[0];
  const previous = reports[1];

  // map returns plain objects — NOT JSX
  const diff = latest.results.map((latestResult, index) => {
    const prevResult = previous.results[index];

    if (!prevResult) {
      return {
        name: latestResult.name,
        wasPass: null,
        nowPass: latestResult.passed,
        changed: true,
        wasTime: null,
        nowTime: latestResult.responseTime,
        slowerBy: 0,
        isNew: true,
      };
    }

    return {
      name: latestResult.name,
      wasPass: prevResult.passed,
      nowPass: latestResult.passed,
      changed: prevResult.passed !== latestResult.passed,
      wasTime: prevResult.responseTime,
      nowTime: latestResult.responseTime,
      slowerBy:
        (latestResult.responseTime || 0) - (prevResult.responseTime || 0),
      isNew: false,
    };
  }); // map ends here

  // filters use the diff array — after map closes
  const regressions = diff.filter((d) => d.wasPass && !d.nowPass);
  const fixed = diff.filter((d) => !d.wasPass && d.nowPass);
  const slower = diff.filter((d) => d.slowerBy > 1000);

  // JSX return is the component return — outside everything
  return (
    <div className="page diff-page">
      <h1>Diff Report</h1>
      <div className="diff-summary">
        <p>
          <strong>Latest:</strong> {new Date(latest.runAt).toLocaleString()}
        </p>
        <p>
          <strong>Previous:</strong> {new Date(previous.runAt).toLocaleString()}
        </p>
      </div>

      {regressions.length > 0 && (
        <div className="diff-section">
          <h2>Regressions ({regressions.length})</h2>
          {regressions.map((d) => (
            <div key={d.name} className="diff-item">
              <p>
                <span className="diff-status failed">Failing</span> {d.name} —
                was passing, now failing
              </p>
            </div>
          ))}
        </div>
      )}

      {fixed.length > 0 && (
        <div className="diff-section">
          <h2>Fixed ({fixed.length})</h2>
          {fixed.map((d) => (
            <div key={d.name} className="diff-item">
              <p>
                <span className="diff-status passed">Passing</span> {d.name} —
                was failing, now passing
              </p>
            </div>
          ))}
        </div>
      )}

      {slower.length > 0 && (
        <div className="diff-section">
          <h2>⚠️ Slower ({slower.length})</h2>
          {slower.map((d) => (
            <div key={d.name} className="diff-item">
              <p>
                <span className="diff-status warning">Slower</span> {d.name} —
                was {d.wasTime}ms, now {d.nowTime}ms (+{d.slowerBy}ms)
              </p>
            </div>
          ))}
        </div>
      )}

      {regressions.length === 0 &&
        fixed.length === 0 &&
        slower.length === 0 && (
          <p className="diff-empty">
            No changes detected between the two most recent runs.
          </p>
        )}

      <div className="diff-section">
        <h2>All Endpoints</h2>
        {diff.map((d) => (
          <div key={d.name} className="diff-item">
            <p>
              {d.isNew ? <span className="diff-status warning">New</span> : ""}{" "}
              {d.name} —{" "}
              <span
                className={`diff-status ${
                  d.changed
                    ? d.nowPass
                      ? "passed"
                      : "failed"
                    : d.nowPass
                      ? "passed"
                      : "failed"
                }`}
              >
                {d.changed
                  ? d.nowPass
                    ? "Fixed"
                    : "Regression"
                  : d.nowPass
                    ? "Passing"
                    : "Failing"}
              </span>
              {d.wasTime && d.nowTime
                ? ` | ${d.wasTime}ms → ${d.nowTime}ms`
                : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
