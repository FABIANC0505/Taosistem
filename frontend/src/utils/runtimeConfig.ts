const normalizeBaseUrl = (value?: string) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  return trimmed.replace(/\/+$/, '');
};

export const getApiBaseUrl = () => {
  const envApiUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL);
  const hasInvalidPlaceholder =
    !envApiUrl ||
    envApiUrl.includes('tu-backend-production') ||
    envApiUrl.includes('backend:8000');

  if (!hasInvalidPlaceholder) {
    return envApiUrl;
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:8000';
  }

  return '';
};

export const isApiBaseUrlConfigured = () => getApiBaseUrl().length > 0;
