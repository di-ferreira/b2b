import { JSX } from 'react';
export interface iEmpresa {
  ID: number;
  RAZAO_SOCIAL: string;
  NOME: string;
  CNPJ: string;
  TELEFONES: string;
  BLOQUEADO: string | JSX.Element | null;
  MOTIVO_BLOQUEADO: string;
}
