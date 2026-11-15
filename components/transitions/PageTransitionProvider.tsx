'use client';

import React, { createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';

interface TransitionContextType {
  navigateWithTransition: (href: string, label?: string) => void;
  isTransitioning: boolean;
}

const TransitionContext = createContext<TransitionContextType>({
  navigateWithTransition: () => {},
  isTransitioning: false,
});

export const usePageTransition = () => useContext(TransitionContext);

export const PageTransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();

  const navigateWithTransition = (href: string) => {
    router.push(href);
  };

  return (
    <TransitionContext.Provider value={{ navigateWithTransition, isTransitioning: false }}>
      {children}
    </TransitionContext.Provider>
  );
};
