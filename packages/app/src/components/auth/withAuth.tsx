import Auth from './AuthRedirect'
 
export function withAuth(children: React.ReactNode) {
  return <Auth>{children}</Auth>
}
