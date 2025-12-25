'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

import { LowBalanceModal } from '@/components/payments/LowBalanceModal';

interface LowBalanceContextType {
  showLowBalanceModal: (
    _message?: string,
    _requiredAmount?: number,
    _currentBalance?: number
  ) => void;
}

const LowBalanceContext = createContext<LowBalanceContextType | undefined>(undefined);

export function LowBalanceProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | undefined>();
  const [requiredAmount, setRequiredAmount] = useState<number | undefined>();
  const [currentBalance, setCurrentBalance] = useState<number | undefined>();

  const showLowBalanceModal = useCallback(
    (message?: string, required?: number, current?: number) => {
      setModalMessage(message);
      setRequiredAmount(required);
      setCurrentBalance(current);
      setIsOpen(true);
    },
    []
  );

  // Register global handler on mount
  useEffect(() => {
    setGlobalLowBalanceHandler(showLowBalanceModal);
    return () => {
      setGlobalLowBalanceHandler(() => {
        // No-op function to clear the handler
      });
    };
  }, [showLowBalanceModal]);

  return (
    <LowBalanceContext.Provider value={{ showLowBalanceModal }}>
      {children}
      <LowBalanceModal
        open={isOpen}
        onOpenChange={setIsOpen}
        message={modalMessage}
        requiredAmount={requiredAmount}
        currentBalance={currentBalance}
      />
    </LowBalanceContext.Provider>
  );
}

export function useLowBalance() {
  const context = useContext(LowBalanceContext);
  if (context === undefined) {
    throw new Error('useLowBalance must be used within a LowBalanceProvider');
  }
  return context;
}

// Global instance for use outside React components (in axios interceptors)
type LowBalanceHandler = (
  _message?: string,
  _requiredAmount?: number,
  _currentBalance?: number
) => void;

let globalShowLowBalanceModal: LowBalanceHandler | null = null;

export function setGlobalLowBalanceHandler(handler: LowBalanceHandler) {
  globalShowLowBalanceModal = handler;
}

export function getGlobalLowBalanceHandler() {
  return globalShowLowBalanceModal;
}
