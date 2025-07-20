import { useTranslation } from "react-i18next";

export function useManagerTranslation() {
  const { t: tBase, i18n } = useTranslation();
  
  const t = (key: string) => {
    return tBase(`manager.${key}`);
  };
  
  return { t, i18n };
}