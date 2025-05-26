'use client';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

interface BannerCarouselProps {
  path?: string; // permite customizar o caminho se quiser
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({
  path = '/banners',
}) => {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/list-banners')
      .then((res) => res.json())
      .then((data) => {
        setImages(data || []);
      });
  }, []);

  return (
    <div className='w-full min-h-[180px]  h-full max-w-screen-xl mx-auto'>
      {images.length > 0 && (
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          slidesPerView={1}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          loop
          pagination={{ clickable: true }}
          scrollbar={{ draggable: true }}
          navigation
          className='w-full h-full'
        >
          {images.map((img, index) => (
            <SwiperSlide
              key={index}
              className='w-full !h-[180px] rounded-xl object-cover'
            >
              <Image
                src={`${path}/${img}`}
                alt={`Banner ${index}`}
                fill
                className='w-full h-[180px] rounded-xl object-cover'
                priority={index === 0}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
};

export default BannerCarousel;

