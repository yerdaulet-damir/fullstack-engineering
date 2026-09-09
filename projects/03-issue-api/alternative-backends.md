# Alternative backend routes

Keep the same OpenAPI document, PostgreSQL schema, fixtures, and black-box behavior. Change the server implementation, not the product.

## Java and Spring Boot

Use Java 21+, Spring Boot, Spring Web, Bean Validation, Spring Security, JDBC or jOOQ, Flyway, Testcontainers, and springdoc-openapi.

The Java route is complete when the existing API checks pass against it and these behaviors remain visible:

- validation errors use the same response shape;
- assignment and audit insertion share one transaction;
- authorization is checked on the loaded resource;
- integration tests use a disposable PostgreSQL container;
- graceful shutdown stops accepting work before closing the pool.

Read while implementing: [Spring REST guide](https://spring.io/guides/gs/rest-service), [Spring Data access](https://docs.spring.io/spring-framework/reference/data-access.html), [Spring Security authorization](https://docs.spring.io/spring-security/reference/servlet/authorization/index.html), [Testcontainers PostgreSQL](https://java.testcontainers.org/modules/databases/postgres/), and [Flyway migrations](https://documentation.red-gate.com/flyway).

## Python and FastAPI

Use Python 3.13+, FastAPI, Pydantic, psycopg, Alembic, and pytest. Keep SQL and transaction ownership explicit.

The Python route is complete when it passes the same black-box contract, including malformed cursors, duplicate requests, transaction rollback, and graceful shutdown.

Read while implementing: [FastAPI tutorial](https://fastapi.tiangolo.com/tutorial/), [Pydantic models](https://docs.pydantic.dev/latest/concepts/models/), [psycopg transactions](https://www.psycopg.org/psycopg3/docs/basic/transactions.html), and [pytest fixtures](https://docs.pytest.org/en/stable/how-to/fixtures.html).
