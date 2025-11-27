import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PageTitleContextType {
  title: string;
  description: string;
  setPageTitle: (title: string, description: string) => void;
}

const PageTitleContext = createContext<PageTitleContextType | undefined>(undefined);

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('Dashboard');
  const [description, setDescription] = useState('');

  const setPageTitle = (newTitle: string, newDescription: string) => {
    setTitle(newTitle);
    setDescription(newDescription);
  };

  return (
    <PageTitleContext.Provider value={{ title, description, setPageTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitle(title?: string, description?: string) {
  const context = useContext(PageTitleContext);

  if (!context) {
    throw new Error('usePageTitle must be used within a PageTitleProvider');
  }

  useEffect(() => {
    if (title !== undefined && description !== undefined) {
      context.setPageTitle(title, description);
    }
  }, [title, description]);

  return context;
}
