# Campus Connect Mobile App

A complete, production-ready social networking mobile application built for campus communities using React Native (Expo) and Firebase.

## Features

- **Authentication**: Email/password registration, login, forgot password with Firebase Auth
- **Feed**: Create, like, comment on posts with image and file attachments
- **Events**: Browse, filter, and register for campus events
- **Chat**: Real-time group and direct messaging with file sharing
- **Notifications**: In-app and push notifications for likes, comments, messages, and events
- **Profile**: Edit profile, dark mode toggle, settings
- **Search**: Search posts, events, and users
- **Dark Mode**: Full dark mode support across all screens

## Tech Stack

- **Mobile Framework**: React Native with Expo (SDK 50+)
- **Navigation**: Expo Router (file-based routing)
- **Backend & DB**: Firebase (Firestore, Auth, Storage, FCM)
- **State Management**: Zustand
- **Styling**: NativeWind (Tailwind for React Native)
- **Real-time Chat**: Firebase Firestore real-time listeners
- **Push Notifications**: Expo Notifications + Firebase Cloud Messaging
- **File Uploads**: Firebase Storage
- **Icons**: Expo Vector Icons (Ionicons)
- **Image Picker**: Expo Image Picker
- **Document Picker**: Expo Document Picker

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Firebase account
- iOS Simulator (Mac) or Android Emulator/Device

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd campus-connect
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable the following services:
   - Authentication (Email/Password)
   - Firestore Database
   - Storage
   - Cloud Messaging

### 4. Configure Firebase

1. In Firebase Console, go to Project Settings
2. Add a new app (iOS and/or Android)
3. Download the config files and copy the values

4. Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

5. Fill in your Firebase configuration:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 5. Set Up Firestore Security Rules

1. In Firebase Console, go to Firestore Database > Rules
2. Copy the contents of `firestore.rules` file
3. Paste and publish the rules

### 6. Run the App

```bash
npx expo start
```

- Press `i` to run on iOS Simulator
- Press `a` to run on Android Emulator
- Scan the QR code with Expo Go app on your physical device

## Project Structure

```
campus-connect/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── feed.tsx
│   │   ├── events.tsx
│   │   ├── chat.tsx
│   │   ├── notifications.tsx
│   │   └── profile.tsx
│   ├── chat/
│   │   └── [roomId].tsx
│   ├── post/
│   │   └── [postId].tsx
│   ├── event/
│   │   └── [eventId].tsx
│   └── _layout.tsx
├── components/
│   ├── PostCard.tsx
│   ├── EventCard.tsx
│   ├── ChatBubble.tsx
│   ├── NotificationItem.tsx
│   ├── UserAvatar.tsx
│   ├── FileAttachment.tsx
│   ├── SearchBar.tsx
│   └── EmptyState.tsx
├── store/
│   ├── authStore.ts
│   ├── postStore.ts
│   ├── eventStore.ts
│   ├── chatStore.ts
│   └── notificationStore.ts
├── services/
│   ├── firebase.ts
│   ├── authService.ts
│   ├── postService.ts
│   ├── eventService.ts
│   ├── chatService.ts
│   ├── notificationService.ts
│   └── storageService.ts
├── hooks/
│   ├── useAuth.ts
│   ├── usePosts.ts
│   ├── useChat.ts
│   └── useTheme.ts
├── constants/
│   ├── colors.ts
│   └── config.ts
├── types/
│   └── index.ts
├── assets/
│   └── images/
├── app.json
├── tailwind.config.js
├── package.json
└── firestore.rules
```

## Firestore Database Schema

### Users Collection
```
users/{userId}
  - uid: string
  - name: string
  - email: string
  - avatar: string (URL)
  - department: string
  - year: string (1st, 2nd, 3rd, 4th)
  - bio: string
  - fcmToken: string
  - createdAt: timestamp
  - darkMode: boolean
  - isAdmin: boolean
```

### Posts Collection
```
posts/{postId}
  - authorId: string
  - authorName: string
  - authorAvatar: string
  - content: string
  - imageUrl: string (optional)
  - fileUrl: string (optional)
  - fileName: string (optional)
  - likes: string[] (array of userIds)
  - commentsCount: number
  - createdAt: timestamp
  - tags: string[]

posts/{postId}/comments/{commentId}
  - authorId: string
  - authorName: string
  - authorAvatar: string
  - text: string
  - createdAt: timestamp
```

### Events Collection
```
events/{eventId}
  - title: string
  - description: string
  - date: timestamp
  - location: string
  - organizer: string
  - imageUrl: string
  - category: string (Academic, Cultural, Sports, Workshop, Other)
  - registeredUsers: string[]
  - createdAt: timestamp
```

### Chat Rooms Collection
```
chatRooms/{roomId}
  - name: string
  - type: string (group | direct)
  - members: string[]
  - lastMessage: string
  - lastMessageTime: timestamp
  - createdAt: timestamp

chatRooms/{roomId}/messages/{messageId}
  - senderId: string
  - senderName: string
  - senderAvatar: string
  - text: string
  - fileUrl: string (optional)
  - fileName: string (optional)
  - type: string (text | image | file)
  - createdAt: timestamp
  - readBy: string[]
```

### Notifications Collection
```
notifications/{notificationId}
  - userId: string
  - title: string
  - body: string
  - type: string (post_like | comment | event | announcement | message)
  - referenceId: string
  - isRead: boolean
  - createdAt: timestamp
```

## Admin Features

To enable admin features (create events), set `isAdmin: true` in the user document in Firestore.

## Troubleshooting

### Firebase Not Configured

If you see a setup screen, ensure:
1. `.env` file exists with correct Firebase config
2. All Firebase services are enabled in console
3. Firestore security rules are published

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start --clear
```

### iOS Build Issues

```bash
cd ios
pod install
cd ..
npx expo run:ios
```

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on the repository.
