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