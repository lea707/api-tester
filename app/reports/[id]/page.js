import Link from "next/link";
export default async function Report({ params }) {
  const { id } = await params;
  const json = await fetch(`http://localhost:1337/api/reports/${id}`).then(
    (res) => res.json(),
  );

  const report = json.data;

  return (
    <div className="page">
      <h1>API Test Result</h1>
      {!report && <p>No report found.</p>}
      {report &&
        report.results.map((result, index) => (
          <div key={index} className="card">
            <h3>{result.name}</h3>
            <p>URL: {result.url}</p>
            <p>Passed: {result.passed ? "Yes" : "No"}</p>
            {result.statusCode && <p>Status Code: {result.statusCode}</p>}
            {result.error && <p>Error: {result.error}</p>}
          </div>
        ))}
      <div className="actions">
        <Link href="/reports">
          <button>Back</button>
        </Link>
      </div>
    </div>
  );
}
