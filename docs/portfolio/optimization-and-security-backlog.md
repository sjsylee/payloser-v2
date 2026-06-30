# Optimization And Security Backlog

This file is intentionally a backlog. It should be updated whenever we make a decision that will matter for production quality, portfolio credibility, or public release readiness.

## Performance And UX Optimization

### Mobile Input Speed

Status: Open

- Measure time to enter a session with 6-8 members and 7 games.
- Reduce repeated team assignment friction.
- Keep high-frequency controls within thumb reach.
- Avoid scrollbars inside small mobile cards unless the area is intentionally scrollable.

### Calculator Performance

Status: Monitor

- Current calculator scale is small, but tests should cover larger sessions.
- Keep calculators pure so benchmarking is easy.
- Watch for expensive derived state in the bowling draft flow.

### Bundle And Motion Cost

Status: Open

- Audit Lottie and motion assets before public release.
- Ensure decorative motion does not delay core settlement input.
- Prefer lazy loading for non-critical animations.

### Public Link Rendering

Status: Open

- Public result pages should be lightweight and fast on mobile.
- Add metadata for share previews.
- Avoid exposing unnecessary app shell code on read-only pages.

## Security And Privacy

### Public Share Tokens

Status: Hardened For MVP

- Use high-entropy tokens.
- Add revocation.
- Consider expiration options.
- Add `noindex` metadata.
- Do not expose internal user IDs on public pages.
- Public read-only share responses now use a sanitized read model and `X-Robots-Tag: noindex, nofollow`.

### Invite Tokens

Status: Hardened For MVP

- Use high-entropy tokens.
- Show only the minimum information needed to claim a member.
- Add owner-controlled token rotation/revocation.
- Invitation tokens now expire by default and revoked tokens are rejected.
- Consider optional owner approval if abuse appears in real usage.

### Member Claiming

Status: Open

- Group invitees create join requests instead of directly claiming a member.
- Owner approves by linking an active unlinked temporary member or creating a new member.
- Owner can unlink an incorrectly approved member.
- Owner can deactivate members without deleting historical records.
- Prevent approval into already-linked members.
- Log `claimedAt` for auditability.
- Expose only group-level invite information before approval.

### Authentication

Status: Partially Hardened

- Production auth uses Kakao OAuth and HTTP-only cookies.
- Development login must remain disabled in production.
- Production session signing now fails closed when `SESSION_COOKIE_SECRET` is missing.
- Unsafe state-changing requests are checked against the configured web origin before reaching controllers.
- Session cookies now map to DB-backed session records so logout can revoke server-side sessions.
- API requests have lightweight in-memory rate limiting for MVP/NAS deployment.
- Revisit DB-backed session invalidation if multi-device logout becomes required.

### Image Uploads

Status: Partially Hardened

- Current DB-backed upload approach is acceptable for local/MVP only.
- Before deployment, decide whether to move uploaded images to object storage.
- File size, image magic-byte validation, and image dimension limits are enforced for local/MVP uploads.
- Production upload URLs require `PUBLIC_API_ORIGIN` instead of trusting request host headers.
- Document migration from DB/blob storage to S3-compatible storage if needed.

### Kakao Platform Permissions

Status: Monitor

- MVP uses Kakao Login and KakaoTalk Share.
- Friends API and direct messages are deferred.
- Before requesting additional permissions, document exact user value, fallback behavior, and quota limits.

## Release Readiness Checklist

- [ ] Public web origin configured.
- [ ] API origin configured.
- [ ] Kakao JavaScript domains registered.
- [ ] Kakao redirect URI registered.
- [ ] Kakao product link domains registered.
- [x] Public result links use noindex.
- [x] Invite links can be revoked.
- [ ] Owner can unlink member claims.
- [ ] Owner can deactivate members.
- [x] Upload size/type limits enforced.
- [x] Upload image dimension limits enforced.
- [ ] Production session secret configured.
- [ ] Production dev-login disabled.
- [ ] Calculator edge-case tests cover rounding, custom stacks, local rules, two-team and three-team flows.
