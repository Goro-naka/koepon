# Essential Development Commands

## Daily Development Commands
```bash
# Start development server
npm run dev

# Type checking
npm run typecheck

# Linting and formatting
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

## Testing Commands
```bash
# Run all tests
npm test

# Watch mode for testing
npm run test:watch

# Coverage report
npm run test:coverage
```

## Build and Deploy
```bash
# Build for production
npm run build

# Start production server
npm start
```

## Database Commands (Docker-based, but using Supabase currently)
```bash
# Database setup (if using Docker)
npm run db:setup

# Database reset
npm run db:reset

# Seed data
npm run db:seed
```

## Docker Commands (prepared but not actively used)
```bash
# Start development environment
npm run docker:dev

# Start admin tools
npm run docker:tools

# Stop all containers
npm run docker:stop

# View logs
npm run docker:logs
```

## Code Quality Workflow
1. Always run `npm run typecheck` before committing
2. Use `npm run lint:fix` to auto-fix linting issues
3. Use `npm run format` to format code consistently
4. Run `npm test` to ensure all tests pass

## Important Notes
- Using Supabase instead of local PostgreSQL for development
- Health endpoints available at `/api/v1/health/*` 
- Server runs on http://localhost:3000 by default
- API prefix is `/api/v1`
- Node.js 18+ required
- TypeScript strict mode enabled