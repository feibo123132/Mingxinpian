const ABSOLUTE_ASSET_RE = /^(https?:|data:|blob:|file:)/i;

export const resolveAssetPath = (path: string) => {
  if (!path || ABSOLUTE_ASSET_RE.test(path)) return path;

  const base = import.meta.env.BASE_URL || '/';
  const prefix = base.endsWith('/') ? base : `${base}/`;

  return `${prefix}${path.replace(/^\/+/, '')}`;
};
