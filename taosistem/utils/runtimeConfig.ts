const normalizeBaseUrl = (value?: string) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  return trimmed.replace(/\/+$/, '');
};

export const getApiBaseUrl = () => {
  const envApiUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);
  if (envApiUrl) {
    return envApiUrl.endsWith('/api') ? envApiUrl : `${envApiUrl}/api`;
  }
  return '/api';
};

export const isApiBaseUrlConfigured = () => getApiBaseUrl().length > 0;
