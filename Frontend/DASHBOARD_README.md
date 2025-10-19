# Pockity Frontend - API Management Dashboard

A modern, fully-featured Next.js 14 frontend for the Pockity API management system, inspired by Cloudinary's dashboard design.

## 🚀 Features

### User Dashboard (`/dashboard`)

- **Overview Page**: Statistics, charts, and recent activity
- **API Keys Management**: Create, view, revoke, and manage API keys
- **Usage Analytics**: Detailed usage stats, rate limits, and storage metrics with interactive charts
- **Account Settings**: Profile management, password change, and account deletion

### Admin Dashboard (`/admin`)

- **System Overview**: Global statistics and system health monitoring
- **Request Management**: Review, approve, or reject API key requests
- **User Management**: View all users, search, and manage accounts
- **System Stats**: Performance metrics, audit logs, and system monitoring

### Authentication

- **Email + OTP Authentication**: Secure login and registration flow
- **Protected Routes**: Automatic redirection for unauthenticated users
- **Role-Based Access**: Separate dashboards for users and admins

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Lucide React icons
- **Data Fetching**: TanStack React Query (React Query v5)
- **Charts**: Recharts
- **Forms**: React Hook Form (implicit via shadcn)
- **State Management**: React Context + React Query

## 📁 Project Structure

```
Frontend/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Home (redirects to dashboard)
│   ├── auth/                    # Authentication pages
│   │   ├── signIn/
│   │   ├── signUp/
│   │   └── signOut/
│   ├── dashboard/               # User dashboard
│   │   ├── layout.tsx          # Dashboard layout with sidebar
│   │   ├── page.tsx            # Dashboard overview
│   │   ├── api-keys/           # API key management
│   │   ├── usage/              # Usage analytics
│   │   └── settings/           # Account settings
│   └── admin/                   # Admin dashboard
│       ├── layout.tsx          # Admin layout with sidebar
│       ├── page.tsx            # Admin overview
│       ├── requests/           # API key request management
│       ├── users/              # User management
│       └── stats/              # System statistics
├── components/
│   ├── dashboard/              # Dashboard-specific components
│   │   ├── StatCard.tsx
│   │   ├── ChartCard.tsx
│   │   ├── EmptyState.tsx
│   │   ├── DashboardSidebar.tsx
│   │   └── AdminSidebar.tsx
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── apiClient.ts            # Typed API client for backend
│   └── utils.ts                # Utility functions
├── contexts/
│   └── AuthContext.tsx         # Authentication context and hooks
├── providers/
│   └── ReactQueryProvider.tsx  # React Query provider
├── types/
│   └── api.ts                  # TypeScript types for API
└── middleware.ts               # Route protection middleware
```

## 🎨 Design Features

- **Responsive Design**: Fully responsive across desktop, tablet, and mobile
- **Dark Mode Ready**: Built with Tailwind's dark mode support
- **Modern UI**: Clean, minimal design inspired by Cloudinary
- **Interactive Charts**: Real-time data visualization with Recharts
- **Loading States**: Skeleton loaders for better UX
- **Error Handling**: Comprehensive error handling with toast notifications

## 📊 Dashboard Pages

### User Dashboard

#### Overview (`/dashboard`)

- Active API keys count
- Total requests and storage metrics
- Request usage charts (last 6 months)
- Storage distribution by file type
- Recent API keys list

#### API Keys (`/dashboard/api-keys`)

- List all API keys with status
- Request new API key (with approval workflow)
- View key details, limits, and usage
- Copy API keys to clipboard
- Revoke API keys with confirmation
- Track pending requests

#### Usage (`/dashboard/usage`)

- Select API key to view stats
- Request and storage limits with progress bars
- Daily requests chart (last 7 days)
- Storage distribution by file type
- Monthly trend analysis

#### Settings (`/dashboard/settings`)

- Profile information management
- Password change
- Email verification status
- Account deletion (with warning)

### Admin Dashboard

#### Overview (`/admin`)

- Total users and API keys
- System health and uptime
- API keys by tier distribution
- User growth chart
- Pending requests alerts

#### Requests (`/admin/requests`)

- Pending requests list
- Reviewed requests history
- Approve/reject with comments
- Request details view

#### Users (`/admin/users`)

- All users table
- Search by name or email
- User statistics (API keys, requests)
- Role and verification status

#### System Stats (`/admin/stats`)

- System health metrics
- Performance monitoring (CPU, memory, requests)
- Audit logs table
- Uptime tracking

## 🔧 Setup & Installation

1. **Install dependencies**:

   ```bash
   cd Frontend
   npm install
   ```

2. **Configure environment variables**:
   Create `.env.local` file:

   ```env
   NEXT_PUBLIC_NODE_ENV=development
   NEXT_PUBLIC_PORT=3000
   NEXT_PUBLIC_SERVER_URL=http://localhost:5000
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   NEXT_PUBLIC_GOOGLE_REDIRECT_URL=http://localhost:3000/auth/google/callback
   ```

3. **Run development server**:

   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

## 🔐 Authentication Flow

1. User enters email on sign-in/sign-up page
2. OTP is sent to email via backend
3. User verifies OTP
4. JWT token is stored in cookies
5. AuthContext manages user state
6. Middleware protects routes
7. Admin users can access `/admin` routes

## 📡 API Integration

The frontend connects to the backend via a typed API client (`lib/apiClient.ts`):

```typescript
import { api } from '@/lib/apiClient';

// Example usage
const { data } = useQuery({
  queryKey: ['apiKeys'],
  queryFn: async () => {
    const response = await api.apiKey.listApiKeys();
    return response.data;
  },
});
```

All API calls are typed and include:

- Authentication APIs
- User management APIs
- API key management APIs
- Admin APIs
- Storage APIs

## 🎯 Key Components

### Authentication

- `AuthContext`: Manages user state and authentication
- `ProtectedRoute`: HOC for route protection
- `useAuth`: Hook for accessing auth state

### Dashboard

- `StatCard`: Reusable stat display card
- `ChartCard`: Card wrapper for charts
- `EmptyState`: Empty state placeholder
- `DashboardSidebar`: User dashboard navigation
- `AdminSidebar`: Admin dashboard navigation

## 🚦 Routing

- `/` - Redirects to `/dashboard`
- `/auth/signIn` - Login page
- `/auth/signUp` - Registration page
- `/auth/signOut` - Logout page
- `/dashboard` - User dashboard (protected)
- `/dashboard/api-keys` - API key management (protected)
- `/dashboard/usage` - Usage analytics (protected)
- `/dashboard/settings` - Account settings (protected)
- `/admin` - Admin overview (admin only)
- `/admin/requests` - Request management (admin only)
- `/admin/users` - User management (admin only)
- `/admin/stats` - System stats (admin only)

## 🔍 Code Quality

- **TypeScript**: Full type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Components**: Modular and reusable
- **Error Boundaries**: Graceful error handling
- **Loading States**: Better UX with skeletons

## 📝 Next Steps

To extend the dashboard:

1. **Add more charts**: Enhance analytics with additional visualizations
2. **Real-time updates**: Implement WebSocket for live data
3. **Export data**: Add CSV/PDF export functionality
4. **Advanced filters**: Add date range pickers and filters
5. **Notifications**: Implement push notifications
6. **File upload**: Add file upload UI for storage management
7. **API documentation**: Embed API docs in the dashboard
8. **Billing**: Add subscription and payment management

## 📄 License

This project is part of the Pockity API management system.

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript for all new files
3. Add proper error handling
4. Include loading states
5. Write clean, documented code

---

Built with ❤️ using Next.js 14, TypeScript, and shadcn/ui
