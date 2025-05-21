import { GetOrcamento } from '@/app/actions/orcamento';
import FormEditPreSale from '@/components/preSale/FormEditPreSale';

interface ipreSalePage {
  params: { id: number };
}

const PreSale = async ({ params }: ipreSalePage) => {
  const orcamento = await GetOrcamento(params.id);

  if (!orcamento.value) return <p>Failed to load Pre-Sale.</p>;

  return <FormEditPreSale orc={orcamento.value} />;
};

export default PreSale;

