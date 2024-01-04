/* eslint-disable react/prop-types */
import { createContext, useContext } from 'react';

const AppContext = createContext();

const AppProvider = ({ children }) => {
  return <AppContext.Provider value={{}}>{children}</AppContext.Provider>;
};

export default AppProvider;

export const useGlobalContext = () => {
  return useContext(AppContext);
};
