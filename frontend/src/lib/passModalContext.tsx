"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface PassModalContextType {
  isPassModalOpen: boolean;
  setPassModalOpen: (open: boolean) => void;
}

const PassModalContext = createContext<PassModalContextType>({
  isPassModalOpen: false,
  setPassModalOpen: () => {},
});

export function PassModalProvider({ children }: { children: ReactNode }) {
  const [isPassModalOpen, setPassModalOpen] = useState(false);
  return (
    <PassModalContext.Provider value={{ isPassModalOpen, setPassModalOpen }}>
      {children}
    </PassModalContext.Provider>
  );
}

export function usePassModal() {
  return useContext(PassModalContext);
}
