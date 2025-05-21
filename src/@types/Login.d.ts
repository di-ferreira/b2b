import { iVendedor } from './Vendedor';

export interface iUserLogin {
  username: string;
  password: string;
}

export interface iVendaLogin {
  codigoVendedor: string;
  password: string;
}

export interface iCurrentUser {
  vendedor?: iVendedor;
  username: string;
  type: string;
  level: number;
  group?: string;
}

export interface iTokenPayload {
  Chave: string;
  Nivel: string;
  Tipo: string;
  Usuario: string;
  Grupo?: string;
  Validade: string;
  iss: string;
  vendedor?: string;
}
