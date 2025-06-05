import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, PawPrint } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';

const PAWS_PACKAGES = [
  {
    id: 'basic',
    name: 'Basic Pack',
    amount: 500,
    price: 4.99,
    description: 'Perfect for casual walkers',
    features: ['500 Paws', 'Valid for 30 days', 'Basic rewards'],
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    amount: 1500,
    price: 9.99,
    description: 'Most popular choice for regular walkers',
    features: ['1500 Paws', 'Valid for 30 days', '10% bonus on earned Paws', 'Premium rewards'],
    popular: true,
  },
  {
    id: 'ultimate',
    name: 'Ultimate Pack',
    amount: 5000,
    price: 24.99,
    description: 'Best value for dedicated walkers',
    features: ['5000 Paws', 'Valid for 30 days', '25% bonus on earned Paws', 'Premium rewards', 'Exclusive badges'],
    popular: false,
  },
];

export default function StoreScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={COLORS.neutralDark} />
        </TouchableOpacity>
        <Text style={styles.title}>Paws Store</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Choose Your Package</Text>
        
        {PAWS_PACKAGES.map((pack) => (
          <TouchableOpacity
            key={pack.id}
            style={[styles.packageCard, pack.popular && styles.popularCard]}
            onPress={() => router.push({
              pathname: '/store/package',
              params: { id: pack.id }
            })}
          >
            {pack.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Most Popular</Text>
              </View>
            )}
            
            <View style={styles.packageHeader}>
              <Text style={styles.packageName}>{pack.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>${pack.price}</Text>
              </View>
            </View>
            
            <View style={styles.pawsContainer}>
              <PawPrint size={24} color={COLORS.primary} />
              <Text style={styles.pawsAmount}>{pack.amount} Paws</Text>
            </View>
            
            <Text style={styles.packageDescription}>{pack.description}</Text>
            
            <View style={styles.featuresList}>
              {pack.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.featureDot} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  subtitle: {
    fontFamily: 'SF-Pro-Display-Medium',
    fontSize: 16,
    color: COLORS.neutralDark,
    marginBottom: 16,
  },
  packageCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  popularCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontFamily: 'SF-Pro-Display-Medium',
    fontSize: 12,
    color: COLORS.white,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  packageName: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 20,
    color: COLORS.neutralDark,
  },
  priceContainer: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  price: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 18,
    color: COLORS.primary,
  },
  pawsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pawsAmount: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 24,
    color: COLORS.primary,
    marginLeft: 8,
  },
  packageDescription: {
    fontFamily: 'SF-Pro-Display-Regular',
    fontSize: 14,
    color: COLORS.neutralMedium,
    marginBottom: 16,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  featureText: {
    fontFamily: 'SF-Pro-Display-Regular',
    fontSize: 14,
    color: COLORS.neutralDark,
  },
});