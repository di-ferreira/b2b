'use client';
import Modal from '@/hooks/Modal';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import React, { useEffect, useState } from 'react';

interface iModalSearchProduct {
  children: React.ReactElement<{ onCloseModal?: () => void }>;
  IsVisible: boolean;
  modalTitle: string;
  buttonText?: string;
  buttonIcon?: IconProp;
  buttonStyle?: string;
  iconStyle?: string;
  titleButton?: string;
}

export const SearchProductsModal = ({
  children,
  IsVisible,
  modalTitle,
}: iModalSearchProduct) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(IsVisible);
  }, [IsVisible]);

  const handleClose = () => setIsVisible(false);

  return (
    <>
      {isVisible && (
        <Modal
          Title={modalTitle}
          OnClose={handleClose}
          bodyHeight='80vh'
          bodyWidth='100%'
          containerStyle='laptop:w-[75%] laptop:h-[80%]'
          titleStyle='text-emsoft_orange-main'
        >
          {React.cloneElement(children, { onCloseModal: () => {} })}
        </Modal>
      )}
    </>
  );
};

