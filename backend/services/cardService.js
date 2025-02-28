const { supabase } = require('../services/supabaseClient');

// Buscar cartas con paginación y filtros
const searchCards = async (page = 1, limit = 10, search = '', filters = {}) => {
    const offset = (page - 1) * limit;  // Calcular el desplazamiento para la paginación

    let query = supabase
        .from('cards')
        .select('*', { count: 'exact' }) // Contamos el total de registros
        .or(`name.ilike.%${search}%,code.ilike.%${search}%`) // Filtrado por nombre o código (búsqueda parcial)
        .range(offset, offset + limit - 1);  // Limitamos los resultados con paginación

    // Aplicar filtros adicionales
    if (filters.rarity) {
        query = query.eq('rarity', filters.rarity);
    }
    if (filters.type) {
        query = query.eq('type', filters.type);
    }
    if (filters.cost) {
        query = query.eq('cost', filters.cost);
    }
    if (filters.power) {
        query = query.eq('power', filters.power);
    }
    if (filters.counter) {
        query = query.eq('counter', filters.counter);
    }
    if (filters.color) {
        query = query.eq('color', filters.color);
    }
    if (filters.family) {
        query = query.eq('family', filters.family);
    }
    if (filters.trigger !== undefined) {
        query = query.eq('trigger', filters.trigger);
    }

    const { data: cards, error, count } = await query;

    if (error) throw new Error('Error al buscar las cartastrt.', error);

    return {
        data: cards,
        count: count,  // Total de registros (para calcular la paginación)
    };
};

const getCardById = async (id) => {
    const { data: card, error } = await supabase
        .from('cards')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw new Error('Error al obtener la carta.');

    return card;
};

module.exports = {
    searchCards,
    getCardById,
};