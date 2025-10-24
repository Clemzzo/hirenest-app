import { createContext, useContext, useState, ReactNode } from 'react';

type ProviderState = {
  services: string[];
  setServices: (services: string[]) => void;
};

const ProviderStateContext = createContext<ProviderState | undefined>(undefined);

export function ProviderStateProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<string[]>([]);
  return (
    <ProviderStateContext.Provider value={{ services, setServices }}>
      {children}
    </ProviderStateContext.Provider>
  );
}

export function useProviderState() {
  const context = useContext(ProviderStateContext);
  if (!context) {
    throw new Error('useProviderState must be used within ProviderStateProvider');
  }
  return context;
}