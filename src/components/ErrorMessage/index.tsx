import { ReactNode } from 'react';

interface ErrorMessageProps {
  children: ReactNode;
}

interface iMessageProps {
  title: string;
  message: string;
}

function ErrorMessage({ message, title }: iMessageProps) {
  return (
    <div className='flex flex-col w-[450px] m-3 p-5 border-2 border-emsoft_danger-dark rounded-md'>
      <h3 className='text-xl text-emsoft_danger-dark font-bold uppercase'>
        {title}:
      </h3>
      <p className='text-base font-bold'>{message}</p>
    </div>
  );
}

export default ErrorMessage;

