import { supabase } from "../supabaseClient";

export const fetchUserChats = async () => {
    const user = supabase.auth.user();
    if (!user) return [];

    const { data, error } = await supabase
        .from("chats")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("Error fetching chats:", error);
        return [];
    }
    return data;
};
