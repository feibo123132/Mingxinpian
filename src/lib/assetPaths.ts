const ABSOLUTE_ASSET_RE = /^(https?:|data:|blob:|file:)/i;

interface AssetPathEnvironment {
  baseUrl?: string;
  isDev?: boolean;
}

export const normalizePublicAssetPath = (path: string) => {
  const trimmed = path.trim();
  if (!trimmed || ABSOLUTE_ASSET_RE.test(trimmed)) return trimmed;

  const slashed = trimmed.replace(/\\/g, '/').replace(/^\.\/+/, '');
  const withoutPublic = slashed.replace(/^\/?public\//, '');
  const publicCandidate = withoutPublic.replace(/^\/+/, '');

  if (/^(audio|images)\//.test(publicCandidate) || publicCandidate === 'favicon.svg') {
    return `/${publicCandidate}`;
  }

  return withoutPublic;
};

export const resolveAssetPathForEnvironment = (path: string, environment: AssetPathEnvironment = {}) => {
  const normalizedPath = normalizePublicAssetPath(path);
  if (!normalizedPath || ABSOLUTE_ASSET_RE.test(normalizedPath)) return normalizedPath;

  const assetPath = normalizedPath.replace(/^\/+/, '');

  if (environment.isDev && normalizedPath.startsWith('/')) {
    return `/${assetPath}`;
  }

  const base = environment.baseUrl || '/';
  if (base === './' || base === '') {
    return `./${assetPath}`;
  }

  const prefix = base.endsWith('/') ? base : `${base}/`;

  return `${prefix}${assetPath}`;
};

export const resolveAssetPath = (path: string) => {
  return resolveAssetPathForEnvironment(path, {
    baseUrl: import.meta.env?.BASE_URL,
    isDev: import.meta.env?.DEV,
  });
};
