const useColorCombination = () => {
    const getColorCombination = (colors: string[]) => {
        // Ordena los colores alfabéticamente para no importar el orden
        const [color1, color2] = colors.sort();

        // Usamos la combinación ordenada para la comparación
        switch (`${color1}/${color2}`) {
            case "Blue/Purple":
                return "Blue/Purple";
            case "Blue/Red":
                return "Red/Blue";
            case "Blue/Green":
                return "Green/Blue";
            case "Black/Blue":
                return "Blue/Black";
            case "Blue/Yellow":
                return "Blue/Yellow";
            case "Green/Red":
                return "Red/Green";
            case "Red/Yellow":
                return "Red/Yellow";
            case "Black/Red":
                return "Red/Black";
            case "Purple/Red":
                return "Red/Purple";
            case "Purple/Yellow":
                return "Purple/Yellow";
            case "Green/Purple":
                return "Green/Purple";
            case "Black/Purple":
                return "Purple/Black";
            case "Black/Green":
                return "Green/Black";
            case "Green/Yellow":
                return "Green/Yellow";
            case "Black/Yellow":
                return "Black/Yellow";
            default:
                return "";
        }
    };

    return { getColorCombination };
};

export default useColorCombination;
