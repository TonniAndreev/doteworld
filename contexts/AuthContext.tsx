import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/utils/supabase';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import { prepareFileForUpload } from '@/utils/fileUtils';

// Complete the auth session on web
WebBrowser.maybeCompleteAuthSession();

interface Dog {
  id: string;
  name: string;
  breed: string;
  photo_url?: string | null;
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
  current_city_id?: string | null;
  current_city_name?: string | null;
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
  updateUserProfile: (data: Partial<DoteUser>) => Promise<void>;
  updateUserCity: (cityId: string, cityName: string) => Promise<boolean>;
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

  // Create redirect URI for OAuth - Use custom scheme for mobile
 const redirectTo = AuthSession.makeRedirectUri({
    useProxy: false,
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
        .select(`
          *,
          cities:current_city_id (
            id,
            name,
            state,
            country
          )
        `)
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
            current_city_id: null,
            current_city_name: null,
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
          email: supaUser.email!,
          ...profile,
          displayName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
          dogs: userDogs?.map(ud => ud.dogs).filter(Boolean) || [],
          friends: [], // This would be fetched separately in a real app
          badgeCount: badgeCount || 0,
          uid: supaUser.id,
          current_city_id: profile.current_city_id || null,
          current_city_name: profile.cities ? profile.cities.name : null,
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
        const result = await WebBrowser.openAuthSessionAsync(
          authUrl,
          redirectTo,
          {
            showInRecents: true,
          }
        );

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
        const result = await WebBrowser.openAuthSessionAsync(
          authUrl,
          redirectTo,
          {
            showInRecents: true,
          }
        );

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
      console.log('Starting dog profile update with photo:', !!dogPhoto);
      
      // Create dog data object
      const dogData: any = {
        name: dogName,
        breed: dogBreed,
      };
      
      if (birthday) {
        dogData.birthday = birthday;
      }
      
      // Create dog in database first to get the ID
      const { data: dog, error: dogError } = await supabase
        .from('dogs')
        .insert(dogData)
        .select()
        .single();

      if (dogError) {
        console.error('Error creating dog:', dogError);
        throw dogError;
      }

      console.log('Dog created successfully:', dog);

      // Link dog to user profile before uploading photo
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

      console.log('Dog linked to profile successfully');

      let finalDog = dog;

      // Handle photo upload if provided
      if (dogPhoto) {
        try {
          console.log('Processing dog photo upload');

          // Generate a unique filename
          const fileExt = dogPhoto.split('.').pop()?.toLowerCase() || 'jpg';
          const fileName = `${Date.now()}.${fileExt}`;
          const filePath = `${dog.id}/${fileName}`;

          console.log('Uploading to path:', filePath);

          // Prepare file for upload
          const { data: fileData, contentType } = await prepareFileForUpload(dogPhoto);

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('dog-photos')
            .upload(filePath, fileData, {
              contentType,
              upsert: true,
            });

          if (uploadError) {
            console.error('Error uploading photo:', uploadError);
            throw new Error('Failed to upload dog photo');
          }

          console.log('Upload successful:', uploadData);

          // Get public URL
          const { data: publicUrlData } = await supabase.storage
            .from('dog-photos')
            .getPublicUrl(filePath);

          console.log('Public URL:', publicUrlData);

          // Update dog with photo URL
          const { error: updateError } = await supabase
            .from('dogs')
            .update({
              photo_url: publicUrlData.publicUrl,
              photo_uploaded_at: new Date().toISOString()
            })
            .eq('id', dog.id);

          if (updateError) {
            console.error('Error updating dog with photo URL:', updateError);
            throw updateError;
          }

          finalDog = { ...dog, photo_url: publicUrlData.publicUrl };
        } catch (uploadError) {
          console.error('Photo upload error:', uploadError);
          // Continue without photo if upload fails
          console.warn('Continuing dog creation without photo due to upload error');
        }
      }

      console.log('Final dog object:', finalDog);

      // Update local user state
      const updatedUser = {
        ...user,
        dogs: [...user.dogs, finalDog],
      };

      setUser(updatedUser);
      await AsyncStorage.setItem('doteUser', JSON.stringify(updatedUser));

    } catch (error) {
      console.error('Error updating dog profile:', error);
      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<DoteUser>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      setIsLoading(true);

      let finalAvatarUrl = data.avatar_url || user.avatar_url;
      
      if (data.avatar_url && (data.avatar_url.startsWith('file://') || data.avatar_url.startsWith('content://') || data.avatar_url.startsWith('data:'))) {
        console.log('Uploading avatar from local file:', data.avatar_url);
        
        try {
          // Generate a unique filename
          const fileExt = data.avatar_url.split('.').pop()?.toLowerCase() || 'jpg';
          const fileName = `${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;
          
          console.log('Uploading to path:', filePath);
          
          // Prepare file for upload
          const { data: fileData, contentType } = await prepareFileForUpload(data.avatar_url);
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, fileData, {
              contentType,
              upsert: true,
            });
          
          if (uploadError) {
            console.error('Error uploading avatar:', uploadError);
            throw new Error('Failed to upload profile photo');
          }
          
          console.log('Upload successful:', uploadData);
          
          // Get public URL
          const { data: publicUrlData } = await supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          
          console.log('Public URL:', publicUrlData);
          
          finalAvatarUrl = publicUrlData.publicUrl;
        } catch (uploadError) {
          console.error('Avatar upload error:', uploadError);
          // Continue without updating avatar if upload fails
        }
      }

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: data.first_name || user.first_name,
          last_name: data.last_name || user.last_name,
          phone: data.phone || user.phone,
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw new Error('Failed to update profile');
      }

      // If email changed, update auth email
      if (data.email && data.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: data.email.trim(),
        });

        if (emailError) {
          console.error('Error updating email:', emailError);
          throw new Error('Failed to update email address');
        }
      }

      // Refresh user data
      await refreshUserData();
      
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserCity = async (cityId: string, cityName: string): Promise<boolean> => {
    if (!user) {
      return false;
    }

    try {
      setIsLoading(true);

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          current_city_id: cityId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating user city:', updateError);
        return false;
      }

      // Update local user state
      const updatedUser = {
        ...user,
        current_city_id: cityId,
        current_city_name: cityName,
      };

      setUser(updatedUser);
      await AsyncStorage.setItem('doteUser', JSON.stringify(updatedUser));
      
      return true;
    } catch (error) {
      console.error('Error updating user city:', error);
      return false;
    } finally {
      setIsLoading(false);
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
    updateUserProfile,
    updateUserCity,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};