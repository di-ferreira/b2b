'use client';
import { LoginUser } from '@/app/actions/user';
import ToastNotify from '@/components/ToastNotify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateHash, MaskCnpjCpf } from '@/lib/utils';
import useUser from '@/store';
import {
  faLock,
  faRightToBracket,
  faSpinner,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Flip, toast } from 'react-toastify';

export function AuthForm() {
  const notify = (message: string) => {
    toast(message, {
      position: 'bottom-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: 'colored',
      transition: Flip,
    });
  };
  const router = useRouter();
  const clienteUser = useUser();
  const [isPendding, setIsPendding] = useState<boolean>(false);
  const [ErrorMessage, setErrorMessage] = useState<string>('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    setIsPendding(true);

    e.preventDefault();
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    const clienteCode = formData.get('cic');
    const vendedorPassword = String(formData.get('password'));
    const vendedorPasswordHashed = generateHash(vendedorPassword);

    const login = await LoginUser({
      cliente: MaskCnpjCpf(String(clienteCode)),
      password: vendedorPasswordHashed,
    });

    if (login.value === undefined) {
      ToastNotify({
        message: `Erro ao efetuar login: ${login.error?.message}`,
        type: 'error',
      });
      setErrorMessage('Erro ao efetuar login:' + login.error?.message);
    }

    if (login.value !== undefined) {
      clienteUser.setCurrent(login.value);
      router.push('/app/dashboard');
    }
    setIsPendding(false);
  }

  return (
    <form onSubmit={handleSubmit} method='POST' className='w-full mt-8'>
      <Input
        name='cic'
        placeholder='Insira aqui o CNPJ'
        labelText='Cliente'
        labelPosition='top'
        required
        icon={faUser}
        className='mb-8'
      />

      <Input
        name='password'
        placeholder='digite sua senha'
        labelText='Password'
        labelPosition='top'
        type='password'
        required
        icon={faLock}
        className='mt-8'
      />

      <Button
        className='w-full mt-8 tablet-portrait:h-14 tablet-portrait:text-2xl'
        type='submit'
        disabled={isPendding}
      >
        <FontAwesomeIcon
          icon={isPendding ? faSpinner : faRightToBracket}
          spinPulse={isPendding}
          className='h-full mr-4'
        />
        Login
      </Button>
      <span className='text-red-700 w-full py-4 flex items-center justify-center'>
        {ErrorMessage}
      </span>
    </form>
  );
}

