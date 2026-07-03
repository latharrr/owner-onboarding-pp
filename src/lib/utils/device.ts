// ============================================================
// Picapool Device Detection
// ============================================================

export interface DeviceInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  userAgent: string;
}

/**
 * Detect device type, browser, and OS from user agent.
 * Called once on session start.
 */
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return { deviceType: 'desktop', browser: 'unknown', os: 'unknown', userAgent: '' };
  }

  const ua = navigator.userAgent;

  // Device type
  let deviceType: DeviceInfo['deviceType'] = 'desktop';
  if (/iPad|Tablet/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/iPhone|Android.*Mobile|Mobile/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/Android/i.test(ua) && !/Mobile/i.test(ua)) {
    deviceType = 'tablet';
  }

  // Browser
  let browser = 'unknown';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera';

  // OS
  let os = 'unknown';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Mac OS/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return { deviceType, browser, os, userAgent: ua };
}
