import { useMemo } from "react";

const useFormattedSetNames = (setNames: string[]) => {
    return useMemo(() => {
        return setNames
            .map((set) => {
                let formattedName = set.trim();

                // Si empieza por "-", lo quitamos
                if (formattedName.startsWith("-")) {
                    formattedName = formattedName.slice(1).trim();
                }

                // Buscar si tiene un código entre corchetes al final
                const match = formattedName.match(/\[(OP\d{2}|ST\d{2}|OP-\d{2}|ST-\d{2})\]$/);
                if (match) {
                    let code = match[1]; // Extraemos el código dentro de los corchetes

                    // Si el código no tiene guion (ej: "OP01"), se lo añadimos ("OP-01")
                    if (/^(OP|ST)\d{2}$/.test(code)) {
                        code = `${code.slice(0, 2)}-${code.slice(2)}`;
                    }

                    // Eliminar el guion antes del código si existe (ej: "Set Name -[OP-01]" → "Set Name [OP-01]")
                    formattedName = formattedName.replace(/-\s?\[.*?\]$/, "").trim();

                    // Mover el código al inicio y quitar los corchetes
                    formattedName = `${code} ${formattedName.replace(match[0], "").trim()}`;
                }

                return { original: set, formatted: formattedName };
            })
            .sort((a, b) => {
                // Función de ordenación según prefijos OP-XX > ST-XX > el resto
                const getPriority = (name: string) => {
                    if (name.startsWith("OP-")) return 1;
                    if (name.startsWith("ST-")) return 2;
                    return 3;
                };

                const priorityA = getPriority(a.formatted);
                const priorityB = getPriority(b.formatted);

                // Ordenar primero por prioridad y luego alfabéticamente
                return priorityA - priorityB || a.formatted.localeCompare(b.formatted);
            });
    }, [setNames]);
};

export default useFormattedSetNames;
