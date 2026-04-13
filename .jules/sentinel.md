## 2025-02-24 - Do not leak internal server details to users in controllers

**Vulnerability:** Controller layer was leaking internal server details (e.g. `error.message` of generic exceptions like database connection errors) to end-users by manually returning them as HTTP 500 error messages instead of letting the `GlobalExceptionFilter` sanitize them.
**Learning:** Generic errors in controllers should be directly thrown to rely on a centralized exception filter (`GlobalExceptionFilter`) that ensures uniform handling and prevents leaking internal details (like query syntax, sensitive configurations, etc.) to potential attackers.
**Prevention:** In NestJS controllers, manually mapping `error instanceof Error ? error.message : 'Internal server error'` for 500 statuses should be avoided. Any unhandled or generic exception should be simply re-thrown, relying on a global filter to log the error and return a sanitized "Internal server error" message.
