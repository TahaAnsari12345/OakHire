import { createContext, useContext, useEffect, useState } from 'react';

const BreadcrumbContext = createContext(null);

export function BreadcrumbProvider({ children }) {
  const [label, setLabel] = useState(null);
  return <BreadcrumbContext.Provider value={{ label, setLabel }}>{children}</BreadcrumbContext.Provider>;
}

function useBreadcrumbContext() {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx) throw new Error('useBreadcrumbContext must be used within a BreadcrumbProvider');
  return ctx;
}

/** Pages call this with an entity name once loaded, e.g. useBreadcrumb(candidate?.name). */
export function useBreadcrumb(dynamicLabel) {
  const { setLabel } = useBreadcrumbContext();
  useEffect(() => {
    setLabel(dynamicLabel || null);
    return () => setLabel(null);
  }, [dynamicLabel, setLabel]);
}

/** Read-only access for the layout that renders the breadcrumb trail. */
export function useBreadcrumbLabel() {
  return useBreadcrumbContext().label;
}
