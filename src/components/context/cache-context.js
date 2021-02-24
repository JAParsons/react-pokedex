import { createContext, useState } from 'react';

const CacheContext = createContext();

const CacheProvider = ({ children }) => {
  // set cache to be the reference to window.localStorage
  const [cache, setCache] = useState(localStorage);

  return (
    <CacheContext.Provider value={cache}>{children}</CacheContext.Provider>
  );
};

export { CacheContext, CacheProvider };
