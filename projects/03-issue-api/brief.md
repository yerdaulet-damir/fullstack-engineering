# Brief

Project 02 needs an API that keeps issue data valid under concurrent writes.

Build endpoints for health, users, issues, comments, and assignment. Validate every request and response, paginate issues with an opaque cursor, and perform assignment plus audit insertion in one transaction. Keep HTTP errors structured and include the request ID.

The starter proves the contract with an in-memory seam while preserving a PostgreSQL adapter and executable schema. Do not replace cursor pagination with offsets.

## Optional Spring Boot implementation

Rebuild the same contract with Java 21, Spring Boot 3, Spring Web, Validation, JDBC, PostgreSQL, Flyway, and springdoc-openapi. Use records for request/response DTOs, `@ControllerAdvice` for the shared error envelope, and `@Transactional` around assignment plus audit insertion. Encode the cursor as URL-safe Base64 JSON containing `(created_at, id)` and query with the same tuple comparison as the SQL starter. Use Testcontainers PostgreSQL for integration tests and MockMvc only for HTTP contract tests. Generate `/v3/api-docs`, compare its required paths with `acceptance.md`, and document the commands you actually ran. This is a guide, not an included Java implementation.
