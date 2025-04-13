import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import { ThemedText } from "./ThemedText";

interface Tag {
    id: string;
    name: string;
    color: string;
}

interface TagsProps {
    tags: Tag[];
    allTags: Tag[]; // All available tags for selection
    onTagToggle: (tag: Tag) => void; // Callback for adding/removing tags
}

const Tags: React.FC<TagsProps> = ({ tags, allTags, onTagToggle }) => {
    const [selectorVisible, setSelectorVisible] = useState(false);
    const { theme } = useTheme() as { theme: keyof typeof Colors };

    const toggleSelector = () => {
        setSelectorVisible((prev) => !prev);
    };

    const isTagSelected = (tagId: string) => tags.some((tag) => tag.id === tagId);

    return (
        <View>
            <View style={styles.container}>
                <TouchableOpacity
                    style={[
                        styles.addTagButton,
                        selectorVisible
                            ? { backgroundColor: Colors[theme].error }
                            : { backgroundColor: Colors[theme].tabIconDefault },
                    ]}
                    onPress={toggleSelector}
                >
                    {selectorVisible ? (
                        <MaterialIcons name="remove" size={20} color="#fff" />
                    ) : (
                        <MaterialIcons name="add" size={20} color="#fff" />
                    )}
                    {tags.length === 0 && (
                        <ThemedText style={[styles.addTagText, { fontWeight: "bold", color: "#fff" }]}>
                            Add Tag
                        </ThemedText>
                    )}
                </TouchableOpacity>
                {tags.map((tag) => (
                    <View key={tag.id} style={[styles.tag, { backgroundColor: tag.color }]}>
                        <ThemedText style={styles.tagText}>{tag.name}</ThemedText>
                    </View>
                ))}
            </View>
            {selectorVisible && (
                <ScrollView horizontal style={[styles.selector, { backgroundColor: Colors[theme].TabBarBackground }]}>
                    {allTags.map((tag) => (
                        <TouchableOpacity
                            key={tag.id}
                            style={[
                                styles.selectorTag,
                                { backgroundColor: tag.color },
                                isTagSelected(tag.id)
                                    ? { borderColor: Colors[theme].text, borderWidth: 2 }
                                    : { opacity: 0.6 },
                            ]}
                            onPress={() => onTagToggle(tag)}
                        >
                            <ThemedText style={styles.selectorTagText}>{tag.name}</ThemedText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginVertical: 10,
        alignItems: "center",
    },
    addTagButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 15,
        marginRight: 8,
    },
    addTagText: {
        color: "#fff",
    },
    tag: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 15,
        marginRight: 4,
    },
    tagText: {
        color: "#fff",
        fontWeight: "bold",
    },
    selector: {
        marginBottom: 5,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 10,
    },
    selectorTag: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 15,
        marginRight: 4,
        alignItems: "center",
        justifyContent: "center",
    },
    selectorTagText: {
        color: "#fff",
        fontWeight: "bold",
    },
});

export default Tags;
