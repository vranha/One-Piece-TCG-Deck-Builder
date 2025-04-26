import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import useApi from "@/hooks/useApi"; // Import the useApi hook
import { supabase } from "@/supabaseClient";

const CollectionDetails = () => {
    const route = useRoute<RouteProp<{ params: { collectionId: string } }, "params">>();
    const { collectionId } = route.params;
    const api = useApi(); // Initialize the API instance

    interface Collection {
        name: string;
        description: string;
        collection_cards: { card_id: string }[];
    }

    const [collection, setCollection] = useState<Collection | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCollection = async () => {
            try {
                const { data: session, error } = await supabase.auth.getSession();
                if (error || !session?.session?.access_token) {
                    throw new Error("No se pudo obtener el token de sesión");
                }

                const token = session.session.access_token;

                const response = await api.get(`/collection/${collectionId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`, // Usar el token obtenido dinámicamente
                    },
                });
                console.log("Collection response:", response.data); // Debugging line
                setCollection(response.data.data);
            } catch (error) {
                console.error("Error fetching collection:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCollection();
    }, [collectionId]);

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (!collection) {
        return (
            <View style={styles.container}>
                <Text>Collection not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{collection.name}</Text>
            <Text style={styles.description}>{collection.description}</Text>
            <FlatList
                data={collection.collection_cards}
                keyExtractor={(item) => item.card_id}
                renderItem={({ item }) => <Text style={styles.card}>{item.card_id}</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        marginBottom: 16,
    },
    card: {
        fontSize: 14,
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
    },
});

export default CollectionDetails;
