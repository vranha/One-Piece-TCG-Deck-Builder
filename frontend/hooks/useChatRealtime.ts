import { useEffect } from "react";
import { supabase } from "@/supabaseClient";
import useStore from "@/store/useStore";

/**
 * Suscripción global a eventos Realtime SOLO para nuevos mensajes.
 * Actualiza el badge de chat en el estado global.
 * No debe ser afectada por ningún canal local en el chat.
 */
const useChatRealtime = (userId?: string | null) => {
    const setHasUnreadChats = useStore((state) => state.setHasUnreadChats);
    const currentOpenChatId = useStore((state) => state.currentOpenChatId);
    useEffect(() => {
        if (!userId) return;
        // Canal global solo para nuevos mensajes
        const channel = supabase
            .channel("global-messages-insert")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                },
                (payload) => {
                    // Si el mensaje NO es del usuario actual y NO es del chat abierto, marca como no leído
                    if (payload.new && payload.new.sender_id !== userId && payload.new.chat_id !== currentOpenChatId) {
                        setHasUnreadChats?.(true);
                    }
                }
            )
            .subscribe();
        return () => {
            channel.unsubscribe();
        };
    }, [userId, setHasUnreadChats, currentOpenChatId]);
};

export default useChatRealtime;
