# E2E Test Suite Documentation

## Overview
This E2E test suite implements comprehensive testing for the こえポン！(Koepon!) application using Playwright with TypeScript.

## Architecture

### Test Organization
- **Page Object Model (POM)**: All UI interactions are encapsulated in page classes
- **Fixtures**: Shared test data and authentication setup
- **Utils**: Helper functions for performance, visual testing, and common operations
- **Groups**: Test organization for optimal parallel execution

### Directory Structure
```
e2e/
├── fixtures/          # Test data and shared setup
├── pages/             # Page Object Model classes
├── tests/             # Test specifications
├── utils/             # Helper utilities
└── README.md          # This documentation
```

## Test Categories

### 1. Authentication Flow Tests (TC-001 to TC-008)
- User login/logout functionality
- Registration flows  
- Error handling for invalid credentials

### 2. Gacha Flow Tests (TC-009 to TC-023)
- Gacha list display and filtering
- Single and multi-draw functionality
- Medal balance tracking
- Animation timing verification

### 3. Medal Exchange Tests (TC-024 to TC-035)
- Item exchange functionality
- Stock management
- Medal balance updates
- Exchange history tracking

### 4. Rewards Box Tests (TC-036 to TC-045)
- File downloads (images, videos)
- Progress indicators
- Category filtering
- Timeout handling

### 5. VTuber Management Tests (TC-046 to TC-057)
- Dashboard access
- Gacha creation and management
- Analytics viewing
- Content upload functionality

### 6. Admin Management Tests (TC-058 to TC-072)
- User management operations
- VTuber application processing
- System monitoring
- Analytics and reporting

### 7. Performance Tests (TC-073 to TC-080)
- Page load time verification
- API response time monitoring
- Concurrent user simulation
- Memory usage tracking

### 8. Edge Cases Tests (TC-081 to TC-085)
- Network failure handling
- Session timeout scenarios
- Invalid data processing
- Malformed input handling

## Test Execution Strategy

### Parallel Execution Groups
Tests are organized into 4 groups for optimal performance:

- **Group A**: Basic flows (Authentication) - 35 min parallel
- **Group B**: Management features (Admin, VTuber) - 35 min parallel  
- **Group C**: Performance & Edge cases - 20 min sequential
- **Group D**: User flows (Gacha, Exchange, Rewards) - 15 min parallel

**Total execution time**: ~25 minutes (down from 70 minutes sequential)

### Browser Support
- Chrome (Desktop)
- Firefox (Desktop)
- Safari (Desktop)
- Chrome Mobile (Pixel 5)
- Safari Mobile (iPhone 12)

## Running Tests

### All Tests
```bash
npx playwright test
```

### Specific Test Group
```bash
npx playwright test e2e/tests/auth.spec.ts
```

### Debug Mode
```bash
npx playwright test --debug
```

### UI Mode
```bash
npx playwright test --ui
```

## Performance Thresholds

- **Page Load**: < 3 seconds
- **Gacha Draw**: < 3 seconds animation
- **Ten Draw**: < 5 seconds animation  
- **File Download**: < 5 seconds to start
- **API Response**: < 2 seconds
- **Concurrent Operations**: < 10 seconds

## Best Practices

### Page Object Model
- Encapsulate UI interactions in page classes
- Use data-testid attributes for reliable element selection
- Implement wait strategies for dynamic content

### Test Data Management
- Use fixtures for consistent test data
- Generate unique data to avoid test interference
- Clean up test data after execution

### Error Handling
- Implement retry mechanisms for flaky tests
- Capture screenshots and videos on failure
- Log meaningful error messages

### Maintenance
- Keep selectors stable using data-testid
- Update tests when UI changes
- Monitor test execution times and optimize as needed

## CI/CD Integration

The test suite is optimized for CI environments with:
- Reduced worker count for stability
- Comprehensive reporting (HTML, JSON, JUnit)
- Screenshot and video capture on failures
- GitHub Actions integration support

## Troubleshooting

### Common Issues
1. **Timeout Errors**: Increase timeout values in playwright.config.ts
2. **Element Not Found**: Verify data-testid attributes exist
3. **Authentication Failures**: Check test user credentials in fixtures
4. **Performance Test Failures**: Review performance thresholds

### Debug Tools
- Playwright Inspector: `npx playwright test --debug`
- Test Generator: `npx playwright codegen`
- Trace Viewer: Available after test execution with traces enabled