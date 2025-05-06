import React, { useState, useEffect, useMemo, useRef } from "react";
import {
    View,
    FlatList,
    Text,
    StyleSheet,
    Image,
    Modal,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import useApi from "@/hooks/useApi";
import { supabase } from "@/supabaseClient";
import DeckSearcherHeader from "@/components/DeckSearcherHeader";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import { Ionicons } from "@expo/vector-icons"; // Add this import for icons
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message"; // Import Toast
import { Modalize } from "react-native-modalize";

export default function DeckSearcher() {
    const router = useRouter();
    const [isDeckSearch, setIsDeckSearch] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [data, setData] = useState<
        { id: number; name?: string; users?: { name: string }; deck_cards?: any[]; username?: string; email?: string }[]
    >([]);
    const { theme } = useTheme();
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const api = useApi();
    const [isDropdownVisible, setDropdownVisible] = useState(false); // State for dropdown visibility
    const { t } = useTranslation();
    const [friends, setFriends] = useState<{ id: string; status: string; isSender: boolean }[]>([]);
    const [isCompleted, setIsCompleted] = useState(false);
    const [selectedTags, setSelectedTags] = useState<number[]>([]);
    const [tags, setTags] = useState<{ id: number; name: string; color: string }[]>([]);
    const [regionFilter, setRegionFilter] = useState<string | null>(null);
    const [deckCountFilter, setDeckCountFilter] = useState<"hasDecks" | "noDecks" | null>(null);

    const [userId, setUserId] = useState<string | null>(null); // Replace useMemo with useState
    const [isLoading, setIsLoading] = useState(false); // Add loading state
    const [selectedColors, setSelectedColors] = useState<string[]>([]); // State for selected colors

    const handleColorSelect = (color: string) => {
        setSelectedColors(
            selectedColors.includes(color)
                ? selectedColors.filter((c) => c !== color) // Remove color if already selected
                : [...selectedColors, color] // Add color if not selected
        );
    };

    const renderColorFilters = () => (
        <View style={styles.colorFilters}>
            {["blue", "red", "green", "yellow", "purple", "black"].map((color) => (
                <TouchableOpacity
                    key={color}
                    style={[
                        styles.colorCircleFilter,
                        selectedColors.includes(color)
                            ? { borderColor: Colors[theme].text }
                            : { borderColor: Colors[theme].backgroundSoft },
                    ]}
                    onPress={() => handleColorSelect(color)}
                >
                    <View style={[styles.colorCircleInner, { backgroundColor: color }]} />
                </TouchableOpacity>
            ))}
        </View>
    );

    useEffect(() => {
        const fetchUserId = async () => {
            try {
                // Refresh the session to ensure the token is valid
                const { data: refreshedSession, error } = await supabase.auth.refreshSession();
                if (error) {
                    console.error("Error refreshing session:", error);
                    setUserId(null);
                    return;
                }

                const session = refreshedSession?.session || (await supabase.auth.getSession()).data?.session;
                setUserId(session?.user?.id || null);
            } catch (error) {
                console.error("Error fetching user session:", error);
            }
        };

        fetchUserId();

        const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user?.id) {
                setUserId(session.user.id);
            } else {
                setUserId(null);
            }
        });

        return () => {
            subscription.subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        setData([]); // Clear data when switching between decks and users
        const fetchData = async () => {
            try {
                setIsLoading(true); // Set loading to true before fetching
                if (userId === null) return;
                const resolvedUserId = userId;

                const colorQuery = selectedColors.length > 0 ? `&colors=${selectedColors.join(",")}` : "";
                const isCompletedQuery = isCompleted ? `&isCompleted=${isCompleted}` : "";
                const tagsQuery = selectedTags.length > 0 ? `&tags=${selectedTags.join(",")}` : "";
                const regionQuery = regionFilter ? `&region=${regionFilter}` : "";
                const deckCountQuery = deckCountFilter ? `&deckCount=${deckCountFilter}` : "";

                const endpoint = isDeckSearch
                    ? `/decks?page=${page}&limit=10&search=${searchQuery}${colorQuery}${isCompletedQuery}${tagsQuery}`
                    : `/users?page=${page}&limit=10&search=${searchQuery}${regionQuery}${deckCountQuery}`;

                const { data } = await api.get(endpoint, {
                    params: {
                        excludeUserId: resolvedUserId,
                        is_public: true,
                    },
                });
                setData(data.data);
                console.log("Fetched data:", data.data);
                setTotalPages(data.totalPages);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false); // Set loading to false after fetching
            }
        };
        fetchData();
    }, [
        isDeckSearch,
        searchQuery,
        page,
        userId,
        selectedColors,
        isCompleted,
        selectedTags,
        regionFilter,
        deckCountFilter,
    ]); // Add new filters to dependencies

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const resolvedUserId = userId; // Resolve the userId from useMemo
                if (!resolvedUserId) return;

                const { data } = await api.get("/friends", { params: { userId: resolvedUserId } });
                setFriends(data);
            } catch (error) {
                console.error("Error fetching friends:", error);
            }
        };

        fetchFriends();
    }, [userId]);

    const handleSendFriendRequest = async (friendId: string) => {
        try {
            const resolvedUserId = userId; // Resolve the userId from useMemo
            if (!resolvedUserId) {
                console.error("User ID is null. Cannot send friend request.");
                Toast.show({
                    type: "error",
                    text1: t("error"),
                    text2: t("user_id_null"),
                });
                return;
            }
            const response = await api.post("/friends/request", { userId: resolvedUserId, friendId });
            console.log("Friend request sent:", response.data);
            Toast.show({
                type: "success",
                text1: t("success"),
                text2: t("friend_request_sent"),
            });

            // Reload the user list to update the button state
            const fetchFriends = async () => {
                try {
                    const { data } = await api.get("/friends", { params: { userId: resolvedUserId } });
                    setFriends(data);
                } catch (error) {
                    console.error("Error fetching friends:", error);
                }
            };
            fetchFriends();
        } catch (err) {
            console.error("Error sending friend request:", err);
            Toast.show({
                type: "error",
                text1: t("error"),
                text2: t("friend_request_failed"),
            });
        }
    };

    const renderDeckItem = ({ item }: any) => {
        if (!item || !item.name || !item.users) {
            return null; // Skip rendering if the item is invalid
        }

        const leaderCard = item.deck_cards.find((card: any) => card.is_leader);
        const leaderImage = leaderCard?.cards?.images_small;
        const deckColors = item.deck_colors.map((color: any) => color.colors.name);

        // Calculate the most represented family
        const calculateMostRepresentedFamily = (deckCards: any[]) => {
            const familyCounts: { [key: string]: number } = {};
            let mostRepresentedFamily = "";
            let mostRepresentedCount = 0;

            deckCards.forEach((card) => {
                if (!card.cards?.family) return;

                const families = card.cards.family.split("/").map((family: string) => family.trim());
                families.forEach((family: string) => {
                    familyCounts[family] = (familyCounts[family] || 0) + 1;
                    if (familyCounts[family] > mostRepresentedCount) {
                        mostRepresentedFamily = family;
                        mostRepresentedCount = familyCounts[family];
                    }
                });
            });

            return mostRepresentedFamily;
        };

        const calculateAverages = (deckCards: any[]) => {
            let totalCost = 0;
            let totalPower = 0;
            let totalCards = 0;

            deckCards.forEach((card) => {
                const quantity = card.quantity || 1;
                const cost = card.cards?.cost || 0;
                const power = card.cards?.power || 0;

                totalCost += cost * quantity;
                totalPower += power * quantity;
                totalCards += quantity;
            });

            const costAverage = totalCards > 0 ? (totalCost / totalCards).toFixed(1) : "0";
            const powerAverage = totalCards > 0 ? (totalPower / totalCards).toFixed(1) : "0";

            return { costAverage, powerAverage };
        };

        const mostRepresentedFamily = calculateMostRepresentedFamily(item.deck_cards);
        const { costAverage, powerAverage } = calculateAverages(item.deck_cards);

        return (
            <TouchableOpacity
                onPress={() => router.push({ pathname: `/(tabs)/deck/[deckId]`, params: { deckId: item.id } })}
                style={[
                    styles.item,
                    { backgroundColor: Colors[theme].TabBarBackground, borderColor: Colors[theme].tint },
                ]}
            >
                <View style={styles.cornerLeft}>
                    <View style={{ flexDirection: "row", gap: 1 }}>
                        {deckColors.map((color: any) => (
                            <View
                                key={color}
                                style={[
                                    styles.colorCircle,
                                    { backgroundColor: color, borderColor: Colors[theme].background },
                                ]}
                            />
                        ))}
                    </View>
                </View>
                <View style={styles.cornerRight}>
                    <TouchableOpacity
                        onPress={() =>
                            router.push({ pathname: `/(tabs)/user/[userId]`, params: { userId: item.users.id } })
                        }
                        style={[styles.ownerContainerBack, { backgroundColor: Colors[theme].background }]}
                        onPressIn={(e) => e.stopPropagation()} // Prevent parent Touchable from being triggered
                    >
                        <Image
                            source={{ uri: item.users.avatar_url }}
                            style={[styles.ownerContainer, { borderRadius: 50, width: 30, height: 30 }]}
                        />
                        <View style={[styles.ownerContainer, { backgroundColor: Colors[theme].background }]}>
                            <Text
                                style={{
                                    color: Colors[theme].tint,
                                    fontWeight: "bold",
                                    fontSize: 16,
                                    letterSpacing: 1.4,
                                }}
                            >
                                {item.users.username}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
                {leaderImage && (
                    <View style={styles.leaderImageContainer}>
                        <Image source={{ uri: leaderImage }} style={styles.leaderImage} />
                    </View>
                )}
                <View style={{ flexDirection: "row", gap: 10, flex: 1, justifyContent: "space-between" }}>
                    <View style={styles.itemContent}>
                        <View style={styles.itemTitleContainer}>
                            <Text style={[styles.itemTitle, { color: Colors[theme].text }]}>
                                {item.name.length > 12 ? `${item.name.slice(0, 12)}...` : item.name}
                            </Text>
                        </View>

                        <Text style={{ color: Colors[theme].tabIconDefault, fontWeight: "bold" }}>
                            {mostRepresentedFamily}
                        </Text>
                    </View>
                    <View style={styles.itemAverages}>
                        <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
                            <Text style={{ color: Colors[theme].tabIconDefault, fontWeight: "bold" }}>
                                {t("cost")}:
                            </Text>
                            <View
                                style={[
                                    styles.averageBall,
                                    {
                                        backgroundColor: Colors[theme].background,
                                        borderColor: Colors[theme].backgroundSoft,
                                    },
                                ]}
                            >
                                <Text style={{ color: Colors[theme].highlight, fontWeight: "bold", fontSize: 14 }}>
                                    {costAverage}
                                </Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
                            <Text style={{ color: Colors[theme].tabIconDefault, fontWeight: "bold" }}>
                                {t("power")}:
                            </Text>
                            <View
                                style={[
                                    styles.averageBall,
                                    {
                                        backgroundColor: Colors[theme].background,
                                        borderColor: Colors[theme].backgroundSoft,
                                    },
                                ]}
                            >
                                <Text style={{ color: Colors[theme].success, fontWeight: "bold", fontSize: 12 }}>
                                    {`${((powerAverage as any) / 1000).toFixed(1)}k`}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderUserItem = ({ item }: any) => {
        const friend = friends.find((f) => f.id === item.id);

        return (
            <TouchableOpacity
                // onPress={}
                style={[
                    styles.item,
                    {
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        backgroundColor: Colors[theme].TabBarBackground,
                    },
                ]}
                onPress={() => router.push({ pathname: `/(tabs)/user/[userId]`, params: { userId: item.id } })}
            >
                <Image source={{ uri: item.avatar_url }} style={{ width: 60, height: 60, borderRadius: 25 }} />
                <View style={{ flex: 1, gap: 5 }}>
                    <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                        <Text style={[styles.itemTitle, { color: Colors[theme].text }]}>{item.username}</Text>
                        {item.location && (
                            <Text style={{ color: Colors[theme].tabIconDefault, fontWeight: "bold", fontSize: 14 }}>
                                {item.location}
                            </Text>
                        )}
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <Text style={{ color: Colors[theme].tabIconDefault, fontWeight: "bold" }}>{t("deck")}s:</Text>
                        <Text style={{ color: Colors[theme].tint, fontWeight: "bold" }}>{item.deck_count || 0}</Text>
                    </View>
                    {item.top_colors?.length > 0 && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                            <Text style={{ color: Colors[theme].tabIconDefault, fontWeight: "bold" }}>
                                Top {t("colors")}:
                            </Text>
                            <View style={{ flexDirection: "row", gap: 2, alignItems: "center" }}>
                                {item.top_colors?.map((color: string, index: number) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.colorCircle,
                                            { backgroundColor: color, borderColor: Colors[theme].background },
                                        ]}
                                    />
                                ))}
                            </View>
                        </View>
                    )}
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 20, marginRight: 10 }}>
                    <View
                        style={[
                            styles.regionButton,
                            {
                                backgroundColor: item.region === "west" ? Colors[theme].info : Colors[theme].highlight,
                            },
                        ]}
                    >
                        <Text style={[styles.regionText, { color: Colors[theme].background }]}>
                            {item.region === "west" ? "West" : "East"}
                        </Text>
                    </View>
                    {friend ? (
                        friend.status === "accepted" ? (
                            <View style={{ width: 24, height: 24 }} />
                        ) : friend.status === "pending" ? (
                            <Ionicons name="hourglass-outline" size={24} color={Colors[theme].disabled} />
                        ) : (
                            <View style={{ width: 24, height: 24 }} />
                        )
                    ) : (
                        <TouchableOpacity onPress={() => handleSendFriendRequest(item.id)}>
                            <Ionicons name="person-add-sharp" size={24} color={Colors[theme].success} />
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderDropdown = () => (
        <Modal
            transparent={true}
            animationType="fade"
            visible={isDropdownVisible}
            onRequestClose={() => setDropdownVisible(false)}
        >
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDropdownVisible(false)}>
                <View style={[styles.dropdownContainer, { backgroundColor: Colors[theme].TabBarBackground }]}>
                    <ScrollView>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <TouchableOpacity
                                key={pageNum}
                                style={[
                                    styles.dropdownItem,
                                    { borderColor: Colors[theme].backgroundSoft },
                                    page === pageNum && styles.selectedDropdownItem,
                                ]}
                                onPress={() => {
                                    setPage(pageNum);
                                    setDropdownVisible(false);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.dropdownItemText,
                                        { color: Colors[theme].tabIconDefault },
                                        page === pageNum && styles.selectedDropdownItemText,
                                        page === pageNum && { color: Colors[theme].tint },
                                    ]}
                                >
                                    Page {pageNum}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );

    const modalizeRef = useRef<Modalize>(null);

    useEffect(() => {
        const fetchTags = async () => {
            if (!userId) return; // Wait until userId is available
            try {
                const response = await api.get("/tags");
                setTags(response.data);
            } catch (error) {
                console.error("Error fetching tags:", error);
            }
        };
        fetchTags();
    }, [userId]); // Add userId as a dependency

    const openFilterModal = () => {
        modalizeRef.current?.open();
    };

    const applyFilters = () => {
        modalizeRef.current?.close();
        setPage(1); // Reset to the first page
        setData([]); // Clear current data

        // Update filter states to trigger the useEffect
        setIsCompleted(isCompleted); // Update isCompleted filter
        setSelectedTags([...selectedTags]); // Update selectedTags filter
        setRegionFilter(regionFilter); // Update region filter
        setDeckCountFilter(deckCountFilter); // Update deckCount filter
    };

    const renderFilters = () => (
        <Modalize ref={modalizeRef} adjustToContentHeight>
            <View style={[styles.modalContent, { backgroundColor: Colors[theme].TabBarBackground }]}>
                {isDeckSearch ? (
                    <>
                        <TouchableOpacity
                            style={[
                                styles.filterOption,
                                isCompleted && styles.activeFilter,
                                isCompleted
                                    ? { backgroundColor: Colors[theme].tint }
                                    : { backgroundColor: Colors[theme].backgroundSoft },
                            ]}
                            onPress={() => setIsCompleted((prev) => !prev)}
                        >
                            <Text style={[styles.filterText, { color: Colors[theme].text }]}>{t("is_completed")}</Text>
                        </TouchableOpacity>
                        <View style={[styles.separator, { backgroundColor: Colors[theme].tabIconDefault }]} />
                        <Text style={[styles.filterLabel, { color: Colors[theme].text }]}>{t("tags")}</Text>
                        <View style={styles.tagsContainer}>
                            {tags.map((tag) => (
                                <TouchableOpacity
                                    key={tag.id}
                                    style={[
                                        styles.tagButton,
                                        { backgroundColor: tag.color },
                                        selectedTags.includes(tag.id)
                                            ? { borderColor: Colors[theme].text, borderWidth: 2 }
                                            : { borderColor: tag.color, borderWidth: 2 },
                                    ]}
                                    onPress={() =>
                                        setSelectedTags((prev) =>
                                            prev.includes(tag.id)
                                                ? prev.filter((id) => id !== tag.id)
                                                : [...prev, tag.id]
                                        )
                                    }
                                >
                                    <Text style={styles.tagButtonText}>{tag.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                ) : (
                    <>
                        <Text style={[styles.filterLabel, { color: Colors[theme].text }]}>{t("region")}</Text>
                        <View style={styles.regionContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.regionButtonTable,
                                    { backgroundColor: Colors[theme].info },
                                    regionFilter !== "west" && { opacity: 0.6 },
                                ]}
                                onPress={() => setRegionFilter(regionFilter === "west" ? null : "west")}
                            >
                                <Text style={[styles.regionText, { color: Colors[theme].background }]}>
                                    {t("west")}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.regionButtonTable,
                                    { backgroundColor: Colors[theme].highlight },
                                    regionFilter !== "east" && { opacity: 0.6 },
                                ]}
                                onPress={() => setRegionFilter(regionFilter === "east" ? null : "east")}
                            >
                                <Text style={[styles.regionText, { color: Colors[theme].background }]}>
                                    {t("east")}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.separator, { backgroundColor: Colors[theme].tabIconDefault }]} />
                        <TouchableOpacity
                            style={[
                                styles.filterOption,
                                deckCountFilter === "hasDecks"
                                    ? { backgroundColor: Colors[theme].tint, marginTop: 10 }
                                    : { backgroundColor: Colors[theme].backgroundSoft, marginTop: 10 },
                                deckCountFilter === "hasDecks" && styles.activeFilter,
                            ]}
                            onPress={() => setDeckCountFilter(deckCountFilter === "hasDecks" ? null : "hasDecks")}
                        >
                            <Text style={[styles.filterText, { color: Colors[theme].text }]}>{t("has_decks")}</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </Modalize>
    );

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <DeckSearcherHeader
                onSearchChange={setSearchQuery}
                isDeckSearch={isDeckSearch}
                toggleSearchMode={setIsDeckSearch}
                t={t}
                onOpenFilterModal={openFilterModal}
                filtersActive={
                    isCompleted ||
                    selectedTags.length > 0 ||
                    regionFilter ||
                    deckCountFilter ||
                    selectedColors.length > 0
                } // Determine if any filter is active
                onResetFilters={() => {
                    setIsCompleted(false);
                    setSelectedTags([]);
                    setRegionFilter(null);
                    setDeckCountFilter(null);
                    setSelectedColors([]);
                    setPage(1); // Reset to the first page
                    setData([]); // Clear current data
                }}
            />
            {renderFilters()}
            {isDeckSearch && renderColorFilters()}
            {isLoading || userId === null ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors[theme].tint} />
                </View>
            ) : data.length === 0 ? (
                <View style={styles.noDecksContainer}>
                    <Ionicons name={"skull-outline"} size={50} color={Colors[theme].tabIconDefault} />
                    <Text style={[styles.noDecksText, { color: Colors[theme].text }]}>
                        {isDeckSearch ? t("no_decks_found") : t("no_users_found")}
                    </Text>
                    <Text style={[styles.noDecksSubText, { color: Colors[theme].tabIconDefault }]}>
                        {t("try_different_search")}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={(item: { id: number }) => item.id.toString()}
                    renderItem={isDeckSearch ? renderDeckItem : renderUserItem}
                    style={{ paddingTop: 20 }}
                    contentContainerStyle={{ gap: 20, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
            <View style={styles.pagination}>
                <Ionicons
                    name="chevron-back"
                    size={24}
                    color={page === 1 ? Colors[theme].disabled : Colors[theme].tint}
                    onPress={() => page > 1 && setPage((prev) => Math.max(prev - 1, 1))}
                    style={[styles.paginationIcon, page === 1 && styles.disabledIcon]}
                />
                <TouchableOpacity
                    style={[styles.customDropdown, { backgroundColor: Colors[theme].text }]}
                    onPress={() => setDropdownVisible(true)}
                >
                    <Text style={[styles.customDropdownText, { color: Colors[theme].background }]}>Page {page}</Text>
                </TouchableOpacity>
                <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={page === totalPages ? Colors[theme].disabled : Colors[theme].tint}
                    onPress={() => page < totalPages && setPage((prev) => Math.min(prev + 1, totalPages))}
                    style={[styles.paginationIcon, page === totalPages && styles.disabledIcon]}
                />
            </View>
            {renderDropdown()}
            <Toast />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, gap: 10 },
    modalContent: {
        padding: 20,
        alignItems: "center", // Center elements horizontally
    },
    regionContainer: {
        flexDirection: "row",
        justifyContent: "center", // Center buttons horizontally
        marginVertical: 10,
        gap: 10, // Add spacing between buttons
    },
    regionButtonTable: {
        padding: 10,
        borderRadius: 8,
        alignItems: "center",
        width: 120, // Set a fixed width for buttons
    },
    regionButton: {
        padding: 10,
        borderRadius: 8,
        alignItems: "center",
        width: 60, // Set a fixed width for buttons
    },
    filterOption: {
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
        width: 200, // Set a fixed width for filter buttons
        alignItems: "center", // Center text inside the button
    },
    applyButton: {
        marginTop: 20,
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
        width: 200, // Set a fixed width for the apply button
    },
    applyButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap", // Allow tags to wrap to the next row
        justifyContent: "center", // Center tags horizontally
        gap: 10, // Add spacing between tags
        marginTop: 15,
        marginBottom: 10,
    },
    tagButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        borderWidth: 2,
    },
    tagButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#fff", // Default text color
    },
    item: {
        borderRadius: 4,
        padding: 10,
        overflow: "visible", // Allow child elements to be visible outside the parent
        flexDirection: "row", // Ensure the image and text are aligned horizontally
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2.5,
    },
    itemContent: {
        alignItems: "flex-start", // Center content vertically
        justifyContent: "space-between",
        paddingLeft: 10,
        paddingBottom: 20,
    },
    itemAverages: {
        alignItems: "flex-end", // Center content vertically
        justifyContent: "flex-end",
        gap: 3,
        marginBottom: -3,
    },
    itemTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        gap: 10,
    },
    itemTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
    },
    pagination: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
        paddingHorizontal: 10,
        gap: 10,
    },
    paginationIcon: {
        padding: 10,
    },
    disabledIcon: {
        opacity: 0.5,
    },
    leaderImageContainer: {
        width: 90,
        height: 90, // Set a fixed size for the image container
        overflow: "hidden",
        borderRadius: 4,
    },
    leaderImage: {
        width: "120%", // Slightly larger width for zoom effect
        height: "170%", // Ensure the image fully covers the container height
        objectFit: "cover",
        position: "absolute", // Ensure it stays within the container
        top: "0%", // Align the image to start from the top
        left: "-10%", // Center the zoomed image horizontally
        opacity: 0.9, // Optional: make the image slightly transparent
    },
    colorCircle: {
        width: 20,
        height: 20,
        borderRadius: 15,
        borderWidth: 2,
    },
    ownerContainerBack: {
        borderBottomLeftRadius: 4,
        padding: 8,
        paddingBottom: 2,
        flexDirection: "row",
        gap: 5,
    },
    ownerContainer: {
        // borderRadius: 4,

        justifyContent: "center",
        alignItems: "center",
        padding: 1,
    },
    cornerRight: {
        position: "absolute", // Superpone el botón sobre la imagen
        top: -15, // Ajusta la posición vertical
        right: 0, // Ajusta la posición horizontal
    },
    cornerLeft: {
        position: "absolute", // Superpone el botón sobre la imagen
        top: 2, // Ajusta la posición vertical
        left: 2, // Ajusta la posición horizontal
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        zIndex: 1, // Ensure it appears above other elements
    },
    averageBall: {
        width: 35,
        height: 35,
        borderRadius: 50,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
    },
    customDropdown: {
        width: "50%",
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    customDropdownText: {
        fontWeight: "bold",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.671)",
        justifyContent: "center",
        alignItems: "center",
    },
    dropdownContainer: {
        width: "80%",
        maxHeight: "50%",
        borderRadius: 10,
        padding: 10,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    dropdownItem: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 2,
    },
    selectedDropdownItem: {},
    dropdownItemText: {},
    selectedDropdownItemText: {
        fontWeight: "bold",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    colorFilters: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
    },
    colorCircleFilter: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        marginHorizontal: 5,
        justifyContent: "center",
        alignItems: "center",
    },

    colorCircleInner: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    noDecksContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
    },
    noDecksText: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
    },
    noDecksSubText: {
        fontSize: 14,
        textAlign: "center",
    },
    filterText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    activeFilter: {
        borderRadius: 8,
        padding: 10,
    },
    filterLabel: {
        fontSize: 18,
        fontWeight: "bold",
    },
    regionText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    separator: {
        height: 1,
        width: "100%",
        marginVertical: 10,
    },
});
