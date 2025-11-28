# NESAVENT Frontend

Frontend aplikasi web untuk platform penjualan tiket event NesaVent dengan Next.js 16, TypeScript, dan Tailwind CSS.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Backend API running (see backend README)
- Git

### Installation

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   Configure your environment variables in `.env.local` file.

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:3000`

## 📁 Project Structure

```
frontend/
├── app/                          # Next.js 16 App Router
│   ├── (auth)/                   # Authentication routes (grouped)
│   │   ├── forgot-password/
│   │   ├── login/
│   │   ├── register/
│   │   ├── reset-password/
│   │   └── verify-email/
│   ├── admin/                    # Admin-specific pages
│   │   └── promo-codes/
│   ├── checkout/                 # Checkout flow
│   │   └── [id]/
│   ├── dashboard/                # Role-based dashboards
│   │   ├── analytics/            # Analytics pages
│   │   ├── events/               # Event management (mitra)
│   │   │   ├── create/
│   │   │   ├── edit/
│   │   │   └── analytics/
│   │   ├── notifications/
│   │   ├── orders/
│   │   ├── profile/
│   │   ├── settings/
│   │   ├── users/                # Admin: User management
│   │   └── withdrawals/
│   ├── events/                   # Public event pages
│   │   └── [id]/
│   ├── my-orders/                # User order history
│   ├── my-tickets/               # User tickets
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage
├── components/                   # Reusable components
│   ├── ui/                       # Shadcn/ui components
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── calendar.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── popover.tsx
│   │   ├── select.tsx
│   │   ├── skeleton.tsx
│   │   ├── tabs.tsx
│   │   └── textarea.tsx
│   ├── DashboardLayout.tsx       # Role-based sidebar layout
│   ├── EventCard.tsx             # Event display card
│   ├── Navbar.tsx                # Main navigation
│   ├── PromoCodeInput.tsx        # Promo code input component
│   ├── ProtectedRoute.tsx        # Route protection wrapper
│   ├── TicketCard.tsx            # Ticket display card
│   └── calendar-date-picker.tsx  # Date picker component
├── lib/                          # Utility libraries
│   ├── admin-api.ts              # Admin API functions
│   ├── api.ts                    # Main API client (axios)
│   ├── auth.ts                   # Authentication helpers
│   ├── formatters.ts             # Date & currency formatters
│   └── utils.ts                  # General utilities
├── public/                       # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── types/                        # TypeScript type definitions
│   └── admin.ts                  # Admin-specific types
├── components.json               # Shadcn/ui configuration
├── eslint.config.mjs             # ESLint configuration
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies & scripts
├── postcss.config.mjs            # PostCSS configuration
├── tailwind.config.ts            # Tailwind CSS configuration
└── tsconfig.json                 # TypeScript configuration
```

## 🎨 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + Shadcn/ui
- **Icons**: Lucide React
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Date Handling**: date-fns
- **Authentication**: JWT (JSON Web Tokens)
- **State Management**: React Hooks + Context

## 🔐 Authentication & Authorization

### User Roles & Dashboards

#### Admin Dashboard (`/dashboard`)
- **User Management**: View all users, change roles, delete users
- **Event Moderation**: Approve/reject events, view validation scores
- **Order Oversight**: Monitor all platform orders
- **Withdrawal Processing**: Process mitra withdrawal requests
- **Analytics**: Platform-wide statistics and insights

#### Mitra Dashboard (`/dashboard`)
- **Event Management**: Create, edit, delete events
- **Order Management**: View orders for their events
- **Analytics**: Event performance, revenue tracking
- **Withdrawal Requests**: Request payment withdrawals
- **Profile Management**: Update organizer information

#### User Dashboard (`/dashboard/my-orders`, `/dashboard/my-tickets`)
- **Order History**: View past and current orders
- **Ticket Management**: Access purchased tickets
- **Profile**: Update personal information

### Route Protection
- `ProtectedRoute` component wraps role-specific pages
- Automatic redirection based on user role
- JWT token validation on protected routes

## 🌐 Key Pages & Features

### Public Pages
- **Homepage** (`/`): Event discovery, featured events
- **Event Detail** (`/events/[id]`): Event information, ticket selection
- **Checkout** (`/checkout/[id]`): Order summary, payment processing

### Authentication Pages
- **Login** (`/auth/login`): User authentication
- **Register** (`/auth/register`): New user registration
- **Forgot Password** (`/auth/forgot-password`): Password reset request
- **Reset Password** (`/auth/reset-password/[token]`): Password reset
- **Verify Email** (`/auth/verify-email`): Email verification

### Dashboard Pages
- **Analytics** (`/dashboard/analytics`): Revenue charts, event stats
- **Events** (`/dashboard/events`): Event CRUD operations
- **Orders** (`/dashboard/orders`): Order management
- **Users** (`/dashboard/users`): User administration (admin only)
- **Withdrawals** (`/dashboard/withdrawals`): Withdrawal management
- **Notifications** (`/dashboard/notifications`): System notifications
- **Profile** (`/dashboard/profile`): User profile management
- **Settings** (`/dashboard/settings`): Application settings

## 🎯 Core Components

### UI Components (Shadcn/ui)
- **Button**: Consistent button styles with variants
- **Card**: Content containers with headers and footers
- **Input**: Form inputs with validation states
- **Select**: Dropdown selections
- **Calendar**: Date picker component
- **Dialog**: Modal dialogs for confirmations
- **Tabs**: Tabbed interfaces
- **Badge**: Status indicators and labels

### Business Components
- **EventCard**: Displays event information with booking CTA
- **TicketCard**: Shows ticket details with QR codes
- **DashboardLayout**: Responsive sidebar layout with role-based navigation
- **PromoCodeInput**: Discount code application component
- **ProtectedRoute**: Route guard with role checking

## 🔧 API Integration

### API Client (`lib/api.ts`)
```typescript
// Axios instance with interceptors
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// Request interceptor for JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Authentication Helpers (`lib/auth.ts`)
- `login()`: Authenticate user and store tokens
- `logout()`: Clear tokens and redirect
- `getCurrentUser()`: Get user profile from token
- `isAuthenticated()`: Check authentication status
- `hasRole()`: Check user role permissions

### Admin API (`lib/admin-api.ts`)
- User management functions
- Event moderation actions
- Platform analytics data
- Withdrawal processing

## 📊 Data Visualization

### Charts & Analytics
- **Revenue Charts**: Monthly revenue trends
- **Event Performance**: Ticket sales by event
- **User Growth**: Registration statistics
- **Payment Methods**: Payment method distribution

### Dashboard Widgets
- **KPIs**: Key performance indicators
- **Recent Activity**: Latest orders and events
- **Status Overview**: Pending approvals, active events
- **Financial Summary**: Revenue, withdrawals, balances

## 🎨 Styling & Theming

### Tailwind CSS v4
- **Utility-first**: Atomic CSS classes
- **Responsive Design**: Mobile-first approach
- **Dark Mode Ready**: CSS variables for theming
- **Custom Components**: Shadcn/ui integration

### Design System
- **Colors**: Consistent color palette
- **Typography**: Inter font family
- **Spacing**: Standardized spacing scale
- **Shadows**: Elevation system for depth

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile-First Approach
- Touch-friendly interfaces
- Optimized navigation for mobile
- Responsive tables and charts
- Mobile-optimized forms

## ⚙️ Environment Variables

Create a `.env.local` file in the frontend root:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Midtrans Payment
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your_midtrans_client_key

# Application
NEXT_PUBLIC_APP_NAME=NESAVENT
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🎯 Development Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🔧 Development Guidelines

### Code Style
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Automatic code formatting (recommended)

### Component Patterns
- **Functional Components**: Modern React patterns
- **Custom Hooks**: Reusable logic extraction
- **Type Safety**: Comprehensive TypeScript usage
- **Error Boundaries**: Graceful error handling

### State Management
- **Local State**: useState for component state
- **Server State**: SWR or React Query (recommended for future)
- **Global State**: Context API for user authentication
- **Form State**: React Hook Form for complex forms

## 🚀 Build & Deployment

### Build Process
```bash
npm run build    # Creates optimized production build
npm run start    # Serves production build locally
```

### Deployment Options
- **Vercel**: Recommended for Next.js apps
- **Netlify**: Static hosting with serverless functions
- **Railway**: Full-stack deployment
- **AWS Amplify**: AWS-integrated deployment

### Environment Setup
- **Development**: Local development environment
- **Staging**: Pre-production testing
- **Production**: Live application

## 🧪 Testing Strategy

### Testing Types
- **Unit Tests**: Component and utility testing
- **Integration Tests**: API integration testing
- **E2E Tests**: User journey testing

### Recommended Tools
- **Jest**: Unit testing framework
- **React Testing Library**: Component testing
- **Playwright/Cypress**: E2E testing

## 🔍 Performance Optimization

### Next.js Optimizations
- **App Router**: Modern routing with layouts
- **Server Components**: Server-side rendering
- **Image Optimization**: Automatic image optimization
- **Code Splitting**: Automatic route-based splitting

### Performance Best Practices
- **Lazy Loading**: Dynamic imports for heavy components
- **Memoization**: React.memo for expensive components
- **Bundle Analysis**: Webpack bundle analyzer
- **Caching**: Appropriate caching strategies

## 🐛 Troubleshooting

### Common Issues
1. **API Connection Errors**
   - Check backend server is running
   - Verify API URL in environment variables

2. **Authentication Issues**
   - Clear localStorage tokens
   - Check JWT token expiration

3. **Build Errors**
   - Clear `.next` folder
   - Reinstall dependencies

4. **Styling Issues**
   - Check Tailwind configuration
   - Verify CSS imports

## 📝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Commit Convention
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation updates
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Testing related changes

## 📄 License

This project is licensed under the MIT License.
