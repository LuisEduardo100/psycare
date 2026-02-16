
// Import with `import * as Sentry from "@sentry/node"` if you are using ESM
import * as Sentry from "@sentry/node";
// import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
    dsn: "https://8ca34d8c730f862f7956b86dd0f7cdf2@o4508795740553216.ingest.us.sentry.io/4508795744813058",
    integrations: [
        // nodeProfilingIntegration(),
    ],
    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    sendDefaultPii: true,
});
