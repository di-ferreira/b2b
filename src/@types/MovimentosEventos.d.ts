import { iMovimento } from './PreVenda';

export interface iMovimentoEventos {
  ID: number;
  STATUS: string;
  INICIO: string;
  FIM: string;
  RESPONSAVEL: string;
  OK: string;
  LOCAL2: string;
  LOCAL: string;
  VOLUMES: number;
  MOVIMENTO: iMovimento;
}

