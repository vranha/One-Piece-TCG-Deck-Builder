import { useMemo } from "react";

interface DividerStyle {
  type: "solid" | "gradient";
  color?: string;
  colors?: string[];
}

const useDividerStyle = (cardColors?: string[]): DividerStyle => {
  const colorMapping: Record<string, string> = {
    Red: "#B51E12",
    Blue: "#2178B7",
    Black: "#333333",
    Purple: "#73327B",
    Green: "#009262",
    Yellow: "#F5E642",
  };

  return useMemo(() => {
    if (!cardColors || cardColors.length === 0) {
      return { type: "solid", color: "#000" }; // Valor por defecto
    }
    
    // Mapear los colores a sus valores hexadecimales
    const colors = cardColors.map((color) => colorMapping[color] || color);

    // Si solo hay un color, tratamos como sólido
    if (colors.length === 1) {
      return { type: "solid", color: colors[0] };
    }

    // Si hay más de un color, se usa el estilo de gradiente
    return { type: "gradient", colors };
  }, [cardColors]);
};

export default useDividerStyle;
