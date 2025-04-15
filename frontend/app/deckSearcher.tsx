import React, { useState, useEffect } from "react";
import { View, FlatList, Text, StyleSheet } from "react-native";
import useApi from "@/hooks/useApi";
import DeckSearcherHeader from "@/components/DeckSearcherHeader";

export default function DeckSearcher() {
    const [isDeckSearch, setIsDeckSearch] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [data, setData] = useState<
        { id: number; name?: string; users?: { name: string }; deck_cards?: any[]; username?: string; email?: string }[]
    >([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const api = useApi();

    useEffect(() => {
        setData([]); // Clear data when switching between decks and users
        const fetchData = async () => {
            try {
                const endpoint = isDeckSearch ? `/decks?page=${page}&limit=10` : `/users?page=${page}&limit=10`;
                const { data } = await api.get(endpoint, { params: { search: searchQuery } });
                setData(data.data);
                setTotalPages(data.totalPages);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, [isDeckSearch, searchQuery, page]);

    const renderDeckItem = ({ item }: any) => {
        if (!item || !item.name || !item.users) {
            return null; // Skip rendering if the item is invalid
        }
        return (
            <View style={styles.item}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text>Owner: {item.users.name}</Text>
                <Text>Total Cards: {item.deck_cards.length}</Text>
            </View>
        );
    };

    const renderUserItem = ({ item }: any) => (
        <View style={styles.item}>
            <Text style={styles.itemTitle}>{item.username}</Text>
            <Text>Email: {item.email}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <DeckSearcherHeader
                onSearchChange={setSearchQuery}
                isDeckSearch={isDeckSearch}
                toggleSearchMode={setIsDeckSearch}
            />
            <FlatList
                data={data}
                keyExtractor={(item: { id: number }) => item.id.toString()}
                renderItem={isDeckSearch ? renderDeckItem : renderUserItem}
            />
            <View style={styles.pagination}>
                <Text onPress={() => setPage((prev) => Math.max(prev - 1, 1))} style={styles.pageButton}>
                    Previous
                </Text>
                <Text>
                    Page {page} of {totalPages}
                </Text>
                <Text onPress={() => setPage((prev) => Math.min(prev + 1, totalPages))} style={styles.pageButton}>
                    Next
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    item: { marginBottom: 16, padding: 16, backgroundColor: "#f9f9f9", borderRadius: 8 },
    itemTitle: { fontSize: 18, fontWeight: "bold" },
    pagination: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
    pageButton: { color: "blue", textDecorationLine: "underline" },
});
