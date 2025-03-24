const { supabase } = require("../services/supabaseClient");

// Buscar cartas con paginación y filtros
const searchCards = async (page = 1, limit = 10, search = "", filters = {}) => {
    const offset = (page - 1) * limit;

    let query = supabase
        .from("cards")
        .select("*", { count: "exact" })
        // Búsqueda parcial por nombre o código
        .or(`name.ilike.%${search}%,code.ilike.%${search}%`)
        .range(offset, offset + limit - 1);

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
    if (filters.color) {
        query = query.eq("color", filters.color);
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

    // Filtros por rango para "cost"
    if (filters.cost_gte !== undefined) {
        query = query.gte("cost", Number(filters.cost_gte));
    }
    if (filters.cost_lte !== undefined) {
        query = query.lte("cost", Number(filters.cost_lte));
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

    const { data: cards, error, count } = await query;

    if (error) {
        // Si se produce el error "Requested range not satisfiable", retornamos un array vacío
        if (error.message && error.message.includes("Requested range not satisfiable")) {
            return { data: [], count: 0 };
        }
        throw new Error("Error al buscar las cartas: " + error.message);
    }

    return {
        data: cards,
        count: count,
    };
};

const getCardById = async (id) => {
    const { data: card, error } = await supabase.from("cards").select("*").eq("id", id).single();

    if (error) throw new Error("Error al obtener la carta: " + error.message);
    return card;
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

module.exports = {
    searchCards,
    getCardById,
    getAllSetNames,
    getAllFamilies,
};
