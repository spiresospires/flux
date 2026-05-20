import React, { createContext, useContext, useState } from 'react';

interface SearchContextType {
  lastQuery: string;
  setLastQuery: (q: string) => void;
}

const SearchContext = createContext<SearchContextType>({ lastQuery: '', setLastQuery: () => {} });

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [lastQuery, setLastQuery] = useState('');
  return <SearchContext.Provider value={{ lastQuery, setLastQuery }}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  return useContext(SearchContext);
}
