'use client';
import { iCliente } from '@/@types/Cliente';
import { iColumnType } from '@/@types/Table';
import { MaskCnpjCpf } from '@/lib/utils';
import { faBan, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const RenderIconBloqueado = (value: string) => {
  if (value === 'S')
    return <FontAwesomeIcon icon={faBan} className='text-red-700' size='xl' />;
  return (
    <FontAwesomeIcon icon={faCheck} className='text-green-800' size='xl' />
  );
};

export const headers: iColumnType<iCliente>[] = [
  {
    key: 'CLIENTE',
    title: 'CÓDIGO',
    width: '10rem',
  },
  {
    key: 'NOME',
    title: 'NOME',
    width: '20rem',
  },
  {
    key: 'BLOQUEADO',
    title: 'BLOQUEADO',
    width: '11rem',
    render: (_, item) =>
      item.BLOQUEADO && <>{RenderIconBloqueado(String(item.BLOQUEADO))}</>,
  },
  {
    key: 'CIC',
    title: 'CPF/CNPJ',
    width: '20rem',
    isHideMobile: true,
    render: (_, item) => <>{MaskCnpjCpf(item.CIC)}</>,
  },
  {
    key: 'ENDERECO',
    title: 'ENDEREÇO',
    width: '20rem',
    isHideMobile: true,
  },
  {
    key: 'BAIRRO',
    title: 'BAIRRO',
    width: '20rem',
    isHideMobile: true,
  },
  {
    key: 'CIDADE',
    title: 'CIDADE',
    width: '20rem',
  },
  {
    key: 'UF',
    title: 'UF',
    width: '7rem',
    isHideMobile: true,
  },
];

