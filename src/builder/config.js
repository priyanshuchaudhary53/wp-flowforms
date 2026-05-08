const d = window.flowformsBuilderData ?? {};

const UPGRADE_URL = d.upgradeUrl || d.proUrl || 'https://wpflowforms.com/pro/';

export function getProUrl(utmContent) {
  // If Pro provides an in-dashboard URL, don't append UTM
  if (UPGRADE_URL.includes('checkout') || UPGRADE_URL.includes('admin.php')) {
    return UPGRADE_URL;
  }
  const sep = UPGRADE_URL.includes('?') ? '&' : '?';
  return `${UPGRADE_URL}${sep}utm_content=${encodeURIComponent(utmContent)}`;
}

export const isPro = !!d.isPro;
export const canUsePro = !!d.canUsePro;