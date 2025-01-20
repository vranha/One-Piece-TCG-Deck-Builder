const { supabase } = require('../services/supabaseClient');

// Validar colores (mínimo 1, máximo 2, y deben existir en la tabla colors)
// Validar colores (mínimo 1, máximo 2, y deben existir en la tabla colors)
const validateColors = async (colors) => {
    if (!Array.isArray(colors) || colors.length < 1 || colors.length > 2) {
        throw new Error('Debes seleccionar entre 1 y 2 colores.');
    }

    const { data: validColors, error } = await supabase
        .from('colors')
        .select('id')
        .in('id', colors);

    if (error) throw new Error('Error al validar los colores.');
    if (validColors.length !== colors.length) {
        throw new Error('Uno o más colores seleccionados no son válidos.');
    }

    return validColors;
};

// Crear un nuevo mazo con colores
const createDeck = async (userId, name, description, colors) => {
    // Validar los colores (debe existir al menos 1 color, máximo 2)
    const validColors = await validateColors(colors);

    // Insertar el mazo en la tabla 'decks'
    const { data: deck, error: deckError } = await supabase
        .from('decks')
        .insert([{ user_id: userId, name, description }])
        .select()
        .single();

    if (deckError) {
        console.error('Error al insertar el mazo:', deckError);
        throw new Error('Error al crear el mazo: ' + deckError.message);
    }

    console.log('Mazo insertado:', deck);

    // Asociar los colores al mazo en la tabla 'deck_colors'
    const colorAssociations = validColors.map((color) => ({
        deck_id: deck.id,
        color_id: color.id,
    }));

    const { error: colorError } = await supabase
        .from('deck_colors')
        .insert(colorAssociations);

    if (colorError) {
        console.error('Error al asociar colores al mazo:', colorError);
        throw new Error('Error al asociar colores al mazo: ' + colorError.message);
    }

    return deck;
};



// Editar un mazo (nombre, descripción, y colores)
const editDeck = async (deckId, name, description, colors) => {
    let validColors = [];
    if (colors) {
        validColors = await validateColors(colors);
    }

    const { data: updatedDeck, error: updateError } = await supabase
        .from('decks')
        .update({ name, description, updated_at: new Date() })
        .eq('id', deckId)
        .select()
        .single();

    if (updateError) throw new Error('Error al actualizar el mazo.');

    if (colors) {
        const { error: deleteError } = await supabase
            .from('deck_colors')
            .delete()
            .eq('deck_id', deckId);

        if (deleteError) throw new Error('Error al eliminar colores antiguos.');

        const colorAssociations = validColors.map((color) => ({
            deck_id: deckId,
            color_id: color.id,
        }));

        const { error: insertError } = await supabase
            .from('deck_colors')
            .insert(colorAssociations);

        if (insertError) throw new Error('Error al asociar nuevos colores.');
    }

    return updatedDeck;
};

// Obtener los mazos de un usuario con sus colores
const getUserDecks = async (userId, page = 1, limit = 10, search = '') => {
    const offset = (page - 1) * limit;  // Calcular el desplazamiento para la paginación

    const { data: decks, error, count } = await supabase
        .from('decks')
        .select('*, deck_colors(color_id)', { count: 'exact' }) // Contamos el total de registros
        .eq('user_id', userId) // Filtramos por el ID del usuario
        .ilike('name', `%${search}%`) // Filtrado por nombre (búsqueda parcial)
        .range(offset, offset + limit - 1);  // Limitamos los resultados con paginación

    if (error) throw new Error('Error al obtener los mazos.');

    return {
        data: decks,
        count: count,  // Total de registros (para calcular la paginación)
    };
};


// Añadir cartas a un mazo
const addCardToDeck = async (deckId, cardId, quantity) => {
    const { data, error } = await supabase
        .from('deck_cards')
        .insert([{ deck_id: deckId, card_id: cardId, quantity }]);

    if (error) throw new Error('Error al añadir la carta al mazo.');

    return data;
};

// Eliminar un mazo y sus asociaciones
const deleteDeck = async (deckId) => {
    const { error } = await supabase
        .from('decks')
        .delete()
        .eq('id', deckId);

    if (error) throw new Error('Error al eliminar el mazo.');

    return { message: 'Mazo eliminado con éxito' };
};

module.exports = {
    createDeck,
    editDeck,
    deleteDeck,
    getUserDecks,
    addCardToDeck,
};
