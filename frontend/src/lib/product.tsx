'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export interface Product {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface ProductContextValue {
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
}

const ProductContext = createContext<ProductContextValue>({
  selectedProductId: null,
  setSelectedProductId: () => {},
});

const STORAGE_KEY = 'selectedProductId';

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [selectedProductId, setSelectedProductIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(STORAGE_KEY);
      } catch {}
    }
    return null;
  });

  // Sync from localStorage on mount (backup)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== selectedProductId) setSelectedProductIdState(saved);
    } catch {}
  }, []);

  const setSelectedProductId = (id: string | null) => {
    setSelectedProductIdState(id);
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEY, id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  };

  return (
    <ProductContext.Provider value={{ selectedProductId, setSelectedProductId }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProduct() {
  return useContext(ProductContext);
}
