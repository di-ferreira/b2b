import { useState } from 'react';

export default function useModal() {
  const [isVisible, setIsVisible] = useState(false);

  const showModal = () => setIsVisible(true);
  const OnCloseModal = () => setIsVisible(false);

  return {
    isVisible,
    showModal,
    OnCloseModal,
  };
}

