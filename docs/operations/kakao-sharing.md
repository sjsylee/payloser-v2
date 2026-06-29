# Kakao Sharing And Invitation Setup

Payloser uses KakaoTalk Share as the default invite/share path. This opens the Kakao share picker from a product button and falls back to clipboard copy when the JavaScript key or domain is not ready.

## Current MVP Path

- Group invite: create a Payloser invitation token, then share `/invite/{token}` through KakaoTalk Share.
- Invite recipients create a group join request. The group owner approves it by linking the requester to an existing temporary member or approving them as a new member.
- Settlement share: send the current settlement text through KakaoTalk Share, with clipboard copy as a fallback.
- KakaoTalk room members are not read directly by the app. Membership is controlled by owner approval inside Payloser.

## Kakao Developer Console

Required for the current MVP:

- JavaScript key: set `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY` in the web environment.
- Web platform domains: register local, staging, and production origins that will call the JavaScript SDK.
- Product link management: register the web domains used inside KakaoTalk Share messages.
- Kakao Login consent: keep profile nickname and profile image enabled for user display.

Later, permission-gated expansion:

- Kakao service friends list: required before showing a Kakao friend picker/list inside Payloser.
- KakaoTalk message send: required before sending direct messages to selected friends. This has separate permission review and quota limits, so it should not replace link-based sharing until approved.

## Deployment Note

The share links must point at the public web origin, not localhost. Before production release, verify `WEB_ORIGIN`, `NEXT_PUBLIC_API_BASE_URL`, the Kakao web domains, and product link domains together.
