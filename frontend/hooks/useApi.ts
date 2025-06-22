import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";

const useApi = () => {
    const { token } = useAuth();

    const api = axios.create({
        baseURL: "https://one-piece-tcg-deck-builder.onrender.com/private", // Ensure this URL is correct and reachable
        headers: {
            Authorization: token ? `Bearer ${token}` : "", // Ensure token is included
        },
    });

    return api;
};

export default useApi;
