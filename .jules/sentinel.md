## 2024-05-14 - Fix overly permissive CORS and missing strict input validation
**Vulnerability:** CORS was overly permissive, allowing all origins, and input validation was missing `forbidNonWhitelisted: true`, allowing potentially malicious fields to be passed into the API.
**Learning:** These are critical security issues that need to be addressed to prevent cross-site scripting (XSS) and other types of attacks.
**Prevention:** Ensure that CORS is explicitly configured with a whitelist of allowed origins and that input validation is strict, rejecting non-whitelisted fields.
