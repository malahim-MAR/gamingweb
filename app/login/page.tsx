import { AuthForm } from '@/components/auth-form';
export const metadata = { title: 'Log in' };
export default function Login() {
  return <AuthForm mode="login" />;
}
