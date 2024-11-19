import React, { createContext, useContext, useState } from 'react';

// Create the BPM context
const BpmContext = createContext();

// Hook to use the BPM context
export const useBpm = () => useContext(BpmContext);

// Provider to wrap the component tree
export const BpmProvider = ({ children }) => {
  const [bpm, setBpm] = useState(250); // Default BPM

  return (
    <BpmContext.Provider value={{ bpm, setBpm }}>
      {children}
    </BpmContext.Provider>
  );
};