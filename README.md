# Pearl Diaries

A modern Instagram Reels & YouTube Shorts style social media application for the Bits Pilani Hyderabad Pearl cultural festival.

## Features

- **Reels Feed**: Vertically scrollable video feed with optimized video player pooling
- **Posts Grid**: Browse and share carousel posts and images
- **Create Posts**: Upload and share video reels and photo carousels
- **Authentication**: Secure sign-in with Clerk
- **User Profiles**: Customize your profile and view user information
- **Event Tagging**: Tag posts with cultural festival events
- **Interactions**: Like, comment, and share posts

## Tech Stack

- **React Native** with **Expo** for cross-platform development
- **React Navigation** for bottom tab navigation
- **Clerk** for authentication
- **React Hook Form** + **Yup** for form validation
- **NativeWind** (Tailwind CSS) for styling
- **React Native Reanimated** for animations
- **Expo Video** for video playback
- **AsyncStorage** for local state management
- **Axios** for API calls

## Project Structure

```
pearl_diaries_fe/
├── app/                    # Expo router app directory
│   └── index.tsx          # Root app entry point
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── VideoPlayer.tsx         # Optimized video player component
│   │   ├── ReelsFeed.tsx           # Vertical scrollable reels feed
│   │   └── PostsGrid.tsx           # Grid layout for posts
│   ├── screens/           # Screen components
│   │   ├── ReelsScreen.tsx         # Main reels feed screen
│   │   ├── PostsScreen.tsx         # Posts grid screen
│   │   ├── CreatePostScreen.tsx    # Create post form
│   │   └── ProfileScreen.tsx       # User profile screen
│   ├── hooks/             # Custom React hooks
│   │   └── useVideoPlayerPool.ts   # Player pooling logic
│   ├── services/          # API services
│   ├── utils/             # Utility functions
│   │   └── api.ts         # API client configuration
│   ├── navigation/        # Navigation setup
│   │   └── RootNavigator.tsx       # Bottom tab navigator
│   └── types/             # TypeScript type definitions
│       └── index.ts       # Core types
├── assets/                # Images, icons, and media
│   ├── images/            # App images and logos
│   ├── videos/            # Sample videos
│   └── icons/             # Icon assets
├── app.json               # Expo configuration
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── babel.config.js        # Babel configuration
└── package.json           # Dependencies and scripts
```

## Video Player Optimization

The video player uses a sophisticated player pooling strategy:

1. **Player Pool**: Maintains 3 player instances (current, next, previous)
2. **Sliding Window Preloading**: Preloads the next video while current plays
3. **Smart Buffer Management**: Only buffers 1-5 seconds ahead to save bandwidth
4. **First Frame Optimization**: Shows thumbnail while first frame loads
5. **Crossfade Transition**: Seamless transition from thumbnail to video
6. **Memory Efficiency**: Reuses players instead of creating new ones per video

### Key Components:
- `VideoPlayer`: Single video player wrapper with thumbnail support
- `ReelsFeed`: Virtualized list with player recycling
- `useVideoPlayerPool`: Hook managing player lifecycle and preload states

## Setup & Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Expo CLI

### Installation

```bash
# Clone repository
git clone <repository-url>
cd pearl_diaries_fe

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env

# Configure environment variables
# EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
# EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

### Running the App

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

## Environment Variables

Create a `.env` file with the following variables:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

## Git Workflow

This project follows a feature branch workflow:

1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes and commit: `git commit -m "feat: description"`
3. Push to feature branch: `git push origin feature/feature-name`
4. Open pull request to main
5. Merge after review: `git merge feature/feature-name`

## API Endpoints

The app communicates with a backend API. Key endpoints:

- `POST /auth/register-profile` - Register user profile
- `GET /posts` - Fetch posts feed
- `POST /posts` - Create new post
- `POST /posts/:id/like` - Like a post
- `GET /posts/:id/comments` - Get post comments
- `PUT /users/profile` - Update user profile

## Asset Organization

Assets are organized by type and screen:

```
assets/
├── images/
│   ├── app-icon.png          # App icon (1024x1024)
│   ├── splash-screen.png     # Splash screen (1080x1920)
│   ├── adaptive-icon.png     # Android adaptive icon
│   └── favicon.png           # Web favicon
├── videos/
│   └── [sample-videos]
└── icons/
    └── [ui-icons]
```

## Design System

The app uses Tailwind CSS with NativeWind for consistent styling:

**Colors:**
- Primary: `#7C3AED` (Purple)
- Secondary: `#EC4899` (Pink)
- Accent: `#F59E0B` (Amber)
- Dark: `#0F172A`
- Light: `#F8FAFC`

## Contributing

1. Follow the git workflow above
2. Use TypeScript for all new code
3. Follow the existing code style
4. Test components before committing
5. Write clear commit messages

## Performance Optimizations

- **Video Preloading**: Sliding window strategy loads videos ahead
- **Player Pooling**: Reuses player instances to reduce memory
- **Virtual Lists**: FlatList with optimized rendering
- **Image Caching**: Automatic caching via image libraries
- **Code Splitting**: Lazy load screens and components

## License

MIT License

## Support

For issues and feature requests, please create a GitHub issue.
