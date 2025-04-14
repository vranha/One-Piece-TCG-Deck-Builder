import React, { useState } from "react";
import {
    Modal,
    View,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Text,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import useApi from "@/hooks/useApi";

interface FeedbackModalProps {
    visible: boolean;
    onClose: () => void;
    t: any;
    showToast: (type: "success" | "error", title: string, message: string) => void; // Add showToast prop
}

export default function FeedbackModal({ visible, onClose, t, showToast }: FeedbackModalProps) {
    const { theme } = useTheme();
    const [emailContent, setEmailContent] = useState("");
    const { session } = useAuth();
    const api = useApi();

    const handleSend = async () => {
        try {
            await api.post("/send-feedback", {
                feedback: emailContent,
                userName: session?.user?.user_metadata?.name, // Replace with actual user name if available
                userEmail: session?.user?.email, // Replace with actual user email if available
            });

            showToast(
                "success",
                t("feedback_sent") || "Feedback Sent",
                t("feedback_sent_message") || "Thank you for your feedback!"
            );
        } catch (error) {
            showToast(
                "error",
                t("feedback_error") || "Error",
                t("feedback_error_message") || "Failed to send feedback."
            );
        } finally {
            setEmailContent(""); // Clear the input field
            onClose(); // Close the modal
        }
    };

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={[styles.modal, { backgroundColor: Colors[theme].TabBarBackground }]}>
                            <TextInput
                                style={[
                                    styles.textInput,
                                    {
                                        color: Colors[theme].text,
                                        borderColor: Colors[theme].backgroundSoft,
                                        backgroundColor: Colors[theme].background,
                                    },
                                ]}
                                placeholder={t("feedback_placeholder")}
                                placeholderTextColor={Colors[theme].tabIconDefault}
                                multiline
                                value={emailContent}
                                onChangeText={setEmailContent}
                            />
                            <TouchableOpacity
                                style={[styles.sendButton, { backgroundColor: Colors[theme].success }]}
                                onPress={handleSend}
                            >
                                <Text style={styles.sendButtonText}>{t('send')}</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.76)",
        justifyContent: "center",
        alignItems: "center",
    },
    modal: {
        width: "80%",
        padding: 20,
        borderRadius: 10,
        elevation: 5,
    },
    textInput: {
        height: 100,
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginBottom: 20,
        textAlignVertical: "top",
    },
    sendButton: {
        alignSelf: "flex-end",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    sendButtonText: {
        color: "#FFF",
        fontWeight: "bold",
    },
});
