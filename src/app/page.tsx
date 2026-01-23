// src/app/page.tsx
import AuthPage from './auth/page'

export default function Home() {
  // We don't redirect automatically here.
  // AuthPage will handle login/signup.
  return <AuthPage />
}
