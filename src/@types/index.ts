export interface iDataResult<T> {
  data: iApiResult<T>;
}
export interface iApiData<T> {
  Qtd_Registros: number;
  value: T[];
}

export interface iApiResult<T> {
  Data: T;
  RecordCount: number;
  StatusCode: number;
  StatusMessage: string;
}

export interface iResultApi<T> {
  status: number;
  statusText: string;
  body: { value: T[] };
}

export interface iUniqueResult<T> {
  data: T;
}

export interface iSearch<T> {
  filterBy: keyof T;
  value: string;
}

export type typeSimNao = 'S' | 'N';

type SQLType =
  | 'ftUnknown'
  | 'ftString'
  | 'ftSmallint'
  | 'ftInteger'
  | 'ftWord'
  | 'ftBoolean'
  | 'ftFloat'
  | 'ftCurrency'
  | 'ftBCD'
  | 'ftDate'
  | 'ftTime'
  | 'ftDateTime'
  | 'ftBytes'
  | 'ftVarBytes'
  | 'ftAutoInc'
  | 'ftBlob'
  | 'ftMemo'
  | 'ftGraphic'
  | 'ftFmtMemo'
  | 'ftParadoxOle'
  | 'ftDBaseOle'
  | 'ftTypedBinary'
  | 'ftCursor'
  | 'ftFixedChar'
  | 'ftWideString'
  | 'ftLargeint'
  | 'ftADT'
  | 'ftArray'
  | 'ftReference'
  | 'ftDataSet'
  | 'ftOraBlob'
  | 'ftOraClob'
  | 'ftVariant'
  | 'ftInterface'
  | 'ftIDispatch'
  | 'ftGuid'
  | 'ftTimeStamp'
  | 'ftFMTBcd'
  | 'ftFixedWideChar'
  | 'ftWideMemo'
  | 'ftOraTimeStamp'
  | 'ftOraInterval'
  | 'ftLongWord'
  | 'ftShortint'
  | 'ftByte'
  | 'ftExtended'
  | 'ftConnection'
  | 'ftParams'
  | 'ftStream'
  | 'ftTimeStampOffset'
  | 'ftObject'
  | 'ftSingle';

interface iSelectParam {
  ParamType: SQLType;
  ParamName: string;
  ParamValues: string[] | number[];
}

export interface iSelectSQL {
  pSQL: string;
  pPar: iSelectParam[];
}

export type iVendedorSenha = iVendedor & {
  SENHA: string;
};

export type iVendedor = {
  VENDEDOR: number;
  NOME: string;
  CPF: null;
  IDENTIDADE: null;
  ATIVO: string;
  VENDA: string;
  TIPO_VENDEDOR: string;
  TABELAS_PERMITIDAS: null;
};

export type userLogin = {
  cliente: string;
  password: string;
};

export type Response<T> = {
  value?: T;
};

export type ResponseType<T> = {
  value?: T;
  error?: ResponseError;
};

export type ResponseError = {
  code: string;
  message: string;
};

