import { removeCookie } from '@/app/actions';
import { redirect } from 'next/navigation';

export default async function Logout() {
  await removeCookie('token_b2b');
  await removeCookie('user_b2b');
  await removeCookie('CIC');

  redirect('/auth');
}
