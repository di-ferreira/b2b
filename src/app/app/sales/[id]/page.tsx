import FormEditPreSale from '@/components/preSale/FormEditPreSale';

interface ipreSalePage {
  params: { id: string };
}

const PreSale = async ({ params }: ipreSalePage) => {
  return <FormEditPreSale />;
};

export default PreSale;

