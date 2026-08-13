export const getErrorMessage = (err: any, fallbackMessage: string): string => {
  if (!err) return fallbackMessage;

  const detail = err.response?.data?.detail;

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null && item.msg) {
          return item.msg;
        }
        return JSON.stringify(item);
      })
      .join(', ');
  }

  if (typeof detail === 'object' && detail !== null) {
    return detail.message || JSON.stringify(detail);
  }

  if (err.message && typeof err.message === 'string') {
    return err.message;
  }

  return fallbackMessage;
};
