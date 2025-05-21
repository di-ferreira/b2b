import DataTableProducts from '@/components/products/DataTable';

const Products = () => {
  return (
    <div className='flex flex-col w-full h-[calc(100vh-74px)] overflow-x-hidden overflow-y-auto'>
      <section className='flex flex-col w-full h-full overflow-x-hidden overflow-y-scroll'>
        <DataTableProducts />
      </section>
    </div>
  );
};

export default Products;

