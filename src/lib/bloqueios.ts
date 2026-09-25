export interface BloqueioInput {
  contasAtrazadas: number;
  usaLimite: boolean;
  saldoCompra: number;
  totalPedido?: number;
  bloqueado: string;
}

export function getBloqueios(input: BloqueioInput): string[] {
  const bloqueios: string[] = [];

  if (input.contasAtrazadas > 0) bloqueios.push('INADIMPLENCIA');

  if (input.usaLimite) {
    if (input.totalPedido !== undefined) {
      if (input.totalPedido > input.saldoCompra) bloqueios.push('LIMITE');
    } else {
      if (input.saldoCompra <= 0) bloqueios.push('LIMITE');
    }
  }

  if (input.bloqueado === 'S') bloqueios.push('BLOQUEADO');

  return bloqueios;
}
