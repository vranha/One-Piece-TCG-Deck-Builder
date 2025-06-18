import React from "react";
import { Stack } from "expo-router";

export default function SearchersLayout() {
    return (
        <Stack> 
            <Stack.Screen name="searchers" options={{ headerShown: false }} />
        </Stack>
    );
}
