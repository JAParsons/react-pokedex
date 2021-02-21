import { createContext, useState } from 'react';

const CacheContext = createContext();

const CacheProvider = ({ children }) => {
  const [cache, setCache] = useState({});

  return (
    <CacheContext.Provider value={cache}>{children}</CacheContext.Provider>
  );
};

export { CacheContext, CacheProvider };
