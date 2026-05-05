const d = window.flowformsBuilderData ?? {};

const PRO_BASE_URL = d.proUrl ?? 'https://wpflowforms.com/pro/';

export function getProUrl(utmContent) {
  const sep = PRO_BASE_URL.includes('?') ? '&' : '?';
  return `${PRO_BASE_URL}${sep}utm_content=${encodeURIComponent(utmContent)}`;
}
