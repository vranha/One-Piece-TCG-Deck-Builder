import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthCheck() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [session, loading]);

  return null;
}
