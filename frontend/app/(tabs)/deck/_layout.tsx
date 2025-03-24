import React from "react";
import { Stack } from "expo-router";

export default function DeckLayout() {
    return (
        <Stack> 
            <Stack.Screen name="[deckId]" options={{ headerShown: false }} />
        </Stack>
    );
}
