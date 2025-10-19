# Quick Start Guide - Pockity Dashboard

## 🚀 Getting Started in 3 Minutes

### 1. Prerequisites

- Node.js 20.x or higher
- npm 9.x or higher
- Running Pockity backend server

### 2. Installation

```bash
cd Frontend
npm install
```

### 3. Environment Setup

Create `.env.local`:

```env
NEXT_PUBLIC_NODE_ENV=development
NEXT_PUBLIC_PORT=3000
NEXT_PUBLIC_SERVER_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_GOOGLE_REDIRECT_URL=http://localhost:3000/auth/google/callback
```

### 4. Run Development Server

```bash
npm run dev
```

Visit: `http://localhost:3000`

## 📱 First Time Usage

### For Users:

1. **Sign Up** at `/auth/signUp`
   - Enter your name and email
   - Verify with OTP sent to your email
2. **Dashboard** - Navigate to `/dashboard`
   - View your overview statistics
3. **Request API Key** - Go to `/dashboard/api-keys`
   - Click "Request New Key"
   - Fill in the form with key name, tier, and reason
   - Wait for admin approval
4. **Monitor Usage** - Go to `/dashboard/usage`
   - View real-time usage statistics
   - Track request and storage limits
5. **Manage Profile** - Go to `/dashboard/settings`
   - Update your profile
   - Change password
   - Manage account

### For Admins:

1. **Sign In** as admin user at `/auth/signIn`

2. **Admin Dashboard** - Navigate to `/admin`
   - View system-wide statistics
3. **Review Requests** - Go to `/admin/requests`
   - Approve or reject API key requests
   - Add review comments
4. **Manage Users** - Go to `/admin/users`
   - View all registered users
   - Search and filter users
5. **System Monitoring** - Go to `/admin/stats`
   - Monitor system health
   - View audit logs
   - Track performance metrics

## 🎨 UI Features

### User Dashboard Features:

- ✅ Real-time statistics cards
- ✅ Interactive charts (Recharts)
- ✅ API key management with copy/revoke
- ✅ Usage analytics with filters
- ✅ Profile settings and password change
- ✅ Responsive sidebar navigation
- ✅ Mobile-friendly design

### Admin Dashboard Features:

- ✅ System health monitoring
- ✅ API key request approval workflow
- ✅ User management table with search
- ✅ Audit logs tracking
- ✅ Performance metrics visualization
- ✅ Pending requests notifications

## 🛠️ Tech Stack

| Technology   | Purpose                         |
| ------------ | ------------------------------- |
| Next.js 14   | React framework with App Router |
| TypeScript   | Type safety                     |
| Tailwind CSS | Styling                         |
| shadcn/ui    | UI component library            |
| React Query  | Server state management         |
| Recharts     | Data visualization              |
| Lucide React | Icons                           |

## 📂 Key Files

```
Frontend/
├── app/                    # App Router pages
│   ├── dashboard/         # User dashboard
│   └── admin/             # Admin dashboard
├── lib/apiClient.ts       # API integration
├── contexts/AuthContext.tsx # Authentication
├── components/dashboard/  # Shared components
└── types/api.ts           # TypeScript types
```

## 🔧 Common Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack

# Production
npm run build           # Build for production
npm start               # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run format          # Check formatting
npm run format:fix      # Fix formatting
```

## 🐛 Troubleshooting

### Issue: "Cannot connect to backend"

**Solution**: Ensure `NEXT_PUBLIC_SERVER_URL` is correct and backend is running

### Issue: "Authentication not working"

**Solution**: Check that cookies are enabled and backend JWT is configured

### Issue: "Charts not displaying"

**Solution**: Ensure you have data in the database and API is returning valid responses

### Issue: "Admin routes not accessible"

**Solution**: Verify your user has `role: "ADMIN"` in the database

## 📊 Sample Data Flow

```
User Login Flow:
1. Enter email → POST /api/auth/request-login
2. Enter OTP → POST /api/auth/verify-login
3. Receive JWT → Store in cookies
4. Fetch profile → GET /api/user/profile
5. Redirect to /dashboard

API Key Request Flow:
1. Click "Request New Key"
2. Fill form → POST /api/api-key/request/create
3. Admin reviews → PATCH /api/api-key/request/admin/review/:id
4. Get notification
5. View approved key → GET /api/api-key/
```

## 🎯 Next Actions

After setup, you can:

1. **Customize styling** - Edit `tailwind.config.ts`
2. **Add more charts** - Use Recharts in dashboard pages
3. **Extend API client** - Add more endpoints in `lib/apiClient.ts`
4. **Create new pages** - Add folders in `app/` directory
5. **Add components** - Create reusable components in `components/`

## 📞 Support

For issues or questions:

- Check the `DASHBOARD_README.md` for detailed documentation
- Review backend API documentation in `Server/API_DOCUMENTATION.md`
- Check TypeScript types in `types/api.ts`

## 🎉 You're Ready!

The dashboard is now set up and ready to use. Start by creating an account and requesting your first API key!

---

**Happy coding! 🚀**
