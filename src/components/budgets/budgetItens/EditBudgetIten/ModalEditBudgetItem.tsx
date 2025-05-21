'use client';
import { Button } from '@/components/ui/button';
import useModal from '@/hooks/useModal';
import { cn } from '@/lib/utils';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

interface iModalEditBudgetItem {
  children: React.ReactElement<{ onCloseModal?: () => void }>; // Adicione esta tipagem
  modalTitle: string;
  buttonText?: string;
  buttonIcon?: IconProp;
  buttonStyle?: string | undefined;
  iconStyle?: string | undefined;
  titleButton?: string | undefined;
}

export const ModalEditBudgetItem = ({
  children,
  buttonText,
  buttonIcon,
  modalTitle,
  buttonStyle,
  iconStyle,
  titleButton = '',
}: iModalEditBudgetItem) => {
  const { Modal, OnCloseModal, showModal } = useModal();

  return (
    <>
      <Button
        className={cn(`gap-2`, buttonStyle)}
        onClick={() => showModal()}
        title={titleButton}
      >
        {buttonIcon && (
          <FontAwesomeIcon
            icon={buttonIcon}
            className={cn('text-emsoft_light-main', iconStyle)}
            size='xl'
            title={buttonText}
          />
        )}
        {buttonText}
      </Button>
      {Modal && (
        <Modal
          Title={modalTitle}
          containerStyle='laptop:w-[80%] w-full laptop:h-[95%] bg-gray-200'
        >
          {React.cloneElement(children, { onCloseModal: OnCloseModal })}
        </Modal>
      )}
    </>
  );
};

