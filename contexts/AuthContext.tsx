import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';

interface DoteUser {
  id: string;
  email: string | null;
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar_url?: string;
  phone?: string;
  achievement_count?: number;
  created_at?: string;
}

interface AuthContextType {
  user: DoteUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    username: string,
    first_name: string,
    last_name: string,
    phone: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>; 
  loginWithFacebook: () => Promise<void>; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DoteUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchUserProfile();
      else setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) fetchUserProfile();
      else {
        setUser(null);
        AsyncStorage.removeItem('doteUser');
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async () => {
    setIsLoading(true);

    const { data: { user: supaUser }, error: userError } = await supabase.auth.getUser();
    if (userError || !supaUser) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supaUser.id)
      .single();

    if (profileError) {
      console.error('Failed to fetch profile:', profileError);
      setUser(null);
    } else {
      const fullUser: DoteUser = {
        id: supaUser.id,
        email: supaUser.email,
        ...profile,
      };

      setUser(fullUser);
      await AsyncStorage.setItem('doteUser', JSON.stringify(fullUser));
    }

    setIsLoading(false);
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await fetchUserProfile(); 
  };
  const register = async (
    email: string,
    password: string,
    username: string,
    first_name: string,
    last_name: string,
    phone: string
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          first_name,
          last_name,
          phone,
        },
      },
    });
  
    if (error) throw error;
  
    await fetchUserProfile();
  };
  
  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) throw error;
  };
  
  const loginWithFacebook = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    await AsyncStorage.removeItem('doteUser');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    loginWithGoogle,
    loginWithFacebook, 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
