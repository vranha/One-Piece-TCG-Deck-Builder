const { supabase } = require('../services/supabaseClient');

const colorNameToId = {
    red: 1,
    blue: 2,
    green: 3,
    yellow: 4,
    purple: 5,
    black: 6,
};

const normalizeColors = (colors) => {
    return colors.map(color => typeof color === 'string' ? colorNameToId[color.toLowerCase()] : color);
};

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

const createDeck = async (userId, name, description, colors, leaderCardId) => {
    const normalizedColors = normalizeColors(colors);
    const validColors = await validateColors(normalizedColors);
    console.log('Colores válidos:', validColors);

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

    // Añadir la carta LEADER a la tabla deck_cards
    const { error: cardError } = await supabase
        .from('deck_cards')
        .insert([{ deck_id: deck.id, card_id: leaderCardId, quantity: 1, is_leader: true }]);

    if (cardError) {
        console.error('Error al añadir la carta LEADER al mazo:', cardError);
        throw new Error('Error al añadir la carta LEADER al mazo: ' + cardError.message);
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

// Obtener los mazos de un usuario con sus colores y datos de la carta líder
const getUserDecks = async (userId, page = 1, limit = 10, search = '', color) => {
    const offset = (page - 1) * limit;

    let query = supabase
        .from('decks')
        .select(`
            *,
            deck_colors(color_id),
            deck_cards(
                card_id,
                quantity,
                is_leader,
                cards!inner(id, images_small)
            )
        `, { count: 'exact' }) // Añadir count: 'exact' para obtener el número total de registros
        .eq('user_id', userId)
        .ilike('name', `%${search}%`)
        .range(offset, offset + limit - 1);

    if (color) {
        const colorId = colorNameToId[color.toLowerCase()];
        console.log('Filtrando por color:', colorId);
        query = query.in('id', supabase
            .from('deck_colors')
            .select('deck_id')
            .eq('color_id', colorId)
        );
    }

    const { data: decks, error, count } = await query;

    if (error) {
        console.error("Supabase error:", error.message);
        throw new Error(error.message); // Muestra el mensaje real de Supabase
    }

    // Procesar los mazos para incluir la cantidad total de cartas
    const decksWithLeaderAndTotalCards = decks.map(deck => {
        const leaderCard = deck.deck_cards.find(card => card.is_leader);
        const totalCards = deck.deck_cards.reduce((sum, card) => sum + card.quantity, 0); // Sumar todas las quantities

        return {
            ...deck,
            leaderCardImage: leaderCard?.cards?.images_small || null,
            totalCards, // Añadir la cantidad total de cartas al mazo
        };
    });

    return {
        data: decksWithLeaderAndTotalCards,
        count,
    };
};

// Obtener un mazo por ID con todas sus cartas
const getDeckById = async (deckId) => {
    try {
        console.log('Obteniendo mazo con ID:', deckId);
        const { data: deck, error: deckError } = await supabase
            .from('decks')
            .select('*')
            .eq('id', deckId)
            .single();

        if (deckError) {
            console.error('Error al obtener el mazo:', deckError);
            throw new Error('Error al obtener el mazo.');
        }

        console.log('Mazo obtenido:', deck);

        const { data: deckCards, error: deckCardsError } = await supabase
            .from('deck_cards')
            .select('card_id, quantity, is_leader, cards!inner(*)')
            .eq('deck_id', deckId);

        if (deckCardsError) {
            console.error('Error al obtener las cartas del mazo:', deckCardsError);
            throw new Error('Error al obtener las cartas del mazo.');
        }

        console.log('Cartas del mazo obtenidas:', deckCards);

        return {
            ...deck,
            cards: deckCards.map(dc => ({
                ...dc.cards,
                quantity: dc.quantity,
                is_leader: dc.is_leader,
            })),
        };
    } catch (error) {
        console.error('Error en getDeckById:', error);
        throw new Error('Error al obtener el mazo.');
    }
};


// Añadir cartas a un mazo
const addCardToDeck = async (deckId, cardId, quantity) => {
    try {
        // Verificar si ya existe un registro con el mismo deck_id y card_id
        const { data: existingCard, error: fetchError } = await supabase
            .from('deck_cards')
            .select('id, quantity')
            .eq('deck_id', deckId)
            .eq('card_id', cardId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // Ignorar error si no se encuentra el registro
            throw new Error('Error al verificar la existencia de la carta en el mazo.');
        }

        if (existingCard) {
            // Si ya existe, actualizar la cantidad sumando la existente con la nueva
            const newQuantity = existingCard.quantity + quantity;

            const { error: updateError } = await supabase
                .from('deck_cards')
                .update({ quantity: newQuantity })
                .eq('id', existingCard.id);

            if (updateError) {
                throw new Error('Error al actualizar la cantidad de la carta en el mazo.');
            }

            return { message: 'Cantidad actualizada correctamente', newQuantity };
        } else {
            // Si no existe, insertar un nuevo registro
            const { data, error: insertError } = await supabase
                .from('deck_cards')
                .insert([{ deck_id: deckId, card_id: cardId, quantity }]);

            if (insertError) {
                throw new Error('Error al añadir la carta al mazo.');
            }

            return { message: 'Carta añadida correctamente', data };
        }
    } catch (error) {
        console.error('Error en addCardToDeck:', error.message);
        throw new Error(error.message);
    }
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
    getDeckById
};
