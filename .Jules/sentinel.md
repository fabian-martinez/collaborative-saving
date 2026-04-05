## 2024-03-23 - Overly Permissive CORS Configuration
**Vulnerability:** The backend application had a globally permissive CORS configuration allowing any domain to perform cross-origin requests.
**Learning:** This exposes the application to unauthorized interactions and potential Cross-Site Request Forgery attacks from malicious domains if proper authentication is missing or token-based without SameSite cookie restrictions.
**Prevention:** Always restrict CORS explicitly using an environment variable (e.g. ALLOWED_ORIGINS) that can define the allowed domains. In development, restrict it to known local client URLs.
