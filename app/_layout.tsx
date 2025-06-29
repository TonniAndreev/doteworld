import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { SplashScreen } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { PawsProvider } from '@/contexts/PawsContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { TerritoryProvider } from '@/contexts/TerritoryContext';
import { RevenueCatProvider } from '@/contexts/RevenueCatContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAchievements } from '@/hooks/useAchievements';
import BadgeAwardDialog from '@/components/achievements/BadgeAwardDialog';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { user } = useAuth();
  const { 
    newlyCompletedBadge, 
    clearNewlyCompletedBadge, 
    checkAchievements 
  } = useAchievements();
  const [showBadgeDialog, setShowBadgeDialog] = useState(false);

  // Check for achievements when user logs in
  useEffect(() => {
    if (user) {
      const checkForAchievements = async () => {
        console.log('Checking for achievements on login...');
        const completedBadge = await checkAchievements();
        if (completedBadge) {
          console.log('New badge completed:', completedBadge.title);
          setShowBadgeDialog(true);
        }
      };
      
      checkForAchievements();
    }
  }, [user?.id]);

  // Show badge dialog when a new badge is completed
  useEffect(() => {
    if (newlyCompletedBadge) {
      setShowBadgeDialog(true);
    }
  }, [newlyCompletedBadge]);

  const handleCloseBadgeDialog = () => {
    setShowBadgeDialog(false);
    clearNewlyCompletedBadge();
  };

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
      <StatusBar style="auto" />
      
      {/* Badge Award Dialog */}
      <BadgeAwardDialog
        visible={showBadgeDialog}
        onClose={handleCloseBadgeDialog}
        badge={newlyCompletedBadge}
      />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-Bold': Inter_700Bold,
  });

  // Hide splash screen once fonts are loaded
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Return null to keep splash screen visible while fonts load
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <RevenueCatProvider>
      <AuthProvider>
        <PawsProvider>
          <NotificationProvider>
            <TerritoryProvider>
              <AppContent />
            </TerritoryProvider>
          </NotificationProvider>
        </PawsProvider>
      </AuthProvider>
    </RevenueCatProvider>
  );
}