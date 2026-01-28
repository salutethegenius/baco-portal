# BACO Portal

A comprehensive membership management platform for the Bahamas Association of Compliance Officers (BACO). This web application provides a complete solution for managing member accounts, events, documents, messaging, and payments.

## 🎯 Overview

The BACO Portal is a full-stack web application that enables BACO members to:
- Manage their membership profiles and status
- Register for events and conferences
- Upload and manage professional documents
- Communicate with administrators through a secure messaging system
- Process membership payments and event registrations

Administrators have access to a comprehensive admin panel for managing members, events, documents, and communications.

## ✨ Features

### Member Features
- **Dashboard**: Personalized dashboard with membership status, payment due dates, recent activity, and quick actions
- **Event Management**: Browse and register for BACO events and conferences
- **Document Management**: Upload, view, and manage professional documents and certifications
- **Messaging System**: Two-way messaging with administrators through conversation threads
- **Profile Management**: Update personal information and membership details
- **Payment Processing**: Secure payment processing for membership fees and event registrations

### Admin Features
- **Member Management**: View, edit, and manage member accounts
- **Event Administration**: Create, edit, and manage events with registration tracking
- **Document Verification**: Review, approve, or reject member-uploaded documents
- **Message Management**: View and respond to member messages through conversation threads
- **Analytics Dashboard**: View system statistics and member activity

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Wouter** for routing
- **TanStack Query** for data fetching
- **React Hook Form** with Zod validation
- **Radix UI** components
- **Tailwind CSS** for styling
- **Uppy** for file uploads

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Drizzle ORM** for database operations
- **PostgreSQL** database
- **Passport.js** for authentication
- **Express Session** for session management
- **Stripe API** for payment processing
- **AWS SES** for email notifications
- **Supabase Storage** for file storage

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** database (or access to a cloud database like Supabase/Neon)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Baco-Portal
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Session
SESSION_SECRET=your_random_secret_here

# Environment
NODE_ENV=development
PORT=5000

# Supabase Storage (for file uploads)
SUPABASE_STORAGE_ENDPOINT=https://your-project.supabase.co/storage/v1/s3
SUPABASE_STORAGE_REGION=us-west-2
SUPABASE_STORAGE_BUCKET=documents
SUPABASE_STORAGE_ACCESS_KEY=your_access_key
SUPABASE_STORAGE_SECRET_KEY=your_secret_key

# AWS SES (for emails)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@baco-bahamas.com

# Stripe (for payments - optional)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Application URL
APP_URL=http://localhost:5000
```

### 4. Set Up the Database

Push the database schema:

```bash
npm run db:push
```

### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 📁 Project Structure

```
Baco-Portal/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions and configurations
│   │   ├── pages/         # Page components
│   │   └── App.tsx        # Main application component
│   └── index.html
├── server/                 # Backend Express application
│   ├── auth.ts            # Authentication setup
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Database operations
│   ├── awsStorage.ts      # Supabase storage service
│   └── index.ts           # Server entry point
├── shared/                 # Shared code between client and server
│   └── schema.ts          # Database schema definitions
├── .env                    # Environment variables (not in git)
└── package.json           # Project dependencies and scripts
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type-check TypeScript files
- `npm run db:push` - Push database schema changes
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## 🔐 Authentication

The application uses session-based authentication with Passport.js:
- Members can register and log in with email/password
- Sessions are stored in PostgreSQL
- Password reset functionality is available
- Admin users have elevated permissions

## 💳 Payment Processing

Payment processing is handled through Stripe:
- Membership fees can be paid annually
- Event registration payments are supported
- Payment status is tracked in the database
- Webhook support for payment confirmations

## 📧 Email Notifications

Email notifications are sent via AWS SES for:
- Registration confirmations
- Password reset links
- Event registration confirmations
- Document approval/rejection notifications
- Message notifications

## 🗄️ Database

The application uses PostgreSQL with Drizzle ORM:
- Schema is defined in `shared/schema.ts`
- Migrations are handled via `drizzle-kit`
- Database operations are abstracted in `server/storage.ts`

## 🚢 Deployment

### Environment Setup

For production deployment:
1. Set `NODE_ENV=production`
2. Configure all environment variables
3. Ensure database is accessible
4. Set up SSL certificates for HTTPS
5. Configure CORS if needed

### Build for Production

```bash
npm run build
npm run start
```

## 📝 Recent Updates

### Dashboard Improvements
- Real-time activity feed from member actions
- Documents summary with counts and recent files
- Dynamic upcoming events display
- Payment due date logic for pending members

### Two-Way Messaging System
- Complete admin-member messaging with conversation threads
- Reply functionality for both members and admins
- Unread message indicators
- Conversation grouping for easy navigation

### UX Enhancements
- Loading bar component with progress animation
- Improved dashboard loading performance
- Enhanced message UI with thread-based view
- Fixed logout functionality

## 🐛 Known Issues

- Document upload may hang at 100% completion (under investigation)
- Some TypeScript type errors in event-related pages (pre-existing, non-blocking)

## 🤝 Contributing

1. Create a feature branch from `main` or `stable`
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

MIT License

## 📞 Support

For issues or questions, please contact the BACO administration team.

---

**Built with ❤️ for the Bahamas Association of Compliance Officers**
