# Upload Storage

Payloser currently stores uploaded group images on the API server filesystem and saves the public image URL in PostgreSQL.

This is acceptable for local development and early internal testing only. Before production deployment, replace the local filesystem storage implementation with durable object storage such as S3, R2, or NAS-backed storage.

Deployment checklist:

- Set `UPLOADS_DIR` to a persistent path if using local storage temporarily.
- Set `PUBLIC_API_ORIGIN` to the externally reachable API origin so uploaded image URLs are stable.
- Move `UploadsService` behind durable storage before production traffic.
- Keep PostgreSQL as metadata storage only: `Group.imageUrl` and `Group.themeColor`.
