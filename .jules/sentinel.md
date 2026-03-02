## 2026-03-02 - NestJS Overly Permissive CORS Configuration
**Vulnerability:** The NestJS `main.ts` entry point used `app.enableCors()` with no arguments, which defaults to allowing requests from any origin (`Access-Control-Allow-Origin: *`). This is an overly permissive configuration that opens the API to unauthorized cross-origin requests.
**Learning:** Default configuration for CORS in NestJS exposes the application to unnecessary security risks, particularly when cookies or authentication headers are involved. It should always be explicitly bounded.
**Prevention:** Always restrict CORS origins using a predefined list or an environment variable (`process.env.ALLOWED_ORIGINS`). Configure `methods` and `credentials` appropriately instead of relying on defaults.
