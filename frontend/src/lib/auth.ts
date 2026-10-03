export const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('flowos_token', token);
  }
};

export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('flowos_token');
  }
  return null;
};

export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('flowos_token');
  }
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};
