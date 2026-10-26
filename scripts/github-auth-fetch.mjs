// Preloaded via NODE_OPTIONS=--import. The upstream generator calls
// api.github.com anonymously, and shared runner IPs regularly exhaust the
// 60 requests/hour anonymous limit, so attach the workflow token to those calls.
const token = process.env.GITHUB_TOKEN;

if (token) {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (input, init = {}) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

        if (!url.startsWith("https://api.github.com/")) {
            return originalFetch(input, init);
        }

        const headers = new Headers(init.headers ?? (input instanceof Request ? input.headers : undefined));
        if (!headers.has("authorization")) {
            headers.set("authorization", `Bearer ${token}`);
        }

        return originalFetch(input, { ...init, headers });
    };
}
