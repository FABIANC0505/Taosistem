import { getApiBaseUrl } from './runtimeConfig';

export const resolveMediaUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/img/')) return url;
  const base = getApiBaseUrl();
  return base ? `${base}${url}` : url;
};
