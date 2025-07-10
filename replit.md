# ChatFlow Application - Architecture Overview

## Overview

ChatFlow is a real-time chat application built with a modern full-stack TypeScript architecture. It features room-based messaging, direct messages, friend management, and user authentication. The application uses a monorepo structure with shared schemas and types between the client and server.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **Session Management**: Express sessions with PostgreSQL session store

### Database Architecture
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM with type-safe queries
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Connection pooling with @neondatabase/serverless

## Key Components

### Database Schema
The application uses five main tables:
- **users**: User accounts with authentication and profile data
- **rooms**: Chat rooms with privacy settings and invite codes
- **room_members**: Many-to-many relationship between users and rooms
- **messages**: Chat messages supporting both room and direct messages
- **friendships**: Friend requests and relationships between users

### Authentication System
- JWT token-based authentication stored in localStorage
- Automatic token refresh and user status updates
- Protected routes with authentication middleware
- Password hashing with bcrypt (10 rounds)

### Real-time Features
- User status tracking (online, away, offline)
- Message delivery and room membership management
- Invite system with unique codes for room joining

### UI Components
- Responsive design with mobile-first approach
- Dark/light theme support via CSS variables
- Modular component system with shadcn/ui
- Toast notifications for user feedback
- Loading states and error handling

## Data Flow

### Authentication Flow
1. User submits credentials to `/api/auth/login` or `/api/auth/register`
2. Server validates credentials and generates JWT token
3. Token stored in localStorage and attached to subsequent requests
4. Protected routes verify token and update user status

### Messaging Flow
1. User sends message through chat interface
2. Message data sent to appropriate API endpoint (room or direct message)
3. Database stores message with sender and recipient/room information
4. Real-time updates trigger UI refresh via React Query invalidation

### Room Management
1. Users can create public or private rooms
2. Private rooms require invite codes for joining
3. Room membership tracked in room_members table
4. Room creators have admin privileges

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight React router
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT token management

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe CSS class variants
- **react-hook-form**: Form state management
- **zod**: Runtime type validation

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type checking
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Build Process
1. **Client Build**: Vite builds React app to `dist/public`
2. **Server Build**: esbuild bundles server code to `dist/index.js`
3. **Database**: Drizzle Kit handles schema migrations

### Environment Requirements
- **DATABASE_URL**: PostgreSQL connection string (required)
- **JWT_SECRET**: Secret key for JWT signing (defaults to development key)
- **NODE_ENV**: Environment mode (development/production)

### Production Setup
- Express server serves static files from build output
- Database migrations run via `npm run db:push`
- Session storage uses PostgreSQL with connect-pg-simple
- CORS and security headers configured for production

### Development Workflow
- Vite dev server with HMR for frontend development
- tsx for server development with auto-restart
- Shared types and schemas ensure consistency
- TypeScript strict mode for type safety