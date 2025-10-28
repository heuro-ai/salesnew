export const normalizeUrl = (url: string): string => {
  if (!url) return '';

  const trimmedUrl = url.trim();

  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }

  return `https://${trimmedUrl}`;
};

export const isValidUrl = (url: string): boolean => {
  if (!url) return false;

  try {
    const normalizedUrl = normalizeUrl(url);
    const urlObj = new URL(normalizedUrl);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

export const extractDomain = (url: string): string => {
  try {
    const normalizedUrl = normalizeUrl(url);
    const urlObj = new URL(normalizedUrl);
    return urlObj.hostname;
  } catch {
    return '';
  }
};

export const getProtocol = (url: string): 'http' | 'https' | null => {
  try {
    const normalizedUrl = normalizeUrl(url);
    const urlObj = new URL(normalizedUrl);
    if (urlObj.protocol === 'http:') return 'http';
    if (urlObj.protocol === 'https:') return 'https';
    return null;
  } catch {
    return null;
  }
};
