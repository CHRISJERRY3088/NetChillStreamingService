const TOKEN_PARAM_NAMES = ['access_token', 'accessToken', 'token', 'oobCode'];

export function getResetTokenFromLocation(location = window.location) {
  if (!location) {
    return null;
  }

  const searchParams = new URLSearchParams(location.search || '');
  for (const name of TOKEN_PARAM_NAMES) {
    const value = searchParams.get(name);
    if (value) {
      return value;
    }
  }

  const hash = typeof location.hash === 'string' ? location.hash : '';
  if (!hash) {
    return null;
  }

  const hashContent = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!hashContent) {
    return null;
  }

  const hashParams = new URLSearchParams(hashContent);
  for (const name of TOKEN_PARAM_NAMES) {
    const value = hashParams.get(name);
    if (value) {
      return value;
    }
  }

  return null;
}
