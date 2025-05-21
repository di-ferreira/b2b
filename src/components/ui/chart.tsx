'use client';
import { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';

// Importação dinâmica para evitar problemas com SSR
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

interface Series {
  name: string; // Nome da série
  data: number[]; // Dados da série
}

interface LineChartProps {
  series: Series[] | Series; // Aceita uma série ou várias
  categories: string[]; // Categorias do eixo X
}

const LineChart = ({ series, categories }: LineChartProps) => {
  const options: ApexOptions = {
    chart: {
      type: 'line',
      toolbar: {
        show: false,
      },
      height: '100%',
      width: '100%',
    },
    plotOptions: {
      line: {
        isSlopeChart: true,
      },
    },
    xaxis: {
      categories,
      labels: {
        style: {
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px',
        },
      },
    },
    stroke: {
      curve: 'smooth',
    },
    title: {
      text: '',
      align: 'center',
      style: {
        fontSize: '16px',
      },
    },
    legend: {
      show: Array.isArray(series) && series.length > 1, // Mostra a legenda apenas se houver múltiplas séries
      position: 'top',
      horizontalAlign: 'center',
    },
    colors: ['#0070f3', '#ff4560', '#00e396'], // Paleta de cores
  };

  // Normaliza para sempre usar um array de séries
  const normalizedSeries = Array.isArray(series) ? series : [series];

  return (
    <div className='w-full h-full'>
      <ReactApexChart
        options={options}
        series={normalizedSeries}
        type='line'
        height={350}
      />
    </div>
  );
};

export default LineChart;

