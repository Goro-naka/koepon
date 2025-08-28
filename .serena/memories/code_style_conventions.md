# Code Style and Conventions

## TypeScript Configuration
- **Strict mode**: Enabled with all strict checks
- **Target**: ES2022
- **Module**: CommonJS
- **Path mapping**: Configured for `@/*`, `@/common/*`, `@/config/*`, `@/modules/*`, `@/shared/*`
- **Decorators**: Experimental decorators enabled for NestJS

## ESLint Rules
- **Import sorting**: Alphabetical with member sorting
- **TypeScript rules**:
  - No explicit `any` (warn)
  - Unused variables error (prefix with `_` to ignore)
  - Prefer nullish coalescing (`??` over `||`)
  - Prefer optional chaining (`?.`)
  - No floating promises
- **Security rules**: No eval, no new Function, no script URLs

## Prettier Configuration
- **Semi**: true
- **Single quotes**: true
- **Print width**: 100
- **Tab width**: 2 spaces
- **Trailing commas**: all
- **Arrow parens**: avoid
- **End of line**: lf

## Naming Conventions
- **Files**: kebab-case (e.g., `user.service.ts`, `gacha.controller.ts`)
- **Classes**: PascalCase (e.g., `UserService`, `GachaController`)
- **Methods/Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase, no `I` prefix

## NestJS Patterns
- **Modules**: Feature-based organization in `src/modules/`
- **Services**: Business logic, injected dependencies
- **Controllers**: HTTP endpoints, validation pipes
- **DTOs**: Input validation with class-validator
- **Global prefix**: `/api/v1`

## File Organization
```
src/
├── modules/          # Feature modules (auth, user, gacha, etc.)
├── common/           # Shared utilities, guards, interceptors
├── config/           # Configuration services
├── shared/           # Types, constants, interfaces
├── app.module.ts     # Root module
└── main.ts          # Application bootstrap
```

## Error Handling
- Use NestJS exception filters
- Consistent error response format
- Proper HTTP status codes
- No sensitive data in error messages (production)

## Security Practices
- No hardcoded secrets
- Input validation on all endpoints  
- Helmet for security headers
- CORS properly configured
- JWT with refresh token rotation
- Rate limiting (planned)