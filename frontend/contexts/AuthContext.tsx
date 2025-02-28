import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { Session } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthContextType {
  session: Session | null;
  token: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      const accessToken = data.session?.access_token || null;
      setToken(accessToken);

      // Guardar en AsyncStorage si se quiere persistencia
      if (accessToken) {
        await AsyncStorage.setItem("authToken", accessToken);
      } else {
        await AsyncStorage.removeItem("authToken");
      }

      setLoading(false);
    };

    loadSession();

    // Suscribirse a cambios de sesión
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const accessToken = session?.access_token || null;
      setToken(accessToken);

      if (accessToken) {
        AsyncStorage.setItem("authToken", accessToken);
      } else {
        AsyncStorage.removeItem("authToken");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, token, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};
