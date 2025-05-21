'use server';
import { returnExpiresTimes } from '@/lib/utils';
import { cookies } from 'next/headers';
import './cliente';
import './user';

export async function setCookie(name: string, value: string): Promise<void> {
  cookies().set({
    name: name,
    value: value,
    httpOnly: true,
    expires: returnExpiresTimes(120),
  });
}

export async function getCookie(value: string): Promise<string> {
  const token = cookies().get(value);
  return token ? token.value : '';
}

export async function removeCookie(name: string): Promise<void> {
  const token = cookies().delete(name);
}

