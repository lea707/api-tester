import { endpoints } from "@/lib/endpoints";

export async function POST() {
  const results = await Promise.all(
    endpoints.map(async (endpoint) => {
      try {
        const res = await fetch(endpoint.url, {
          signal: AbortSignal.timeout(5000),
        });
        const data = await res.json();

        const passed = res.status === endpoint.expectedStatus;
        const firstItem = Array.isArray(data) ? data[0] : data;
        const missingFields = endpoint.expectedFields.filter(
          (field) => !(field in firstItem),
        );
        const fieldsPassed = missingFields.length === 0;

        return {
          name: endpoint.name,
          url: endpoint.url,
          passed: passed && fieldsPassed,
          statusCode: res.status,
          missingFields,
        };
      } catch (err) {
        return {
          name: endpoint.name,
          url: endpoint.url,
          passed: false,
          error: err.message,
        };
      }
    }),
  );
  const report = {
    id: Date.now(),
    runAt: new Date().toISOString(),
    passed: results.every((r) => r.passed),
    results,
  };

  const strapiRes = await fetch(`${process.env.STRAPI_URL}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: {
        runAt: report.runAt,
        passed: report.passed,
        results: report.results,
        summary: `${results.filter((r) => r.passed).length}/${results.length} passed`,
      },
    }),
  });
  const strapiData = await strapiRes.json();
  console.log("Strapi save response:", strapiData);

  return Response.json(report);
}
