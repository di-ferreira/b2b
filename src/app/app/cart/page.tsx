import { LoadOrcamento, NewOrcamento } from '@/app/actions/orcamento';
import { redirect } from 'next/navigation';
import Cart from './component/cart';

const Budget = async () => {
  const budget = await LoadOrcamento();

  // Sessão ausente/expirada (cookie ou token): volta para o login em vez de
  // tentar criar um orçamento sem usuário autenticado.
  if (budget.error?.code === '401') redirect('/auth');

  const data = budget.value ?? (await NewOrcamento()).value;

  if (!data) return <p>Failed to load budget.</p>;

  return <Cart data={data} />;
};

export default Budget;
