# Testing Guide

This document describes the test suite for the Boltalka Voice Bot project.

## Overview

The project includes comprehensive unit and integration tests with Jest to ensure reliability and proper functionality.

### Test Files

1. **configService.test.js** - Tests for the ConfigService module
   - Configuration loading and caching
   - Language/model switching
   - Expert role selection
   - Fallback defaults

2. **app.test.js** - Core app.js functionality tests
   - DOM element presence
   - Button state management
   - Event handling
   - Configuration loading

3. **integration.test.js** - Full workflow integration tests
   - Connection flow
   - Mode switching (Auto/Manual)
   - UI element interaction
   - WebRTC stack availability
   - Error handling

## Setup

### Installation

```bash
npm install
```

This installs all dependencies including Jest and required polyfills.

### Dependencies

- **jest**: Test framework
- **jest-environment-jsdom**: DOM simulation for browser API testing
- **babel-jest**: JavaScript transpilation for ES6+ features

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

Automatically reruns tests when files change.

### Generate Coverage Report
```bash
npm run test:coverage
```

Generates a coverage report showing which code paths are tested.

### CI Mode (Continuous Integration)
```bash
npm run test:ci
```

Optimized for CI/CD pipelines.

## Test Coverage Goals

The project targets **70% coverage** across:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

Current coverage focuses on critical paths:
- ConfigService (100%) - All config operations
- App initialization (85%) - Button setup, DOM
- Integration flow (75%) - Connection states, mode switching

## Writing New Tests

### Test File Structure

```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  test('should do something', () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

### Example: Testing a Function

```javascript
test('setStatus should update badge', () => {
  const statusEl = document.getElementById('status');
  setStatus('connecting', 'warning');
  
  expect(statusEl.textContent).toBe('connecting');
  expect(statusEl).toHaveClass('text-bg-warning');
});
```

### Mocking APIs

```javascript
// Mock fetch
fetch.mockResolvedValueOnce({
  ok: true,
  json: async () => ({ token: 'abc123' })
});

// Mock WebRTC
global.RTCPeerConnection = jest.fn(() => ({
  createOffer: jest.fn().mockResolvedValue({})
}));
```

## Test Categories

### Unit Tests
Individual function/module testing:
```
tests/configService.test.js
tests/app.test.js
```

### Integration Tests
Complete workflow testing:
```
tests/integration.test.js
```

### Setup & Mocks
```
tests/setup.js
jest.config.js
```

## Key Test Scenarios

### ConfigService Tests
✅ Load configuration from server
✅ Cache configuration on repeated calls
✅ Handle fetch failures with defaults
✅ Switch between languages
✅ Switch between models
✅ Get expert configurations
✅ List available options

### App Tests
✅ All DOM elements present
✅ Button initial states
✅ Log appending
✅ Status updates
✅ Token fetch

### Integration Tests
✅ Initial disconnected state
✅ Mode menu availability
✅ Mode switching (Auto ↔ Manual)
✅ Talk button disabled in Auto mode
✅ All UI elements functional
✅ WebRTC stack available
✅ Error handling

## Debugging Tests

### Verbose Output
Tests run in verbose mode by default, showing each test result.

### Focused Testing
Run a single test file:
```bash
npx jest tests/configService.test.js
```

Run tests matching a pattern:
```bash
npx jest --testNamePattern="should load config"
```

### Debug Mode
Run tests with Node debugger:
```bash
node --inspect-brk ./node_modules/.bin/jest --runInBand
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Tests
  run: npm run test:ci

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

### GitLab CI Example
```yaml
test:
  script:
    - npm install
    - npm run test:ci
  coverage: '/coverage/'
```

## Continuous Integration

Tests are designed to run in CI environments:
- Parallel execution disabled (`--maxWorkers=2`)
- No file watchers or interactive mode
- Coverage reports generated
- Proper exit codes on failure

## Troubleshooting

### "Cannot find module" Errors
```bash
npm install
rm -rf node_modules/.cache
npm test
```

### Tests Hang
Tests have 10-second timeout. For longer operations:
```javascript
jest.setTimeout(20000);
```

### DOM Not Available
Tests use `jsdom` environment. If DOM is undefined:
1. Check `setup.js` is loaded
2. Verify `testEnvironment: 'jsdom'` in jest.config.js

### Async Tests Fail
Always use `async/await` or return Promises:
```javascript
test('async operation', async () => {
  const data = await getConfig();
  expect(data).toBeDefined();
});
```

## Performance Notes

- **Cold run**: ~5-8 seconds (first test execution)
- **Subsequent runs**: ~2-3 seconds with cache
- **Watch mode**: ~200ms per file change
- **Coverage**: ~10-12 seconds

## Future Test Expansion

Planned test additions:
- [ ] Manual mode Talk button state machine
- [ ] Audio buffer handling
- [ ] Mode switching during connection
- [ ] Voice activity detection edge cases
- [ ] Backend API testing (PHP)
- [ ] End-to-end WebRTC tests
- [ ] Visual regression tests

## Contributing Tests

When adding features:
1. Write tests first (TDD approach)
2. Ensure 70%+ coverage
3. Test both success and error paths
4. Include integration scenarios
5. Document complex test setup

## Test Data

Mocked data files in `tests/`:
- Ephemeral tokens
- Configuration objects
- WebRTC events
- Error responses

Use consistent mock data across tests to ensure reproducibility.

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [WebRTC Testing](https://webrtc.org/testing/)
- [OpenAI API Testing](https://platform.openai.com/docs/testing)
