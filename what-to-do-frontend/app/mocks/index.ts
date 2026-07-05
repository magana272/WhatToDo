export function setupMocks() {
  if (
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_API_MOCKS === "true"
  ) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { installMockFetch } = require("./handlers");
    installMockFetch();
  }
}