export const AUTH_CONFIG = {
  publicRoutes: [
    '/login',
    '/oauth2redirect',
    '/oauth2redirect/quickbooks',
  ],
  
  publicApiEndpoints: [
    '/auth/sso?provider=INTUIT',
  ],
  
  devApiWithAuthEndpoints: [
    '/auth/login',
    '/auth/sso?provider=INTUIT',
    'add?provider=QUICKBOOKS'
  ],

  loginPath: '/login',
  
  defaultRedirectPath: '/',
  
  redirectAfterLoginKey: 'redirectAfterLogin',
  
  debug: process.env.NODE_ENV === 'development',
};


export const isPublicRoute = (path: string): boolean => {
  return AUTH_CONFIG.publicRoutes.some(route => 
    path === route || path.startsWith(route)
  );
};

export const requiresAuth = (path: string): boolean => {
  return !isPublicRoute(path);
};