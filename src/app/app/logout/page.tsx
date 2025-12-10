'use client';
import { removeCookie } from '@/app/actions';

export default async function Logout() {
  await removeCookie('token_b2b');
  await removeCookie('user_b2b');

  //   redirect('/auth');
}

