import { endpoints } from "@/lib/endpoints";
// TODO: Non-JSON response validation
// Currently non-JSON responses (HTML, XML, text) are detected and reported
// but content is not validated. When non-JSON endpoints are added,
// implement expectedContent validation with format-specific parsers.
async function getAuthToken() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  try {
    const res = await fetch(process.env.AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: process.env.AUTH_IDENTIFIER,
        password: process.env.AUTH_PASSWORD,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    console.log("Token received:", data.jwt ? "yes" : "no");
    return data.jwt;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function parseResponse(res) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return { data: await res.json(), type: "json", error: null };
    } catch (e) {
      return { data: null, type: "json", error: "Failed to parse JSON" };
    }
  }

  if (contentType.includes("text/html")) {
    const text = await res.text();
    return { data: text, type: "html", error: "Response is HTML not JSON" };
  }

  if (contentType.includes("text/plain")) {
    const text = await res.text();
    return { data: text, type: "text", error: null };
  }

  if (
    contentType.includes("application/xml") ||
    contentType.includes("text/xml")
  ) {
    const text = await res.text();
    return { data: text, type: "xml", error: null };
  }

  try {
    const text = await res.text();
    return {
      data: text,
      type: "unknown",
      error: `Unknown content type: ${contentType}`,
    };
  } catch (e) {
    return { data: null, type: "unknown", error: "Could not read response" };
  }
}

async function fetchWithRetry(url, options, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`Retrying ${url} (attempt ${i + 2}/${retries})`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

async function runInBatches(items, batchSize, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const selectedGroup = body.group || null;
  const token = await getAuthToken();

  const filteredEndpoints = selectedGroup
    ? endpoints.filter((e) => e.group === selectedGroup)
    : endpoints;

  const results = await runInBatches(filteredEndpoints, 5, async (endpoint) => {
    try {
      const startTime = Date.now();
      const res = await fetchWithRetry(endpoint.url, {
        method: endpoint.method || "GET",
        signal: AbortSignal.timeout(35000),
        headers: {
          "Cache-Control": "no-cache",
          "Content-Type": "application/json",
          ...(endpoint.requiresAuth
            ? { Authorization: `Bearer ${token}` }
            : {}),
        },
        body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
      });
      const responseTime = Date.now() - startTime;
      console.log(`${endpoint.name}: ${responseTime}ms`);

      const { data, type, error: parseError } = await parseResponse(res);

      if (parseError || type !== "json") {
        return {
          name: endpoint.name,
          url: endpoint.url,
          passed: res.status === endpoint.expectedStatus,
          statusCode: res.status,
          responseType: type,
          responseTime,
          slow: responseTime > 3000,
          error: parseError,
          missingFields: [],
          typeErrors: [],
          emptyError: null,
          nestedErrors: [],
        };
      }

      const passed = res.status === endpoint.expectedStatus;
      const firstItem = Array.isArray(data) ? data[0] : data;

      const missingFields = endpoint.expectedFields.filter(
        (field) => !(field in firstItem),
      );
      const fieldsPassed = missingFields.length === 0;

      const typeErrors = Object.entries(endpoint.expectedTypes || {})
        .filter(([field, type]) => typeof firstItem[field] !== type)
        .map(
          ([field, type]) =>
            `${field} should be ${type} but got ${typeof firstItem[field]}`,
        );
      const typesPassed = typeErrors.length === 0;

      const emptyError =
        endpoint.expectNonEmpty &&
        Array.isArray(data.data) &&
        data.data.length === 0
          ? "Expected non-empty data array but got empty"
          : null;

      const firstDataItem = Array.isArray(data.data) ? data.data[0] : null;
      const nestedErrors =
        firstDataItem && endpoint.nestedFields
          ? Object.entries(endpoint.nestedFields)
              .filter(([field, type]) => typeof firstDataItem[field] !== type)
              .map(
                ([field, type]) =>
                  `data[0].${field} should be ${type} but got ${typeof firstDataItem[field]}`,
              )
          : [];

      const contentPassed = !emptyError && nestedErrors.length === 0;

      return {
        name: endpoint.name,
        url: endpoint.url,
        passed: passed && fieldsPassed && typesPassed && contentPassed,
        statusCode: res.status,
        responseType: type,
        responseTime,
        slow: responseTime > 3000,
        missingFields,
        typeErrors,
        emptyError,
        nestedErrors,
      };
    } catch (err) {
      return {
        name: endpoint.name,
        url: endpoint.url,
        passed: false,
        error: err.message,
        responseTime: null,
        slow: false,
        missingFields: [],
        typeErrors: [],
        emptyError: null,
        nestedErrors: [],
      };
    }
  });

  console.log("Test results:", JSON.stringify(results, null, 2));

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
