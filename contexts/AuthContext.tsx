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
  displayName?: string;
  photoURL?: string | null;
  dogName?: string;
  dogBreed?: string;
  friends?: any[];
  achievementCount?: number;
  uid?: string;
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
  updateDogProfile: (dogName: string, dogBreed: string, dogPhoto?: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DoteUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        setIsLoading(false);
        return;
      }
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        await AsyncStorage.removeItem('doteUser');
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      setIsLoading(true);

      // Get the current user from Supabase auth
      const { data: { user: supaUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error fetching user:', userError);
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (!supaUser) {
        console.log('No authenticated user found');
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Fetch user profile from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        
        // If profile doesn't exist, create a basic one from auth user data
        if (profileError.code === 'PGRST116') {
          console.log('Profile not found, creating basic profile');
          const basicProfile = {
            id: supaUser.id,
            email: supaUser.email,
            first_name: supaUser.user_metadata?.first_name || '',
            last_name: supaUser.user_metadata?.last_name || '',
            username: supaUser.user_metadata?.username || '',
            phone: supaUser.user_metadata?.phone || '',
            created_at: supaUser.created_at,
          };

          // Try to insert the profile
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([basicProfile]);

          if (insertError) {
            console.error('Error creating profile:', insertError);
          }

          // Set user with basic profile data
          const fullUser: DoteUser = {
            ...basicProfile,
            displayName: `${basicProfile.first_name} ${basicProfile.last_name}`.trim() || basicProfile.username || 'User',
            photoURL: null, // Will use random avatar
            dogName: '',
            dogBreed: '',
            friends: [],
            achievementCount: 0,
            uid: supaUser.id,
          };

          setUser(fullUser);
          await AsyncStorage.setItem('doteUser', JSON.stringify(fullUser));
        } else {
          setUser(null);
        }
      } else {
        // Profile exists, create full user object
        const fullUser: DoteUser = {
          id: supaUser.id,
          email: supaUser.email,
          ...profile,
          displayName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || 'User',
          photoURL: profile.avatar_url || null, // Will use random avatar if null
          dogName: profile.dog_name || '',
          dogBreed: profile.dog_breed || '',
          friends: [], // This would be fetched separately in a real app
          achievementCount: profile.achievement_count || 0,
          uid: supaUser.id,
        };

        setUser(fullUser);
        await AsyncStorage.setItem('doteUser', JSON.stringify(fullUser));
      }
    } catch (error) {
      console.error('Unexpected error in fetchUserProfile:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        console.error('Login error:', error);
        throw new Error(error.message || 'Login failed');
      }

      if (!data.user) {
        throw new Error('No user returned from login');
      }

      // fetchUserProfile will be called automatically by the auth state change listener
      console.log('Login successful for user:', data.user.id);
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    username: string,
    first_name: string,
    last_name: string,
    phone: string
  ) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            username: username.trim(),
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            phone: phone.trim(),
          },
        },
      });

      if (error) {
        console.error('Registration error:', error);
        throw new Error(error.message || 'Registration failed');
      }

      if (!data.user) {
        throw new Error('No user returned from registration');
      }

      console.log('Registration successful for user:', data.user.id);
      
      // fetchUserProfile will be called automatically by the auth state change listener
      
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };
  
  const loginWithFacebook = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
      });
      if (error) throw error;
    } catch (error) {
      console.error('Facebook login error:', error);
      throw error;
    }
  };

  const updateDogProfile = async (dogName: string, dogBreed: string, dogPhoto?: string | null) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          dog_name: dogName,
          dog_breed: dogBreed,
          dog_photo_url: dogPhoto,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating dog profile:', error);
        throw error;
      }

      // Update local user state
      const updatedUser = {
        ...user,
        dogName,
        dogBreed,
        photoURL: dogPhoto || user.photoURL, // Keep existing avatar if no new photo
      };

      setUser(updatedUser);
      await AsyncStorage.setItem('doteUser', JSON.stringify(updatedUser));
      
    } catch (error) {
      console.error('Error updating dog profile:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      
      setUser(null);
      await AsyncStorage.removeItem('doteUser');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if logout fails
      setUser(null);
      await AsyncStorage.removeItem('doteUser');
    }
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
    updateDogProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};