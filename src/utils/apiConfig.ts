/**
 * API Configuration and Dynamic URL Resolution
 */

export const DEFAULT_CLOUD_RUN_BACKEND = 'https://ais-pre-kryab4yuuqo6feavedsp3o-190877320449.asia-southeast1.run.app';
export const STORAGE_KEY_BACKEND_URL = 'mahaveer_backend_api_url';

export function isStaticDeployment(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname.toLowerCase();
  return (
    hostname.includes('github.io') ||
    hostname.includes('web.app') ||
    hostname.includes('firebaseapp.com') ||
    window.location.protocol === 'file:'
  );
}

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return '';

  const savedUrl = localStorage.getItem(STORAGE_KEY_BACKEND_URL);
  if (savedUrl && savedUrl.trim()) {
    return savedUrl.trim().replace(/\/+$/, '');
  }

  if (isStaticDeployment()) {
    return DEFAULT_CLOUD_RUN_BACKEND.replace(/\/+$/, '');
  }

  return '';
}

export function getApiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base}${cleanEndpoint}` : cleanEndpoint;
}

export function setApiBaseUrl(url: string): void {
  if (!url || !url.trim()) {
    localStorage.removeItem(STORAGE_KEY_BACKEND_URL);
  } else {
    localStorage.setItem(STORAGE_KEY_BACKEND_URL, url.trim().replace(/\/+$/, ''));
  }
}

export async function testApiHealth(targetUrl?: string): Promise<{ success: boolean; message: string; time?: string }> {
  const base = (targetUrl !== undefined ? targetUrl.trim().replace(/\/+$/, '') : getApiBaseUrl());
  const url = base ? `${base}/api/health` : '/api/health';

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!res.ok) {
      if (res.status === 405) {
        return {
          success: false,
          message: 'Error 405 (Not Allowed): This URL is a static web host and does not run the Node/Express backend.'
        };
      }
      return {
        success: false,
        message: `HTTP ${res.status}: ${res.statusText || 'Server responded with an error'}`
      };
    }

    const data = await res.json();
    if (data && data.status === 'ok') {
      return {
        success: true,
        message: 'Backend server is online and responding!',
        time: data.time
      };
    }

    return {
      success: false,
      message: 'Server responded, but health status was not ok.'
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        success: false,
        message: 'Connection timed out after 8 seconds.'
      };
    }
    return {
      success: false,
      message: err.message || 'Failed to connect to backend server.'
    };
  }
}

export function sanitizeApiErrorMessage(raw: string): string {
  if (!raw) return 'An unexpected error occurred.';
  
  const isHtml = /<[a-z][\s\S]*>/i.test(raw);
  const is405 = raw.includes('405') || raw.toLowerCase().includes('not allowed');

  if (is405 || (isHtml && isStaticDeployment())) {
    return 'Document OCR / AI features require a connected backend server. GitHub Pages is a static host. Please verify the Backend Server URL in Admin Settings or fill in details manually.';
  }

  if (isHtml) {
    return 'The server encountered an error while processing the request. Please try again or fill in the details manually.';
  }

  return raw;
}