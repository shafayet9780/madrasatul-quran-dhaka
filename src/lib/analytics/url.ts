const SAFE_QUERY_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

function splitPathAndSearch(pathOrUrl: string): { pathname: string; search: string } {
  try {
    const parsed = new URL(pathOrUrl, 'https://analytics.local');
    return {
      pathname: parsed.pathname || '/',
      search: parsed.search,
    };
  } catch {
    const [pathname, search = ''] = pathOrUrl.split('?');
    return {
      pathname: pathname || '/',
      search: search ? `?${search}` : '',
    };
  }
}

export function sanitizePathWithAllowedQuery(
  pathOrUrl: string,
  searchOverride?: string
): string {
  const { pathname, search } = splitPathAndSearch(pathOrUrl);
  const rawSearch = searchOverride ?? search;
  const params = new URLSearchParams(rawSearch.startsWith('?') ? rawSearch.slice(1) : rawSearch);
  const safeParams = new URLSearchParams();

  for (const key of SAFE_QUERY_KEYS) {
    const value = params.get(key);
    if (value) {
      safeParams.set(key, value);
    }
  }

  const safeQuery = safeParams.toString();
  return safeQuery ? `${pathname}?${safeQuery}` : pathname;
}

export function sanitizeCurrentPath(): string {
  if (typeof window === 'undefined') {
    return '/';
  }

  return sanitizePathWithAllowedQuery(window.location.pathname, window.location.search);
}
