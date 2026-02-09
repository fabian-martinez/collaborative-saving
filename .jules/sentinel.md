## 2024-05-22 - [Information Leakage in NestJS Exception Filter]
**Vulnerability:** The default implementation of `GlobalExceptionFilter` was leaking raw error messages (including stack traces or database details) to the client in 500 responses.
**Learning:** NestJS exception filters can inadvertently expose sensitive internal state if they simply pass `exception.message` to the response body for unknown errors.
**Prevention:** Always catch generic `Error` types in global filters and return a sanitized "Internal server error" message to the client, while logging the full details on the server side.
