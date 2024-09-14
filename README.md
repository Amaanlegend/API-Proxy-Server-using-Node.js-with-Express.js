## API-Proxy-Server-using-Node.js-with-Express.js

This Node.js application is a simple API proxy server that implements rate limiting, caching, logging, and basic authentication.

## Features:

- Rate Limiting: Limits to 5 requests per minute per IP.
- Caching: Caches successful responses for 5 minutes.
- Error Handling: Gracefully handles external API errors.
- Logging: Logs each request with timestamp, IP address, and rate limit status.
- Authentication: Token-based authentication for the proxy endpoint.
