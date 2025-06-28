import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/utils/supabase';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';

interface Dog {
  id: string;
  name: string;
  breed: string;
  photo_url?: string;
  birthday?: string;
  bio?: string;
  weight?: number;
  gender?: 'male' | 'female';
  created_at: string;
}

interface DoteUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone?: string;
  created_at?: string;
  displayName?: string;
  dogs: Dog[];
  friends?: any[];
  badgeCount?: number;
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
    first_name: string,
    last_name: string,
    phone: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>; 
  loginWithFacebook: () => Promise<void>;
  updateDogProfile: (dogName: string, dogBreed: string, dogPhoto?: string | null, birthday?: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Email validation function
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DoteUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Create redirect URI for OAuth - Include auth/callback path for consistency
  const redirectTo = Platform.OS === 'web' 
    ? window.location.origin 
    : AuthSession.makeRedirectUri({
        scheme: 'doteapp',
        path: 'auth/callback',
      });

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
            first_name: supaUser.user_metadata?.first_name || '',
            last_name: supaUser.user_metadata?.last_name || '',
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
            email: supaUser.email!,
            displayName: `${basicProfile.first_name} ${basicProfile.last_name}`.trim() || 'User',
            dogs: [],
            friends: [],
            badgeCount: 0,
            uid: supaUser.id,
          };

          setUser(fullUser);
          await AsyncStorage.setItem('doteUser', JSON.stringify(fullUser));
        } else {
          setUser(null);
        }
      } else {
        // Profile exists, fetch user's dogs with fresh data (no cache)
        console.log('Fetching fresh dog data for user:', userId);
        const { data: userDogs, error: dogsError } = await supabase
          .from('profile_dogs')
          .select(`
            dogs (
              id,
              name,
              breed,
              photo_url,
              birthday,
              bio,
              weight,
              gender,
              created_at
            )
          `)
          .eq('profile_id', userId)
          .order('created_at', { ascending: true, foreignTable: 'dogs' });

        if (dogsError) {
          console.error('Error fetching user dogs:', dogsError);
        }

        console.log('User dogs data:', userDogs);
        
        // Get badge count
        const { count: badgeCount } = await supabase
          .from('profile_achievements')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', userId);

        // Create full user object
        const fullUser: DoteUser = {
          id: supaUser.id,
          email: supaUser.email,
          ...profile,
          displayName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
          dogs: userDogs?.map(ud => ud.dogs).filter(Boolean) || [],
          friends: [], // This would be fetched separately in a real app
          badgeCount: badgeCount || 0,
          uid: supaUser.id,
        };

        console.log('Final user object with dogs:', fullUser.dogs);
        
        setUser(fullUser);
        // Force fresh data by clearing cache and setting new data
        await AsyncStorage.removeItem('doteUser');
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
      
      // Validate email format
      if (!isValidEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

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
    first_name: string,
    last_name: string,
    phone: string
  ) => {
    try {
      setIsLoading(true);

      // Validate email format
      if (!isValidEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate password length
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            phone: phone.trim(),
          },
          // Disable email confirmation
          emailRedirectTo: undefined,
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
      setIsLoading(true);

      if (Platform.OS === 'web') {
        // For web platform, use signInWithOAuth
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          }
        });
        
        if (error) throw error;
      } else {
        // For mobile platforms, use expo-auth-session with custom scheme
        console.log('Using redirect URI:', redirectTo);
        
        // Generate a secure random state parameter
        const state = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          Math.random().toString(36),
          { encoding: Crypto.CryptoEncoding.HEX }
        );

        // Create the authorization URL
        const authUrl = `https://uufihbvqnvniaszmfufi.supabase.co/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}&state=${state}`;

        console.log('Opening Google OAuth URL:', authUrl);
        console.log('Redirect URI:', redirectTo);

        // Open the OAuth session
        const result = await AuthSession.startAsync({
          authUrl,
          returnUrl: redirectTo,
        });

        console.log('OAuth result:', result);

        if (result.type === 'success') {
          const url = new URL(result.url);
          const access_token = url.searchParams.get('access_token');
          const refresh_token = url.searchParams.get('refresh_token');
          const error = url.searchParams.get('error');
          const error_description = url.searchParams.get('error_description');

          if (error) {
            throw new Error(error_description || error);
          }

          if (access_token && refresh_token) {
            // Set the session using the tokens
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (sessionError) {
              throw sessionError;
            }

            console.log('Google login successful:', data.user?.id);
            // fetchUserProfile will be called automatically by the auth state change listener
          } else {
            throw new Error('No tokens received from Google OAuth');
          }
        } else if (result.type === 'cancel') {
          throw new Error('Google login was cancelled');
        } else {
          throw new Error('Google login failed');
        }
      }
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const loginWithFacebook = async () => {
    try {
      setIsLoading(true);

      if (Platform.OS === 'web') {
        // For web platform, use signInWithOAuth
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'facebook',
          options: {
            redirectTo: window.location.origin,
          }
        });
        
        if (error) throw error;
      } else {
        // For mobile platforms, use expo-auth-session with custom scheme
        console.log('Using redirect URI:', redirectTo);
        
        // Generate a secure random state parameter
        const state = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          Math.random().toString(36),
          { encoding: Crypto.CryptoEncoding.HEX }
        );

        // Create the authorization URL
        const authUrl = `https://uufihbvqnvniaszmfufi.supabase.co/auth/v1/authorize?provider=facebook&redirect_to=${encodeURIComponent(redirectTo)}&state=${state}`;

        console.log('Opening Facebook OAuth URL:', authUrl);
        console.log('Redirect URI:', redirectTo);

        // Open the OAuth session
        const result = await AuthSession.startAsync({
          authUrl,
          returnUrl: redirectTo,
        });

        console.log('OAuth result:', result);

        if (result.type === 'success') {
          const url = new URL(result.url);
          const access_token = url.searchParams.get('access_token');
          const refresh_token = url.searchParams.get('refresh_token');
          const error = url.searchParams.get('error');
          const error_description = url.searchParams.get('error_description');

          if (error) {
            throw new Error(error_description || error);
          }

          if (access_token && refresh_token) {
            // Set the session using the tokens
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (sessionError) {
              throw sessionError;
            }

            console.log('Facebook login successful:', data.user?.id);
            // fetchUserProfile will be called automatically by the auth state change listener
          } else {
            throw new Error('No tokens received from Facebook OAuth');
          }
        } else if (result.type === 'cancel') {
          throw new Error('Facebook login was cancelled');
        } else {
          throw new Error('Facebook login failed');
        }
      }
    } catch (error) {
      console.error('Facebook login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateDogProfile = async (dogName: string, dogBreed: string, dogPhoto?: string | null, birthday?: string) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      // Create or update dog
      const dogData: any = {
        name: dogName,
        breed: dogBreed,
        photo_url: dogPhoto,
      };
      
      if (birthday) {
        dogData.birthday = birthday;
      }
      
      const { data: dog, error: dogError } = await supabase
        .from('dogs')
        .insert(dogData)
        .select()
        .single();

      if (dogError) {
        console.error('Error creating dog:', dogError);
        throw dogError;
      }

      // Link dog to user profile
      const { error: linkError } = await supabase
        .from('profile_dogs')
        .insert({
          profile_id: user.id,
          dog_id: dog.id,
        });

      if (linkError) {
        console.error('Error linking dog to profile:', linkError);
        throw linkError;
      }

      // Update local user state
      const updatedUser = {
        ...user,
        dogs: [...user.dogs, dog],
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
    refreshUserData: () => fetchUserProfile(user?.id || ''),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};