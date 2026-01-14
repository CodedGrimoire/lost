# CampusLost+Found

**CampusLost+Found** is a modern, full-stack web application designed to help students and campus community members report, browse, and reclaim lost items around campus. Built with Next.js 16 (App Router) and featuring a beautiful glassmorphism UI with light/dark theme support, interactive maps, and secure Firebase authentication.

## 🚀 Tech Stack

- **Framework:** Next.js 16 (App Router) with React 19
- **Styling:** Tailwind CSS 4, custom gradients, glassmorphism effects, `next-themes`
- **Authentication:** Firebase Authentication (email/password + Google via client SDK)
- **Database:** MongoDB via official driver (used only inside `app/api`)
- **Maps:** React Leaflet with OpenStreetMap tiles
- **Utilities:** TypeScript, ESLint, React Hot Toast
- **Package Manager:** pnpm

---

## 📦 Setup & Installation

### Prerequisites

- Node.js 18+ and pnpm installed
- MongoDB database (local or cloud)
- Firebase project with Authentication enabled

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lost
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:3000
   
   # Firebase Configuration (Client SDK)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   
   # MongoDB Connection
   MONGODB_URI=your_mongodb_connection_string
   
   # Demo Login (Optional)
   DEMO_USER=demo@example.com
   DEMO_PASSWORD=demo_password
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

---

## 🛣️ Route Summary

### Frontend Routes (Pages)

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Landing page with hero, features, about, and campus map | No |
| `/login` | User login page (Firebase Auth + Demo login) | No |
| `/signup` | User registration page | No |
| `/items` | Browse all lost and found items with filters | No |
| `/items/[id]` | View detailed item information with location map and matching lost items | No |
| `/add-item` | Report a new lost or found item | Yes |
| `/dashboard` | User dashboard with statistics and reported items | Yes |
| `/dashboard/claims` | Finder dashboard to manage claims for found items | Yes |
| `/profile` | User profile page with account information | Yes |
| `/claims` | Claims management page (alternative route) | Yes |

### API Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/items` | Fetch all items (supports `?filter=lost` or `?filter=found`) | No |
| `POST` | `/api/items` | Create a new item report | Yes |
| `GET` | `/api/items/[id]` | Fetch a single item by ID | No |
| `GET` | `/api/items/[id]/matches` | Get matching lost items for a found item | No |
| `POST` | `/api/auth/demo` | Demo login endpoint | No |
| `POST` | `/api/claims` | Create a new claim for a found item | Yes |
| `GET` | `/api/claims` | Get claims for an item (finder only, requires `?itemId=...`) | Yes |
| `PATCH` | `/api/claims/[id]` | Approve or reject a claim | Yes |
| `GET` | `/api/notifications` | Fetch notifications for current user | Yes |
| `PATCH` | `/api/notifications/[id]/read` | Mark notification as read | Yes |
| `GET` | `/api/user/me` | Get current user information | Yes |
| `GET` | `/api/user/items` | Get items reported by current user (requires `?email=...`) | Yes |

---

## ✨ Implemented Features

### 1. **Authentication System**
- **Email/Password Authentication** via Firebase client SDK
- **Google Sign-In** integration
- **Demo Login** for quick testing (configurable via environment variables)
- **Cookie-based Session Management** for persistent authentication
- **Protected Routes** with automatic redirect to login
- **User Profile Display** in navbar (username and profile picture)

### 2. **Item Management**
- **Browse Items** - View all lost and found items with filtering options
- **Item Details** - Comprehensive item view with image, description, location, and status
- **Report Items** - Protected form to report new lost or found items
- **Status Indicators** - Visual badges for "Lost" (🔍) and "Found" (✅) items
- **Image Support** - Display item images from URLs (Firebase Storage compatible)

### 3. **Interactive Maps**
- **Campus Location Map** - Landing page map showing Dhaka University location
- **Item Location Map** - Individual item pages show location on interactive map
- **React Leaflet Integration** - Full map functionality with markers and popups
- **Coordinate Parsing** - Automatic location parsing from text descriptions
- **Fallback Handling** - Defaults to campus location if coordinates unavailable

### 4. **Modern UI/UX**
- **Glassmorphism Design** - Beautiful frosted glass effects throughout the application
- **Light/Dark Theme** - Seamless theme switching with `next-themes`
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Loading States** - Skeleton loaders and animated spinners
- **Toast Notifications** - User feedback via React Hot Toast
- **Smooth Animations** - Fade-in, slide-in, and gradient animations
- **Accessibility** - WCAG 2.1 AA compliant color contrast and keyboard navigation

### 5. **Landing Page Sections**
- **Hero Section** - Eye-catching introduction with gradient text and CTA buttons
- **How It Works** - Three-step process explanation
- **Recent Lost Items** - Highlights of recently reported items
- **About Section** - Mission, features, and platform information
- **Campus Location** - Interactive map showing university location
- **Safety Notice** - Important security and safety guidelines
- **Call-to-Action** - Encouraging user engagement

### 6. **Navigation & Layout**
- **Smart Navbar** - Dynamic links based on authentication status
  - Shows "Login" and "Sign Up" when logged out
  - Shows "Report Item", username, profile picture, and "Logout" when logged in
- **Footer** - Comprehensive footer with quick links, privacy policy, and social media
- **Breadcrumbs** - Clear navigation hierarchy

### 7. **Color Palette & Theming**
- **Cohesive Color Scheme** - Primary blue, yellow accents, and state colors
- **Gradient Effects** - Beautiful gradients for backgrounds and text
- **Theme-Aware Components** - All components adapt to light/dark mode
- **Custom CSS Variables** - Centralized color management in `globals.css`

### 8. **Claim & Verification System**
- **Claim Items** - Users can claim found items that might belong to them
- **Claim Status Tracking** - Items show status: Available, Claim Pending, or Claimed
- **Finder Dashboard** - Finders can view and manage all claims for their found items
- **Approve/Reject Claims** - Finders can approve or reject claims with proper validation
- **One Claim Per Item** - System ensures only one approved claim per found item
- **Automatic Rejection** - When a claim is approved, all other pending claims are automatically rejected

### 9. **In-App Notifications System**
- **Real-Time Notifications** - Users receive notifications for claim-related activities
- **Notification Types**:
  - `claim_created` - Notifies finder when someone requests to claim their found item
  - `claim_approved` - Notifies claimer when their claim is approved
  - `claim_rejected` - Notifies claimer when their claim is rejected
- **Notification Bell** - Navbar bell icon with unread count badge
- **Notification Dropdown** - Click bell to view all notifications with read/unread status
- **Auto-Refresh** - Notifications refresh every 30 seconds
- **Click to Navigate** - Clicking a notification marks it as read and navigates to the item

### 10. **Cross-Search Matching System**
- **Smart Matching** - Found items automatically show matching lost items
- **Keyword Matching** - Matches based on title and description keywords
- **Location Matching** - Matches items with similar locations
- **Category Matching** - Optional category-based matching
- **Possible Owners Section** - Found item pages show people who reported losing similar items
- **Quick Claim** - Users can claim found items directly from matching lost items
- **Read-Only Suggestions** - Matching is informational only, no auto-claiming

### 11. **User Dashboard & Profile**
- **User Dashboard** - Statistics and overview of user's reported items
- **Profile Page** - View and manage account information
- **Reported Items** - View all items reported by the user
- **Quick Actions** - Easy access to common tasks from dashboard

### 12. **Performance Optimizations**
- **Dynamic Imports** - Leaflet maps loaded client-side to prevent SSR issues
- **Image Optimization** - Next.js Image component with remote pattern support
- **Code Splitting** - Automatic route-based code splitting
- **Lazy Loading** - Components loaded on demand

---

## 📝 Feature Explanations

### Authentication System
The application uses Firebase Authentication's client SDK for secure user authentication. Users can sign up and log in using email/password or Google OAuth. A demo login option is available for quick testing without creating real accounts. Session management is handled via HTTP-only cookies, ensuring secure token storage.

### Item Management
Items are stored in MongoDB and can be filtered by status (lost/found). The item detail page provides comprehensive information including images, descriptions, location data, and an interactive map. Only authenticated users can report new items, while browsing is open to everyone.

### Interactive Maps
React Leaflet powers the map functionality, showing both the campus location on the landing page and specific item locations on detail pages. The system intelligently parses location strings for coordinates and falls back to the campus location if coordinates aren't available.

### Glassmorphism UI
The entire application features a modern glassmorphism design with:
- Semi-transparent backgrounds with backdrop blur
- Subtle borders and soft shadows
- Saturation enhancement for vibrant colors
- Theme-aware glass effects for both light and dark modes

### Responsive Design
Built mobile-first with Tailwind CSS, the application adapts seamlessly to all screen sizes. Components use CSS Grid and Flexbox for flexible layouts that work on phones, tablets, and desktops.

### Theme System
The application supports both light and dark themes with automatic system preference detection. Users can manually toggle themes, and all components adapt their colors, backgrounds, and glass effects accordingly.

### Claim & Verification System
The application includes a complete claim pipeline for found items. Users can submit claims for found items they believe belong to them, providing proof messages. Finders (those who reported found items) can view all claims in their dashboard and approve or reject them. When a claim is approved, the item is marked as claimed and all other pending claims are automatically rejected. The system ensures only one approved claim per item.

### In-App Notifications System
A comprehensive notification system keeps users informed about claim-related activities. Notifications are created server-side when claims are created, approved, or rejected. The navbar includes a notification bell with an unread count badge. Users can click the bell to view all notifications in a dropdown, with unread notifications visually distinct. Clicking a notification marks it as read and navigates to the relevant item.

### Cross-Search Matching System
The application includes an intelligent matching system that helps connect found items with potential owners. When viewing a found item, the system automatically searches for matching lost items based on keywords from the title and description, location similarity, and optional category matching. The "Possible Owners" section shows people who reported losing similar items, making it easier for finders to identify potential owners and for owners to discover found items that might be theirs.

### User Dashboard & Profile
Authenticated users have access to a personal dashboard showing statistics about their reported items (total, lost, found, recent items). The dashboard also displays all items reported by the user. A separate profile page shows detailed account information including name, email, account creation date, and verification status.

---

## 📁 Project Structure

```
lost/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── items/         # Item CRUD endpoints
│   │   ├── claims/        # Claim management endpoints
│   │   ├── notifications/ # Notification endpoints
│   │   └── user/          # User-specific endpoints
│   ├── items/             # Item pages
│   ├── dashboard/         # Dashboard pages
│   │   └── claims/        # Claims management page
│   ├── profile/            # User profile page
│   ├── claims/             # Claims page (alternative)
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── add-item/          # Report item page
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── Navbar.tsx         # Navigation bar
│   ├── Footer.tsx         # Footer component
│   ├── ItemCard.tsx       # Item card component
│   ├── CampusMap.tsx      # Campus location map
│   ├── ItemLocationMap.tsx # Item location map
│   ├── ClaimModal.tsx     # Claim submission modal
│   ├── Loader.tsx         # Loading indicators
│   └── Skeleton.tsx       # Skeleton loaders
├── lib/                   # Utility libraries
│   ├── firebase.ts        # Firebase client config
│   ├── mongodb.ts         # MongoDB connection
│   ├── apiClient.ts       # API client utilities
│   └── utils.ts           # General utilities
├── types/                 # TypeScript type definitions
│   └── item.ts            # Item, Claim, and Notification types
└── public/                # Static assets
```

---

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server on http://localhost:3000 |
| `pnpm build` | Create production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint to check code quality |

---

## 🔒 Security Notes

- Firebase Admin SDK is intentionally not used; all authentication is client-side
- MongoDB access is confined to `app/api/**` to keep React components free of server-only code
- Authentication tokens are stored in HTTP-only cookies
- Environment variables are never exposed to the client (except `NEXT_PUBLIC_*` prefixed ones)

---

## 📄 License

This project is private and proprietary.

---

## 🤝 Contributing

This is a private project. For questions or issues, please contact the development team.

---

## 📧 Contact

For support or inquiries:
- 📧 Email: support@campuslostfound.edu
- 📍 Location: Dhaka University Campus
