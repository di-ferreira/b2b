import DataTableSale from '@/components/sales/DataTable';

const Sales = () => {
  return (
    <div className='flex flex-col w-full h-[calc(100vh-74px)] overflow-x-hidden overflow-y-auto'>
      <section className='flex flex-col w-full h-full overflow-x-hidden overflow-y-scroll'>
        <DataTableSale />
      </section>
    </div>
  );
};

export default Sales;

