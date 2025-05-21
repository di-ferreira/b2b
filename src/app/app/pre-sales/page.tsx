import DataTablePreSale from '@/components/preSale/DataTable';

const PreSales = () => {
  return (
    <div className='flex flex-col w-full h-[calc(100vh-74px)] overflow-x-hidden overflow-y-auto'>
      <section className='flex flex-col w-full h-full overflow-x-hidden overflow-y-scroll'>
        <DataTablePreSale />
      </section>
    </div>
  );
};

export default PreSales;

