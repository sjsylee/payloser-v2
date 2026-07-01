export function buildPublicSharePath(shareToken?: string | null) {
  return shareToken ? `/share/${shareToken}` : null;
}

export function buildBrowserPublicShareUrl(shareToken?: string | null) {
  const path = buildPublicSharePath(shareToken);

  if (!path || typeof window === "undefined") {
    return null;
  }

  return `${window.location.origin}${path}`;
}
