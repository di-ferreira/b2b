const BASE_URL = process.env.EMSOFT_API;

type ResponseData<K> = {
  status: number;
  statusText: string;
  body: K;
};

export async function CustomFetch<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit | undefined
) {
  const data = await fetch(`${BASE_URL}${input}`, init);

  const result = await data.json();

  const responseData: ResponseData<T> = {
    status: data.status,
    statusText: data.statusText,
    body: result as T,
  };

  return responseData;
}

