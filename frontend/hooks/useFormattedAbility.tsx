import React from "react";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";
import { Platform, Text, View } from "react-native";
import RenderHTML, { HTMLElementModel, HTMLContentModel } from "react-native-render-html";

const badgeModel = HTMLElementModel.fromCustomModel({
  tagName: "badge",
  contentModel: HTMLContentModel.mixed, // o HTMLContentModel.block / inline según convenga
  mixedUAStyles: { display: "flex" },
});

interface FormattedAbilityProps {
    text: string;
    trigger?: boolean;
  }

const renderers = {
    badge: ({ TDefaultRenderer, ...props }: any) => {
        const { "data-bg": bgColor, "data-color": textColor } = props?.tnode?.attributes;
          // Aplica translateY solo en móvil (android/ios), y 0 en web.
        const translateY = Platform.OS === "web" ? 0 : 5;
      return (
        <View
          style={{
            backgroundColor: bgColor || "transparent",
            paddingHorizontal: 5,
            paddingVertical: 1,
            borderRadius: 5,
            flexDirection: "row",
            alignItems: "center",
            marginRight: 4,
            transform: [{ translateY }], // Ajusta este valor hasta que quede alineado
          }}
        >
          <Text
            style={{
              color: textColor || "#000",
              fontSize: 16,
              fontWeight: "600",
              lineHeight: 22,
            }}
          >
            {props?.tnode?.domNode?.children[0]?.data || ""}
          </Text>
        </View>
      );
    },
  };
  
  

const formatCardDetail = (text: string, theme: keyof typeof Colors, trigger?: boolean): string => {
  const themeColors = Colors[theme];

  // Eliminar saltos de línea y espacios extra
  text = text.replace(/\n\s*/g, " ");

  if (trigger) {
    // Reemplazar [Trigger] por la palabra sin corchetes y con fondo amarillo
    text = text.replace(
      /\[Trigger\]/g,
      `<badge data-bg="#FDEF3A" >Trigger</badge>`
    );
    // Envolver el texto completo en un span con backgroundColor TabBarBackground
    text = `<div style="background-color: ${themeColors.icon}; font-size: 16px; font-weight: 600; padding: 5px 5px; border-radius: 5px; line-height: 22px; color: ${themeColors.background};">${text}</div>`;
    return text;
  }


  // Ejemplo para un badge: [Blocker]
  text = text.replace(/\[Blocker\]/g, () =>
    `<badge data-bg="#d67e1a" data-color="${themeColors.text}">Blocker</badge>`
  );

  // Puedes hacer lo mismo para los demás elementos:
  text = text.replace(/\[Activate: Main\]/g, () =>
    `<badge data-bg="#2677A7" data-color="${themeColors.text}">Activate: Main</badge>`
  );
  text = text.replace(/\[On Play\]/g, () =>
    `<badge data-bg="#2677A7" data-color="${themeColors.text}">On Play</badge>`
  );
  text = text.replace(/\[Rush\]/g, () =>
    `<badge data-bg="#d67e1a" data-color="${themeColors.text}">Rush</badge>`
  );
  text = text.replace(/\[Main\]/g, () =>
    `<badge data-bg="#2677A7" data-color="${themeColors.text}">Main</badge>`
  );
  text = text.replace(/\[Once Per Turn\]/g, () =>
    `<badge data-bg="#e6006b" data-color="${themeColors.text}">Once Per Turn</badge>`
  );
  text = text.replace(/\[When Attacking\]/g, () =>
    `<badge data-bg="#2677A7" data-color="${themeColors.text}">When Attacking</badge>`
  );
  text = text.replace(/\[Opponent's Turn\]/g, () =>
    `<badge data-bg="#2677A7" data-color="${themeColors.text}">Opponent's Turn</badge>`
  );
  text = text.replace(/\[On K.O.\]/g, () =>
    `<badge data-bg="#2677A7" data-color="${themeColors.text}">On K.O.</badge>`
  );
  text = text.replace(/\[Your Turn\]/g, () =>
    `<badge data-bg="#196b9b" data-color="${themeColors.text}">Your Turn</badge>`
  );
  text = text.replace(/\[On Your Opponent's Attack\]/g, () =>
    `<badge data-bg="#186a99" data-color="${themeColors.text}">On Your Opponent's Attack</badge>`
  );
  text = text.replace(/\[Counter\]/g, () =>
    `<badge data-bg="#BC0110" data-color="${themeColors.text}">⚡Counter</badge>`
  );

  // Formatear DON!! x y DON!! - (puedes seguir una lógica similar, o mantenerlos como están)
  text = text.replace(
    /\[DON!! x(\d+)\]/g,
    (match: string) =>
      `<badge data-bg="${themeColors.TabBarBackground}" data-color="${themeColors.text}">${match.replace(
        "[",
        ""
      ).replace("]", "")}</badge>`
  );
  text = text.replace(
    /\[DON!! -(\d+)\]/g,
    (match: string) =>
      `<strong style="font-size: 16px; font-weight: 600; line-height: 22px;">${match
        .replace("[", "")
        .replace("]", "")}</strong>`
  );

  // Formatear texto entre paréntesis en cursiva
  text = text.replace(
    /\((.*?)\)/g,
    (match: string, p1: string) =>
      `<em style="font-size: 16px; font-weight: 600; line-height: 22px;">(${p1})</em><br />`
  );

  // Envolver el texto normal
  text = `<span style="color: ${themeColors.text}; font-size: 16px; font-weight: 600; line-height: 22px;">${text}</span>`;

  return text;
};

const FormattedAbility = ({ text,trigger }: FormattedAbilityProps) => {
  const { theme } = useTheme();
  const formattedText = formatCardDetail(text, theme,trigger);

  return (
    <View>
      <RenderHTML
        contentWidth={100}
        source={{ html: formattedText }}
        customHTMLElementModels={{ badge: badgeModel }}
        renderers={renderers}
      />
    </View>
  );
};

export default FormattedAbility;
