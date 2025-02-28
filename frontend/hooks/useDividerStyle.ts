import { useMemo } from "react";

interface DividerStyle {
  type: "solid" | "gradient";
  color?: string;
  colors?: string[];
}

const useDividerStyle = (cardColor?: string): DividerStyle => {
  const colorMapping: Record<string, string> = {
    Red: "#B51E12",
    Blue: "#2178B7",
    Black: "#333333",
    Purple: "#73327B",
    Green: "#009262",
    Yellow: "#F5E642",
  };

  return useMemo(() => {
    if (!cardColor) {
      return { type: "solid", color: "#000" }; // Valor por defecto
    }
    // Si es una combinación, se espera el formato "Color1/Color2"
    if (cardColor.includes("/")) {
      const parts = cardColor.split("/").map((p) => p.trim());
      const colors = parts.map((part) => colorMapping[part] || part);
      // Si por alguna razón solo hay un color, tratamos como sólido
      if (colors.length === 1) return { type: "solid", color: colors[0] };
      return { type: "gradient", colors };
    }
    // Si es un solo color
    const color = colorMapping[cardColor] || cardColor;
    return { type: "solid", color };
  }, [cardColor]);
};

export default useDividerStyle;