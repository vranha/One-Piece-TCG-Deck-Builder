const { supabase } = require("../services/supabaseClient");

const colorNameToId = {
    red: 1,
    blue: 2,
    green: 3,
    yellow: 4,
    purple: 5,
    black: 6,
};

const normalizeColors = (colors) => {
    return colors.map((color) => (typeof color === "string" ? colorNameToId[color.toLowerCase()] : color));
};

const validateColors = async (colors) => {
    if (!Array.isArray(colors) || colors.length < 1 || colors.length > 2) {
        throw new Error("Debes seleccionar entre 1 y 2 colores.");
    }

    const { data: validColors, error } = await supabase.from("colors").select("id").in("id", colors);

    if (error) throw new Error("Error al validar los colores.");
    if (validColors.length !== colors.length) {
        throw new Error("Uno o más colores seleccionados no son válidos.");
    }

    return validColors;
};

const createDeck = async (userId, name, description, colors, leaderCardId) => {
    const normalizedColors = normalizeColors(colors);
    const validColors = await validateColors(normalizedColors);
    console.log("Colores válidos:", validColors);

    const { data: deck, error: deckError } = await supabase
        .from("decks")
        .insert([{ user_id: userId, name, description }])
        .select()
        .single();

    if (deckError) {
        console.error("Error al insertar el mazo:", deckError);
        throw new Error("Error al crear el mazo: " + deckError.message);
    }

    console.log("Mazo insertado:", deck);

    const colorAssociations = validColors.map((color) => ({
        deck_id: deck.id,
        color_id: color.id,
    }));

    const { error: colorError } = await supabase.from("deck_colors").insert(colorAssociations);

    if (colorError) {
        console.error("Error al asociar colores al mazo:", colorError);
        throw new Error("Error al asociar colores al mazo: " + colorError.message);
    }

    // Añadir la carta LEADER a la tabla deck_cards
    const { error: cardError } = await supabase
        .from("deck_cards")
        .insert([{ deck_id: deck.id, card_id: leaderCardId, quantity: 1, is_leader: true }]);

    if (cardError) {
        console.error("Error al añadir la carta LEADER al mazo:", cardError);
        throw new Error("Error al añadir la carta LEADER al mazo: " + cardError.message);
    }

    return deck;
};

// Editar un mazo (nombre, descripción, y colores)
const editDeck = async (deckId, name, description, colors) => {
    console.log("Received payload:", { name, description, colors }); // Debugging log

    let validColors = [];
    if (colors) {
        validColors = await validateColors(colors);
    }

    const { data: updatedDeck, error: updateError } = await supabase
        .from("decks")
        .update({ name, description, updated_at: new Date() })
        .eq("id", deckId)
        .select()
        .single();

    if (updateError) {
        console.error("Error updating deck:", updateError);
        throw new Error("Error al actualizar el mazo.");
    }

    console.log("Updated deck:", updatedDeck); // Debugging log

    if (colors) {
        const { error: deleteError } = await supabase.from("deck_colors").delete().eq("deck_id", deckId);

        if (deleteError) throw new Error("Error al eliminar colores antiguos.");

        const colorAssociations = validColors.map((color) => ({
            deck_id: deckId,
            color_id: color.id,
        }));

        const { error: insertError } = await supabase.from("deck_colors").insert(colorAssociations);

        if (insertError) throw new Error("Error al asociar nuevos colores.");
    }

    return updatedDeck;
};

// Obtener los mazos de un usuario con sus colores y datos de la carta líder
const getUserDecks = async (userId, page = 1, limit = 10, search = "", color) => {
    const offset = (page - 1) * limit;

    let query = supabase
        .from("decks")
        .select(
            `
            *,
            deck_colors(color_id),
            deck_cards(
                card_id,
                quantity,
                is_leader,
                cards!inner(id, images_small)
            )
        `,
            { count: "exact" }
        ) // Añadir count: 'exact' para obtener el número total de registros
        .eq("user_id", userId)
        .ilike("name", `%${search}%`)
        .range(offset, offset + limit - 1);

    if (color) {
        const colorId = colorNameToId[color.toLowerCase()];
        console.log("Filtrando por color:", colorId);
        query = query.in("id", supabase.from("deck_colors").select("deck_id").eq("color_id", colorId));
    }

    const { data: decks, error, count } = await query;

    if (error) {
        console.error("Supabase error:", error.message);
        throw new Error(error.message); // Muestra el mensaje real de Supabase
    }

    // Procesar los mazos para incluir la cantidad total de cartas
    const decksWithLeaderAndTotalCards = decks.map((deck) => {
        const leaderCard = deck.deck_cards.find((card) => card.is_leader);
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
        console.log("Obteniendo mazo con ID:", deckId);
        const { data: deck, error: deckError } = await supabase.from("decks").select("*").eq("id", deckId).single();

        if (deckError) {
            console.error("Error al obtener el mazo:", deckError);
            throw new Error("Error al obtener el mazo.");
        }

        console.log("Mazo obtenido:", deck);

        const { data: deckCards, error: deckCardsError } = await supabase
            .from("deck_cards")
            .select("card_id, quantity, is_leader, cards!inner(*)")
            .eq("deck_id", deckId);

        if (deckCardsError) {
            console.error("Error al obtener las cartas del mazo:", deckCardsError);
            throw new Error("Error al obtener las cartas del mazo.");
        }

        console.log("Cartas del mazo obtenidas:", deckCards);

        return {
            ...deck,
            cards: deckCards.map((dc) => ({
                ...dc.cards,
                quantity: dc.quantity,
                is_leader: dc.is_leader,
            })),
        };
    } catch (error) {
        console.error("Error en getDeckById:", error);
        throw new Error("Error al obtener el mazo.");
    }
};

// Añadir cartas a un mazo
const addCardToDeck = async (deckId, cardId, quantity) => {
    try {
        // Verificar si ya existe un registro con el mismo deck_id y card_id
        const { data: existingCard, error: fetchError } = await supabase
            .from("deck_cards")
            .select("id, quantity")
            .eq("deck_id", deckId)
            .eq("card_id", cardId)
            .single();

        if (fetchError && fetchError.code !== "PGRST116") {
            // Ignorar error si no se encuentra el registro
            throw new Error("Error al verificar la existencia de la carta en el mazo.");
        }

        if (existingCard) {
            // Si ya existe, actualizar la cantidad sumando la existente con la nueva
            const newQuantity = existingCard.quantity + quantity;

            const { error: updateError } = await supabase
                .from("deck_cards")
                .update({ quantity: newQuantity })
                .eq("id", existingCard.id);

            if (updateError) {
                throw new Error("Error al actualizar la cantidad de la carta en el mazo.");
            }

            return { message: "Cantidad actualizada correctamente", newQuantity };
        } else {
            // Si no existe, insertar un nuevo registro
            const { data, error: insertError } = await supabase
                .from("deck_cards")
                .insert([{ deck_id: deckId, card_id: cardId, quantity }]);

            if (insertError) {
                throw new Error("Error al añadir la carta al mazo.");
            }

            return { message: "Carta añadida correctamente", data };
        }
    } catch (error) {
        console.error("Error en addCardToDeck:", error.message);
        throw new Error(error.message);
    }
};

// Añadir múltiples cartas a un mazo
async function addMultipleCardsToDeck(deckId, cards) {
    try {
        for (const { cardId, quantity } of cards) {
            // Verificar si la carta ya está en el mazo
            const { data: existingCards, error } = await supabase
                .from("deck_cards")
                .select("id, quantity")
                .eq("deck_id", deckId)
                .eq("card_id", cardId)
                .single();

            if (error && error.code !== "PGRST116") {
                console.error("Error al obtener la carta del mazo:", error);
                continue;
            }

            if (existingCards) {
                // Si la carta ya existe, sumamos la cantidad sin sobrepasar 4
                const newQuantity = Math.min(existingCards.quantity + quantity, 4);
                await supabase.from("deck_cards").update({ quantity: newQuantity }).eq("id", existingCards.id);
            } else {
                // Si la carta no existe en el mazo, la insertamos pero con máximo 4 copias
                const insertQuantity = Math.min(quantity, 4);
                await supabase.from("deck_cards").insert([
                    {
                        deck_id: deckId,
                        card_id: cardId,
                        quantity: insertQuantity,
                    },
                ]);
            }
        }
        console.log("Cartas agregadas correctamente al mazo.");
    } catch (err) {
        console.error("Error al agregar cartas al mazo:", err);
    }
}

async function syncDeckCards(deckId, newCards) {
    try {
        // Validar que cada carta tenga cardId, quantity, y opcionalmente is_leader
        if (!Array.isArray(newCards)) {
            throw new Error("newCards debe ser un array.");
        }

        newCards.forEach((card) => {
            if (!card.cardId || typeof card.quantity !== "number") {
                throw new Error(`Datos inválidos en newCards: ${JSON.stringify(card)}`);
            }
        });

        // 1. Obtener el estado actual del mazo
        const { data: currentCards, error } = await supabase
            .from("deck_cards")
            .select("id, card_id, quantity, is_leader")
            .eq("deck_id", deckId);

        if (error) {
            console.error("Error al obtener cartas actuales:", error);
            return;
        }

        const currentMap = new Map();
        currentCards.forEach((card) => currentMap.set(card.card_id, card));

        const newCardIds = newCards.map((c) => c.cardId);
        const processedCardIds = new Set();

        // 2. Procesar cada carta del nuevo array
        for (const { cardId, quantity, is_leader = false } of newCards) {
            if (!cardId) {
                console.error("cardId es inválido:", cardId);
                continue;
            }

            const existingCard = currentMap.get(cardId);

            // Proteger la carta líder
            if (existingCard?.is_leader) {
                processedCardIds.add(cardId); // Marcar como procesada
                continue; // Saltar cualquier modificación de la carta líder
            }

            const clampedQuantity = Math.max(0, Math.min(quantity, 4)); // límites del juego
            processedCardIds.add(cardId);

            if (existingCard) {
                if (clampedQuantity === 0) {
                    // Si la nueva cantidad es 0, eliminar la carta
                    await supabase.from("deck_cards").delete().eq("id", existingCard.id);
                } else if (existingCard.quantity !== clampedQuantity || existingCard.is_leader !== is_leader) {
                    // Si la cantidad o is_leader han cambiado, actualizar
                    await supabase
                        .from("deck_cards")
                        .update({ quantity: clampedQuantity, is_leader })
                        .eq("id", existingCard.id);
                }
                // Si es igual, no hacer nada
            } else if (clampedQuantity > 0) {
                // Insertar nueva carta
                console.log("Insertando nueva carta:", {
                    deck_id: deckId,
                    card_id: cardId,
                    quantity: clampedQuantity,
                    is_leader,
                });
                await supabase.from("deck_cards").insert([
                    {
                        deck_id: deckId,
                        card_id: cardId,
                        quantity: clampedQuantity,
                        is_leader,
                    },
                ]);
            }
        }

        // 3. Eliminar cartas que ya no están en el nuevo array, excepto la carta líder
        for (const card of currentCards) {
            if (!processedCardIds.has(card.card_id) && !card.is_leader) {
                await supabase.from("deck_cards").delete().eq("id", card.id);
            }
        }

        console.log("Mazo sincronizado correctamente.");
    } catch (err) {
        console.error("Error al sincronizar el mazo:", err);
    }
}

// Eliminar un mazo y sus asociaciones
const deleteDeck = async (deckId) => {
    // Eliminar las cartas asociadas al mazo
    const { error: cardsError } = await supabase.from("deck_cards").delete().eq("deck_id", deckId);
    if (cardsError) throw new Error("Error al eliminar las cartas asociadas al mazo.");

    // Eliminar los colores asociados al mazo
    const { error: colorsError } = await supabase.from("deck_colors").delete().eq("deck_id", deckId);
    if (colorsError) throw new Error("Error al eliminar los colores asociados al mazo.");

    // Eliminar las etiquetas asociadas al mazo
    const { error: tagsError } = await supabase.from("deck_tags").delete().eq("deck_id", deckId);
    if (tagsError) throw new Error("Error al eliminar las etiquetas asociadas al mazo.");

    // Eliminar el mazo
    const { error: deckError } = await supabase.from("decks").delete().eq("id", deckId);
    if (deckError) throw new Error("Error al eliminar el mazo.");

    return { message: "Mazo eliminado con éxito" };
};

const getDeckTags = async (deckId) => {
    const { data: tags, error } = await supabase
        .from("deck_tags")
        .select("tags(id, name, color)")
        .eq("deck_id", deckId);

    if (error) {
        console.error("Error al obtener etiquetas del mazo:", error);
        throw new Error("Error al obtener etiquetas del mazo.");
    }

    return tags.map((tag) => tag.tags); // Map to return only the tag details
};

const getAllTags = async () => {
    const { data: tags, error } = await supabase.from("tags").select("*");
    if (error) {
        console.error("Error al obtener todas las etiquetas:", error);
        throw new Error("Error al obtener todas las etiquetas.");
    }
    return tags;
};

const addTagToDeck = async (deckId, tagId) => {
    const { error } = await supabase.from("deck_tags").insert([{ deck_id: deckId, tag_id: tagId }]);
    if (error) {
        console.error("Error al añadir etiqueta al mazo:", error);
        throw new Error("Error al añadir etiqueta al mazo.");
    }
};

const removeTagFromDeck = async (deckId, tagId) => {
    const { error } = await supabase.from("deck_tags").delete().eq("deck_id", deckId).eq("tag_id", tagId);
    if (error) {
        console.error("Error al eliminar etiqueta del mazo:", error);
        throw new Error("Error al eliminar etiqueta del mazo.");
    }
};

const getAllDecks = async (page = 1, limit = 10, excludeUserId, search = "", colors = "", isCompleted, tags) => {
    const offset = (page - 1) * limit;

    // Step 1: Fetch all decks from the `decks` table with search and user exclusion filters
    let query = supabase
        .from("decks")
        .select(
            `
            *,
            deck_cards(card_id, quantity, is_leader, cards(*)),
            deck_colors(color_id, colors(*)),
            deck_tags(tag_id, tags(*)),
            users(id, username, avatar_url)
        `,
            { count: "exact" }
        )
        .eq("is_public", true) // Filter for public decks
        .range(offset, offset + limit - 1);

    if (excludeUserId) {
        query = query.neq("user_id", excludeUserId);
    }

    if (search) {
        query = query.ilike("name", `%${search}%`); // Apply search filter
    }

    const { data: allDecks, error: decksError, count } = await query;

    if (decksError) {
        throw new Error("Error fetching decks.");
    }

    // Step 2: If colors are provided, filter decks by matching `deck_id` in `deck_colors`
    let filteredDecks = allDecks;
    if (colors) {
        const colorIds = colors.split(",").map((color) => colorNameToId[color.toLowerCase()]);
        const { data: deckColors, error: colorError } = await supabase
            .from("deck_colors")
            .select("deck_id, color_id")
            .in("color_id", colorIds);

        if (colorError) {
            throw new Error("Error filtering by colors.");
        }

        const filteredDeckIds = new Set(deckColors.map((deckColor) => deckColor.deck_id));
        filteredDecks = filteredDecks.filter((deck) => filteredDeckIds.has(deck.id));
    }

    // Step 3: Apply isCompleted filter
    if (isCompleted !== undefined) {
        filteredDecks = filteredDecks.filter((deck) => {
            const totalQuantity = deck.deck_cards.reduce((sum, card) => sum + card.quantity, 0);
            return isCompleted ? totalQuantity === 51 : totalQuantity !== 51;
        });
    }
    // Step 4: Apply tags filter
    if (tags) {
        const tagIds = tags.split(",");
        filteredDecks = filteredDecks.filter(
            (deck) => console.log(tagIds) || deck.deck_tags.some((deckTag) => tagIds.includes(deckTag.tag_id))
        );
    }

    // Step 5: Return filtered decks
    return {
        data: filteredDecks,
        total: filteredDecks.length,
        page,
        limit,
        totalPages: Math.ceil(filteredDecks.length / limit),
    };
};

module.exports = {
    createDeck,
    editDeck,
    deleteDeck,
    getUserDecks,
    addCardToDeck,
    addMultipleCardsToDeck,
    syncDeckCards,
    getDeckById,
    getDeckTags,
    getAllTags,
    addTagToDeck,
    removeTagFromDeck,
    getAllDecks,
};
