# Overview

This is a BACO (Bahamas Association of Compliance Officers) membership platform that provides a comprehensive web application for managing member accounts, events, documents, messaging, and payments. The platform enables BACO members to maintain their profiles, pay membership fees, upload documents, participate in events, and communicate with administrators through a secure portal.

The application serves as a complete membership management system with features including user authentication, payment processing via Stripe, document management with Google Cloud Storage, event registration with detailed forms, and internal messaging system.

## Recent Updates (August 2025)

### Public Event Pages with SEO-Friendly Slugs (August 11, 2025)
- **Public Event URLs**: SEO-friendly public event pages at `/events/{slug}` (e.g., `/events/baco-annual-conference-2025`)
- **No Authentication Required**: Public can view events and register without BACO membership or login
- **Automatic Slug Generation**: Event titles converted to URL-safe slugs (e.g., "BACO Annual Conference 2025" → "baco-annual-conference-2025")
- **Comprehensive Registration Form**: Collects full name, email, position, company, phone number, and optional notes
- **Event Capacity Management**: Real-time attendee count tracking and registration limits
- **Admin Public Page Buttons**: Admin panel includes "Public Page" buttons to easily access shareable event URLs
- **Professional Event Layout**: Complete event details with date, time, location, pricing, and registration status
- **Payment Handling**: Deferred payment collection - registration details captured first, payment processed separately

### Event Management System Complete
- **Dedicated Event Pages**: Individual event pages at `/event/{eventId}` with complete event details
- **Registration Forms**: Professional registration forms that collect detailed user information (name, email, position, phone, notes)
- **Payment Flexibility**: Registration details collected first, payment processing handled separately for administrative flexibility
- **Admin Integration**: Full CRUD operations for events with "View Event Page" functionality for easy sharing

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent UI design
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for robust form handling
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety across the stack
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon serverless PostgreSQL for scalable cloud database
- **Authentication**: Replit Auth with OpenID Connect for secure authentication
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple

## Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless with the following key tables:
  - `users`: Member profiles and authentication data
  - `events`: Event management and registration
  - `documents`: Document metadata and verification status
  - `messages`: Internal messaging system
  - `payments`: Payment tracking and history
  - `sessions`: Session storage for authentication
- **File Storage**: Google Cloud Storage for document uploads and management
- **Object Storage**: Custom ACL system for fine-grained file access control

## Authentication and Authorization
- **Authentication Provider**: Replit Auth using OpenID Connect protocol
- **Session Management**: Server-side sessions stored in PostgreSQL
- **Authorization**: Role-based access control with admin/member distinction
- **Security**: HTTPS enforcement, secure cookies, and CSRF protection

## Payment Processing
- **Payment Provider**: Stripe for secure credit card processing
- **Supported Flows**: One-time payments for membership fees and event registration
- **Integration**: React Stripe.js for frontend, Stripe Node.js SDK for backend
- **Webhook Support**: Configured for payment confirmation and status updates

# External Dependencies

## Core Services
- **Neon Database**: Serverless PostgreSQL database hosting
- **Google Cloud Storage**: File storage and management with custom ACL policies
- **Stripe**: Payment processing for membership fees and event registration
- **Replit Auth**: Authentication service using OpenID Connect

## Development Tools
- **Replit Runtime**: Development environment and deployment platform
- **Vite**: Build tool with React plugin and runtime error overlay
- **TypeScript**: Type checking and compilation
- **Drizzle Kit**: Database schema management and migrations

## UI and UX Libraries
- **Radix UI**: Accessible component primitives for complex UI elements
- **Uppy**: File upload handling with drag-and-drop interface
- **date-fns**: Date formatting and manipulation
- **Lucide React**: Icon library for consistent iconography

## Validation and Forms
- **Zod**: Schema validation for forms and API endpoints
- **React Hook Form**: Form state management with validation
- **@hookform/resolvers**: Integration between React Hook Form and Zod

## State Management
- **TanStack React Query**: Server state management, caching, and synchronization
- **Wouter**: Lightweight routing solution for single-page application navigation