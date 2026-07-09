export const endpoints = [
  {
    name: "Get Users",
    url: `${process.env.TEST_API_BASE}/users`,
    expectedStatus: 200,
    expectedFields: ["id", "name", "email"],
  },
  {
    name: "Get All Posts",
    url: `${process.env.TEST_API_BASE}/posts`,
    expectedStatus: 200,
    expectedFields: ["id", "title", "body", "userId"],
  },
  {
    name: "Get Single Post",
    url: `${process.env.TEST_API_BASE}/posts/1`,
    expectedStatus: 200,
    expectedFields: ["id", "title", "body", "userId"],
  },
  {
    name: "Get Post Comments",
    url: `${process.env.TEST_API_BASE}/posts/1/comments`,
    expectedStatus: 200,
    expectedFields: ["id", "name", "email", "body"],
  },
  {
    name: "Get Non-existent Post",
    url: `${process.env.TEST_API_BASE}/posts/999`,
    expectedStatus: 404,
    expectedFields: [],
  },
];
