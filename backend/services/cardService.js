const { supabase } = require("../services/supabaseClient");

// Buscar cartas con paginación y filtros
const searchCards = async (page = 1, limit = 10, search = "", filters = {}) => {
    const offset = (Number(page) - 1) * Number(limit); // Asegúrate de que page y limit sean número

    let query = supabase
        .from("cards")
        .select("*", { count: "exact" })
        .or(`name.ilike.%${search}%,code.ilike.%${search}%`);

    // Filtros exactos
    if (filters.rarity && filters.rarity.length > 0) {
        query = query.in("rarity", filters.rarity);
    }
    if (filters.type && filters.type.length > 0) {
        query = query.in("type", filters.type);
    }
    if (filters.cost) {
        query = query.eq("cost", Number(filters.cost));
    }
    if (filters.power) {
        query = query.eq("power", Number(filters.power));
    }
    if (filters.counter) {
        query = query.eq("counter", filters.counter);
    }
    if (filters.color && filters.color.length > 0) {
        // Asegurarse de que los colores sean consistentes (primera letra mayúscula)
        const formattedColors = filters.color.map((color) => color.charAt(0).toUpperCase() + color.slice(1));

        // Crear un conjunto de condiciones OR para que coincida al menos con uno de los colores
        const colorConditions = formattedColors.map((color) => `color.cs.{${color}}`).join(",");

        query = query.or(colorConditions);
    }
    if (filters.family) {
        query = query.ilike("family", `%${filters.family}%`);
    }
    if (filters.trigger) {
        query = query.not("trigger", "is", null).neq("trigger", "");
    }
    if (filters.ability && filters.ability.length > 0) {
        filters.ability.forEach((ability) => {
            query = query.ilike("ability", `%${ability}%`);
        });
    }
    if (filters.set_name) {
        query = query.eq("set_name", filters.set_name);
    }
    if (filters.attribute_name && filters.attribute_name.length > 0) {
        query = query.in("attribute_name", filters.attribute_name); // Ensure this matches your SQL logic
    }

    // Filtros por rango para "cost"
    if (filters.cost_gte !== undefined || filters.cost_lte !== undefined) {
        if (filters.cost_gte === "null" && filters.cost_lte === "null") {
            // Caso 1: Ambos son null, traer solo las cartas cuyo cost es null
            query = query.or("cost.is.null");
        } else if (filters.cost_gte === "null" && filters.cost_lte !== "null") {
            // Caso 2: cost_gte es null y cost_lte es un número
            query = query.or(`cost.is.null,cost.lte.${Number(filters.cost_lte)}`);
        } else if (filters.cost_gte !== "null" && filters.cost_lte !== "null") {
            // Caso 3: Ambos son números
            query = query.gte("cost", Number(filters.cost_gte)).lte("cost", Number(filters.cost_lte));
        }
    }

    // Filtros por rango para "power"
    if (filters.power_gte !== undefined || filters.power_lte !== undefined) {
        if (filters.power_gte !== undefined && filters.power_lte !== undefined) {
            if (filters.power_gte <= 0 && filters.power_lte >= 0) {
                query = query
                    .or(`power.gte.${filters.power_gte},power.is.null`)
                    .or(`power.lte.${filters.power_lte},power.is.null`);
            } else {
                query = query.gte("power", filters.power_gte).lte("power", filters.power_lte);
            }
        } else if (filters.power_gte !== undefined) {
            if (filters.power_gte <= 0) {
                query = query.or(`power.gte.${filters.power_gte},power.is.null`);
            } else {
                query = query.gte("power", filters.power_gte);
            }
        } else if (filters.power_lte !== undefined) {
            if (filters.power_lte >= 0) {
                query = query.or(`power.lte.${filters.power_lte},power.is.null`);
            } else {
                query = query.lte("power", filters.power_lte);
            }
        }
    }

    // Filtros por rango para "counter"
    if (filters.counter_gte !== undefined) {
        query = query.gte("counter", String(filters.counter_gte));
    }
    if (filters.counter_lte !== undefined) {
        query = query.lte("counter", String(filters.counter_lte));
    }
    
    if (filters.uniqueCodes === true || filters.uniqueCodes === "true") {
        query = query.order("code", { ascending: true }).order("id", { ascending: true });
        const { data: allCards, error } = await query;

        if (error) {
            throw new Error("Error al buscar las cartas: " + error.message);
        }

        const uniqueCards = Object.values(
            allCards.reduce((acc, card) => {
                if (!acc[card.code] || card.id < acc[card.code].id) {
                    acc[card.code] = card;
                }
                return acc;
            }, {})
        );

        const paginatedCards = uniqueCards.slice(offset, offset + limit); // Apply pagination after filtering
        return {
            data: paginatedCards,
            count: uniqueCards.length,
        };
    } else {
        console.log("UNIQUECODES", filters.uniqueCodes);
    
        // Calcula el rango basado en la página y el límite
        const start = offset; // Inicio del rango
        const end = offset + Number(limit) - 1; // Fin del rango

        console.log(`Page: ${page}, Limit: ${limit}`); // Log para depuración
        console.log(`Offset: ${offset}`); // Log para depuración

        console.log(`Applying range: start=${start}, end=${end}`); // Log para depuración
    
        query = query.range(start, end); // Limita los resultados a la página actual
    
        const { data: cards, error, count } = await query;
    
        if (error) {
            if (error.message && error.message.includes("Requested range not satisfiable")) {
                // Si el rango solicitado no tiene resultados, devuelve una respuesta vacía
                return { data: [], count: 0 };
            }
            throw new Error("Error al buscar las cartas: " + error.message);
        }
    
        console.log(`Fetched ${cards.length} cards for range: start=${start}, end=${end}`); // Log para depuración
    
        // Devuelve los resultados paginados
        return {
            data: cards,
            count: count, // Total de resultados
        };
    }
};

const getCardById = async (id) => {
    const { data: card, error } = await supabase.from("cards").select("*").eq("id", id).single();

    if (error) throw new Error("Error al obtener la carta: " + error.message);
    return card;
};

const getCardsByCode = async (code) => {
    const { data: cards, error } = await supabase.from("cards").select("*").eq("code", code);
    if (error) throw new Error("Error al obtener las cartas: " + error.message);
    return cards;
};

const getCardsByCodes = async (codes) => {
    try {
        console.log("Fetching cards by codes:", codes); // Log para depuración
        const { data, error } = await supabase.from("cards").select("*").in("id", codes);

        if (error) {
            throw error;
        }

        return data;
    } catch (err) {
        console.error("Error fetching cards by codes:", err);
        throw err;
    }
};

// Obtener todos los valores únicos de set_name
const getAllSetNames = async () => {
    const { data, error } = await supabase.rpc("get_unique_set_names");

    if (error) {
        throw new Error("Error al obtener los nombres de los sets: " + error.message);
    }

    return data; // Devuelve la lista de set_names únicos
};

const getAllFamilies = async () => {
    const { data, error } = await supabase.rpc("get_unique_families");

    if (error) {
        throw new Error("Error al obtener las familias: " + error.message);
    }

    return data; // Devuelve la lista de familias únicas
};

const getAllAttributes = async () => {
    const { data, error } = await supabase.rpc("get_unique_attribute_names_list");

    if (error) {
        throw new Error("Error al obtener los atributos: " + error.message);
    }

    return data; // Devuelve la lista de atributos con nombre y color
};

module.exports = {
    searchCards,
    getCardById,
    getCardsByCode,
    getAllSetNames,
    getAllFamilies,
    getAllAttributes,
    getCardsByCodes,
};
