import Link from "next/link";
export default async function Reports() {
  const json = await fetch(
    "http://localhost:1337/api/reports?sort=createdAt:desc",
  ).then((res) => res.json());

  const reports = json.data;

  return (
    <div>
      <h1>API Test Reports</h1>
      {reports.length === 0 && <p>No reports yet.</p>}
      {reports.map((report) => (
        <div key={report.id}>
          <h2>{report.runAt}</h2>
          <p>Status: {report.passed ? "All Passed" : "Some Failed"}</p>
          <p>Summary: {report.summary}</p>
          <Link href={`/reports/${report.documentId}`}>
            <button>View Detailed Results</button>
          </Link>
        </div>
      ))}
    </div>
  );
}
