# Koepon System Architecture

## Current Technology Stack

### Backend (NestJS + Supabase)
- **Framework**: NestJS with TypeScript
- **Database**: Supabase (PostgreSQL with built-in auth/storage/realtime)
- **Authentication**: JWT + Refresh Tokens via Supabase Auth
- **File Storage**: Supabase Storage with signed URLs
- **API**: RESTful with `/api/v1` prefix
- **Validation**: class-validator + class-transformer
- **Security**: helmet, CORS, compression middleware

### Database Schema (Supabase)
Key tables:
- `users` - User profiles and authentication
- `vtubers` - VTuber creator profiles  
- `gachas` - Gacha configuration and items
- `gacha_items` - Individual gacha content items
- `oshi_medals` - Medal balance and transactions
- `gacha_pulls` - Pull history and results
- `reward_exchanges` - Exchange history
- `sessions` - Session management

### Frontend (Planned)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand + TanStack Query  
- **Authentication**: NextAuth.js integration with Supabase

### External Services
- **Payment**: Stripe (primary) + KOMOJU (Japan-specific)
- **CDN**: CloudFront or Cloudflare (planned)
- **File Storage**: Supabase Storage (currently), AWS S3/Cloudflare R2 (future)
- **Real-time**: Supabase Realtime for gacha animations

## Application Structure

```
src/
├── modules/
│   ├── database/     # Supabase connection and health checks
│   ├── auth/         # Authentication (planned)  
│   ├── user/         # User management (planned)
│   ├── gacha/        # Gacha system (planned)
│   ├── payment/      # Payment processing (planned)
│   ├── reward/       # Reward management (planned)
│   ├── exchange/     # Medal exchange (planned)
│   ├── vtuber/       # VTuber management (planned)
│   └── admin/        # Admin functions (planned)
├── common/           # Shared utilities
├── config/           # Configuration services
├── shared/           # Types and constants
├── app.module.ts     # Root module
└── main.ts          # Application entry point
```

## Development vs Production

### Current (Development)
- Supabase hosted database
- Local NestJS development server
- No containerization active (Docker prepared)
- Environment variables in `.env` files

### Planned (Production)
- Kubernetes deployment on AWS
- Docker containers
- CloudFront CDN
- Auto-scaling and load balancing
- Monitoring with Datadog/New Relic

## Security Architecture
- **Input Validation**: All endpoints validated with DTOs
- **Authentication**: JWT tokens with rotation
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Row Level Security (RLS) in Supabase
- **API Security**: Rate limiting, CORS, security headers
- **File Security**: Signed URLs for controlled access

## Integration Points
- **Supabase API**: Database, Auth, Storage, Realtime
- **Payment Gateway**: Stripe webhooks for payment confirmation
- **File Storage**: Upload/download with signed URLs
- **Email**: Supabase Auth email templates
- **Analytics**: Business metrics collection (planned)

## Scalability Considerations
- Database connection pooling via Supabase
- Stateless application design
- Horizontal scaling ready
- CDN for static assets
- Database indexing strategy implemented
- Real-time features optimized for performance