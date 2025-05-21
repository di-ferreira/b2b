import { LoadOrcamento, NewOrcamento } from '@/app/actions/orcamento';
import Cart from './component/cart';

const Budget = async () => {
  let budget = await LoadOrcamento();
  if (!budget.value) budget = await NewOrcamento();

  if (!budget.value) return <p>Failed to load budget.</p>;

  if (budget.value) return <Cart value={budget.value} />;
};

export default Budget;

