import { useMemo } from "react";

const useResponsiveFontSize = (text: string): number => {
  return useMemo(() => {
    // Ajusta los rangos y valores según tus necesidades.
    if (text.length <= 10) return 32;
    if (text.length <= 20) return 28;
    if (text.length <= 30) return 24;
    if (text.length <= 40) return 20;
    return 16;
  }, [text]);
};

export default useResponsiveFontSize;
