import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
export const fetchClient = async (
  input: string | URL | Request,
  init?: RequestInit | undefined
): Promise<Response> => {
  const jwt = cookies().get('token');
  const URL = `${process.env.EMSOFT_API}${input}`;

  const response = await fetch(URL, {
    ...init,
    headers: {
      ...init?.headers,
      ...(jwt && { Authorization: `bearer ${jwt.value}` }),
    },
  });

  if (response.status === 401) {
    return redirect('/auth');
  }

  return response;
};

