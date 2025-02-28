import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";

const useApi = () => {
    const { token } = useAuth();

    const api = axios.create({
        baseURL: "http://192.168.1.180:5000/private",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return api;
};

export default useApi;
