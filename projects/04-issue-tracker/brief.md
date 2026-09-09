# Brief

Two accounts use private projects in one deployable application. A user may list, read, and change only projects they own. The browser may hide controls, but the server remains the authorization boundary.

Implement sign-in, projects, issues, comments, labels, and attachment preparation. Store session state on the server, issue an opaque cookie, and return the same response for missing and unauthorized private resources. Attachment preparation returns a short-lived upload target; it never returns storage credentials.
