# Exercises

1. Run the starter tests, then add a failing test for an unknown assignee.
2. Start PostgreSQL, apply the migration, and rerun the HTTP contract through `PostgresIssueRepository`.
3. Seed 100,000 issues; record `EXPLAIN ANALYZE` before and after the feed index.
4. Force the audit insert to fail and prove the assignee update rolls back.
5. Add SIGTERM verification that stops accepting requests and closes the pool.
6. Optionally implement the Spring Boot version described in `brief.md` and compare generated OpenAPI documents.
