import useApi from "@/hooks/useApi";
import { create } from "zustand";

interface SelectedCard {
    cardId: string;
    name: string;
    quantity: number;
    color: string;
}

interface StoreState {
    selectedCards: SelectedCard[];
    setSelectedCards: (cards: SelectedCard[]) => void;
    updateCardQuantity: (cardId: string, change: number, color: string, name: string) => void;
    selectedColors: string[];
    selectedSet: string | null;
    selectedFamily: string | null;
    selectedTypes: string[];
    selectedRarities: string[];
    triggerFilter: boolean;
    abilityFilters: string[];
    costRange: [number, number];
    powerRange: [number, number];
    counterRange: [number, number];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    setSelectedColors: (colors: string[]) => void;
    setSelectedSet: (set: string | null) => void;
    setSelectedFamily: (family: string | null) => void;
    setSelectedTypes: (types: string[]) => void;
    setSelectedRarities: (rarities: string[]) => void;
    setTriggerFilter: (trigger: boolean) => void;
    setAbilityFilters: (abilities: string[]) => void;
    setCostRange: (range: [number, number]) => void;
    setPowerRange: (range: [number, number]) => void;
    setCounterRange: (range: [number, number]) => void;
    selectedAttributes: string[];
    setSelectedAttributes: (attributes: string[]) => void;
    refreshDecks: boolean;
    setRefreshDecks: (refresh: boolean) => void;
    refreshFriends: boolean;
    setRefreshFriends: (refresh: boolean) => void;
}

const useStore = create<StoreState>((set) => ({
    selectedCards: [],
    setSelectedCards: (cards) => set({ selectedCards: cards }),
    updateCardQuantity: (cardId, change, color, name) =>
        set((state) => {
            const existingCard = state.selectedCards.find((card) => card.cardId === cardId);

            if (existingCard) {
                const updatedQuantity = Math.min(Math.max(existingCard.quantity + change, 0), 4);

                if (updatedQuantity === 0) {
                    return {
                        selectedCards: state.selectedCards.filter((card) => card.cardId !== cardId),
                    };
                }

                return {
                    selectedCards: state.selectedCards.map((card) =>
                        card.cardId === cardId ? { ...card, quantity: updatedQuantity } : card
                    ),
                };
            } else if (change > 0) {
                return {
                    selectedCards: [...state.selectedCards, { cardId, name, quantity: 1, color }],
                };
            }

            return state;
        }),
    selectedColors: [],
    selectedSet: null,
    selectedFamily: null,
    selectedTypes: [],
    selectedRarities: [],
    triggerFilter: false,
    abilityFilters: [],
    costRange: [0, 10],
    powerRange: [0, 13000],
    counterRange: [0, 2000],
    searchQuery: "",
    setSearchQuery: (query) =>
        set((state) => {
            if (state.searchQuery !== query) {
                return { searchQuery: query };
            }
            return state; // No actualiza si no hay cambios
        }),
    setSelectedColors: (colors) =>
        set((state) => {
            if (JSON.stringify(state.selectedColors) !== JSON.stringify(colors)) {
                return { selectedColors: colors };
            }
            return state; // No actualiza si no hay cambios
        }),
    setSelectedSet: (selectedSet) =>
        set((state) => {
            if (state.selectedSet !== selectedSet) {
                return { selectedSet };
            }
            return state; // No actualiza si no hay cambios
        }),
    setSelectedFamily: (family) =>
        set((state) => {
            if (state.selectedFamily !== family) {
                return { selectedFamily: family };
            }
            return state; // No actualiza si no hay cambios
        }),
    setSelectedTypes: (types) =>
        set((state) => {
            if (JSON.stringify(state.selectedTypes) !== JSON.stringify(types)) {
                return { selectedTypes: types };
            }
            return state; // No actualiza si no hay cambios
        }),
    setSelectedRarities: (rarities) =>
        set((state) => {
            if (JSON.stringify(state.selectedRarities) !== JSON.stringify(rarities)) {
                return { selectedRarities: rarities };
            }
            return state; // No actualiza si no hay cambios
        }),
    setTriggerFilter: (trigger) =>
        set((state) => {
            if (state.triggerFilter !== trigger) {
                return { triggerFilter: trigger };
            }
            return state; // No actualiza si no hay cambios
        }),
    setAbilityFilters: (abilities) =>
        set((state) => {
            if (JSON.stringify(state.abilityFilters) !== JSON.stringify(abilities)) {
                return { abilityFilters: abilities };
            }
            return state; // No actualiza si no hay cambios
        }),
    setCostRange: (range) =>
        set((state) => {
            if (JSON.stringify(state.costRange) !== JSON.stringify(range)) {
                return { costRange: range };
            }
            return state; // No actualiza si no hay cambios
        }),
    setPowerRange: (range) =>
        set((state) => {
            if (JSON.stringify(state.powerRange) !== JSON.stringify(range)) {
                return { powerRange: range };
            }
            return state; // No actualiza si no hay cambios
        }),
    setCounterRange: (range) =>
        set((state) => {
            if (JSON.stringify(state.counterRange) !== JSON.stringify(range)) {
                return { counterRange: range };
            }
            return state; // No actualiza si no hay cambios
        }),
    selectedAttributes: [],
    setSelectedAttributes: (attributes) =>
        set((state) => {
            if (JSON.stringify(state.selectedAttributes) !== JSON.stringify(attributes)) {
                return { selectedAttributes: attributes };
            }
            return state; // No update if no changes
        }),
    refreshDecks: false,
    setRefreshDecks: (refresh) => set({ refreshDecks: refresh }),
    refreshFriends: false,
    setRefreshFriends: (refresh) => set({ refreshFriends: refresh }),
}));

export default useStore;
