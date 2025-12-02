# Summarist - Virtual Internship Project

A Next.js 14+ application for book summaries and audiobooks with Firebase authentication and Stripe payments.

## Tech Stack

- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **Firebase** (Firestore + Authentication)
- **Stripe** via Firebase Extension
- **Redux Toolkit** for state management
- **React Icons** for icons
- **Vercel** for deployment

## Getting Started

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
summarist/
├── app/                    # Next.js App Router pages
├── components/            # Reusable components
├── lib/                  # Utilities and configurations
├── store/                # Redux store and slices
├── types/                # TypeScript type definitions
└── hooks/                # Custom React hooks
```

## Features

- User authentication (Email/Password, Guest login)
- Book browsing and search
- Audio player
- Subscription management
- Library functionality

