
# Dote - Dog Walking Territory Conquest App

A React Native mobile application built with Expo that gamifies dog walking by allowing users to conquer territories, earn achievements, and connect with other dog walkers.

## 🐕 Features

### Core Functionality
- **Territory Conquest**: Walk with your dog to claim and expand your territory on an interactive map
- **Real-time GPS Tracking**: Track your walks and automatically generate territory polygons
- **Paws Currency System**: Earn and spend paws to unlock conquests and rewards
- **Achievement System**: Unlock badges and achievements for various walking milestones
- **Social Features**: Connect with other dog walkers, send friend requests, and view leaderboards

### Key Screens
- **Map View**: Interactive map showing your territory, current walk progress, and conquest controls
- **Leaderboard**: Rankings by territory size, distance walked, achievements, and paws earned
- **Achievements**: Browse available and completed badges with progress tracking
- **Friends**: Connect with other users, manage friend requests, and discover new walkers
- **Profile**: View your stats, dog information, and recent achievements
- **Premium Store**: Subscription plans and paws packages for enhanced features

## 🛠 Tech Stack

- **Framework**: React Native with Expo SDK 53
- **Navigation**: Expo Router v5 with tab-based navigation
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with email/password
- **Maps**: React Native Maps with Google Maps
- **Location Services**: Expo Location
- **State Management**: React Context API
- **Styling**: React Native StyleSheet
- **Icons**: Lucide React Native
- **Geospatial**: Turf.js for polygon operations

## 📱 Database Schema

The app uses Supabase with the following key tables:

- **profiles**: User profile information and dog details
- **dogs**: Dog information (name, breed, photo)
- **profile_dogs**: Many-to-many relationship between users and dogs
- **friendships**: Friend relationships and requests
- **achievements**: Available achievements and badges
- **profile_achievements**: User achievement progress
- **walk_points**: GPS coordinates from user walks
- **territory**: Territory ownership data

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (for testing)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dote-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
# Dote App

A React Native Expo app for dog walking and territory conquest.

## Setup Instructions

### Supabase Configuration

To disable email confirmation for development:

1. Go to your Supabase dashboard
2. Navigate to Authentication > Settings
3. Scroll down to "Email Auth"
4. Turn OFF "Enable email confirmations"
5. Turn OFF "Enable phone confirmations" (if not needed)
6. Save the settings

### Environment Variables

Make sure your `.env` file contains:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

5. Open the app:
- Scan the QR code with Expo Go app on your device
- Press `i` for iOS simulator
- Press `a` for Android emulator

## 🏗 Project Structure

```
app/
├── _layout.tsx                 # Root layout with providers
├── index.tsx                   # App entry point with auth routing
├── (auth)/                     # Authentication screens
│   ├── login.tsx
│   ├── register.tsx
│   ├── dog-profile.tsx
│   └── confirm.tsx
└── (tabs)/                     # Main app tabs
    ├── index.tsx               # Map/Home screen
    ├── leaderboard.tsx
    ├── achievements.tsx
    ├── friends.tsx
    ├── profile.tsx
    └── store/                  # Premium store
        ├── index.tsx
        └── package.tsx

components/
├── common/                     # Shared components
├── friends/                    # Friend-related components
├── home/                       # Home screen components
├── leaderboard/               # Leaderboard components
└── profile/                   # Profile components

contexts/
├── AuthContext.tsx            # Authentication state
├── PawsContext.tsx           # Paws currency system
├── TerritoryContext.tsx      # Territory and walking logic
└── NotificationContext.tsx   # Notifications

utils/
├── supabase.ts               # Supabase client configuration
└── locationUtils.ts          # Geospatial utility functions
```

## 🎮 How It Works

### Territory Conquest
1. Users start a "conquest" by pressing the conquest button (costs 1 paw or unlimited with premium)
2. GPS tracking begins, recording walk points every 5 meters
3. Walk points form a convex hull polygon representing the conquered territory
4. Territory is merged with existing territories using polygon union operations
5. Users earn paws based on the area of new territory conquered

### Paws Economy
- **Free Users**: Start with 1 paw, earn 1 paw daily, watch ads for additional paws (max 2/day)
- **Premium Users**: Unlimited paws and conquests
- **Earning Paws**: Territory conquest, achievements, daily rewards
- **Spending Paws**: Starting conquests (free users only)

### Social Features
- Send/receive friend requests
- View friends' territories and achievements
- Leaderboards across multiple categories
- Achievement sharing

## 🔧 Development

### Key Commands
```bash
npm run dev          # Start development server
npm run build:web    # Build for web
npm run lint         # Run linter
npm run android      # Run on Android
npm run ios          # Run on iOS
```

### Environment Setup
The app supports multiple environments:
- `.env` - Development defaults
- `.env.staging` - Staging environment  
- `.env.production` - Production environment

### Database Migrations
Supabase migrations are stored in `/supabase/migrations/`. Each migration includes:
- Complete SQL schema changes
- Row Level Security (RLS) policies
- Descriptive comments explaining changes

## 🎨 Design System

### Colors
- **Primary**: Orange-Red (#F1662E)
- **Secondary**: Turquoise (#2EF2D1) 
- **Accent**: Yellow (#F2EE2E)
- **Success**: Green (#34C759)
- **Error**: Red (#FF3B30)

### Typography
- **Font Family**: Inter (Regular, Medium, Bold)
- **Sizes**: 12px - 36px with consistent line heights

### Components
- Consistent 8px spacing system
- Rounded corners (8px, 12px, 16px, 20px)
- Subtle shadows and elevation
- Smooth animations and micro-interactions

## 🔐 Authentication & Security

- Email/password authentication via Supabase Auth
- Row Level Security (RLS) on all database tables
- User data isolation and privacy protection
- Secure API endpoints with proper authorization

## 📍 Location & Privacy

- Location permissions requested with clear explanations
- GPS data used only for territory calculation
- No location data shared without explicit consent
- Offline capability for core features

## 🚀 Deployment

### Web Deployment
```bash
npm run build:web
```

### Mobile App Store Deployment
1. Create production build:
```bash
eas build --platform all
```

2. Submit to app stores:
```bash
eas submit --platform all
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style
- Use TypeScript for all new code
- Follow React Native best practices
- Maintain consistent component structure
- Add proper error handling and loading states

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review existing issues for solutions

## 🔮 Future Features

- **Weather Integration**: Weather-based challenges and rewards
- **AR Features**: Augmented reality territory visualization
- **Group Walks**: Coordinate walks with friends
- **Vet Integration**: Track health metrics and vet appointments
- **Training Programs**: Structured walking and training plans
- **Community Events**: Local dog walking events and meetups

---

Built with ❤️ for dog lovers everywhere 🐾

### Database Setup

Run the migrations in the `supabase/migrations` folder to set up the database schema.

### Development

```bash
npm install
npm run dev
```

## Features

- User authentication with Supabase
- Dog profile management
- Territory conquest through walking
- Achievement system
- Friends and social features
- Paws currency system

## Database Schema

The app uses the following main tables:
- `profiles` - User profiles
- `dogs` - Dog information
- `profile_dogs` - Many-to-many relationship between users and dogs
- `achievements` - Available achievements
- `profile_achievements` - User's earned achievements
- `friendships` - Friend relationships
- `walk_points` - GPS points from walks
- `territory` - Conquered territory data

