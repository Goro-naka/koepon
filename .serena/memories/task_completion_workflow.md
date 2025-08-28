# Task Completion Workflow

## When Completing Any Task

### 1. Code Quality Checks
Always run these commands before marking a task complete:
```bash
npm run typecheck    # TypeScript type checking
npm run lint        # ESLint checking  
npm run format      # Prettier formatting
```
Fix any issues found before proceeding.

### 2. Testing Requirements
```bash
npm test            # Run all tests
npm run test:coverage  # Check coverage if needed
```
Ensure all tests pass and maintain good coverage.

### 3. Health Check Verification
For backend changes, verify health endpoints:
- `http://localhost:3000/api/v1/health` - Server status
- `http://localhost:3000/api/v1/health/ready` - Dependency status  
- `http://localhost:3000/api/v1/health/database` - Database status
- `http://localhost:3000/api/v1/health/stats` - Table statistics

### 4. Documentation Updates
- Update relevant documentation if interfaces change
- Update API documentation if endpoints change
- Update README if new setup steps are required

### 5. Task File Updates
Update the task status in `docs/tasks/koepon-tasks.md`:
- Mark completed tasks with `[x]`
- Update completion status and any notes

### 6. Git Workflow
```bash
git add .
git commit -m "feat: implement [TASK-XXX] - brief description"
git push
```
Follow conventional commit format.

## Task Types and Special Requirements

### TDD Tasks (Test-Driven Development)
1. Write failing tests first
2. Implement minimal code to pass tests
3. Refactor while keeping tests green
4. Ensure both unit and integration tests

### DIRECT Tasks (Direct Implementation)
1. Implement according to specifications
2. Add tests after implementation
3. Focus on functional completeness

## Current Development Context
- Using Supabase for database (not local PostgreSQL)
- NestJS application with TypeScript strict mode
- Health endpoints for monitoring
- JWT authentication system
- File storage with signed URLs
- WebSocket support planned for real-time features

## Pre-commit Checklist
- [ ] No linting errors
- [ ] No TypeScript errors  
- [ ] All tests passing
- [ ] Health endpoints working (if backend changes)
- [ ] No hardcoded secrets or sensitive data
- [ ] Proper error handling implemented
- [ ] Input validation in place
- [ ] Security headers configured