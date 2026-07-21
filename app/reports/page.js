import Link from "next/link";
export default async function Reports() {
  const json = await fetch(
    "http://localhost:1337/api/reports?sort=createdAt:desc",
    { cache: "no-store" },
  ).then((res) => res.json());
  const reports = json.data;

  return (
    <div className="page">
      <h1>API Test Reports</h1>
      {reports.length === 0 && <p>No reports yet.</p>}
      {reports.map((report) => (
        <div key={report.id} className="card report-card">
          <h2>{new Date(report.runAt).toLocaleString()}</h2>
          <p className={`report-status ${report.passed ? "passed" : "failed"}`}>
            {report.passed ? "Passed" : "Failed"}
          </p>
          <p className="report-summary">Summary: {report.summary}</p>
          <div className="actions">
            <Link href={`/reports/${report.documentId}`}>
              <button>View Detailed Results</button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
