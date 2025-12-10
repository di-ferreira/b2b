// components/ModalEditBudgetItem.tsx
'use client';
import { Button } from '@/components/ui/button';
import Modal from '@/hooks/Modal';

import { cn } from '@/lib/utils';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';

interface iModalEditBudgetItem {
  children: React.ReactElement<{ onCloseModal?: () => void }>;
  modalTitle: string;
  buttonText?: string;
  buttonIcon?: IconProp;
  buttonStyle?: string;
  containerStyle?: string;
  titleStyle?: string;
  iconStyle?: string;
  titleButton?: string;
}

export const ModalEditBudgetItem = ({
  children,
  buttonText,
  buttonIcon,
  modalTitle,
  buttonStyle,
  containerStyle,
  titleStyle,
  iconStyle,
  titleButton = '',
}: iModalEditBudgetItem) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleOpen = () => setIsVisible(true);
  const handleClose = () => setIsVisible(false);

  return (
    <>
      <Button
        className={cn(`gap-2`, buttonStyle)}
        onClick={handleOpen}
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

      {isVisible && (
        <Modal
          Title={modalTitle}
          OnClose={handleClose}
          containerStyle={containerStyle}
          titleStyle={titleStyle}
        >
          {React.cloneElement(children, { onCloseModal: handleClose })}
        </Modal>
      )}
    </>
  );
};

