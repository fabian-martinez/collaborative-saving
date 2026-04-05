---
description: Centralized commands for running tests in various modes
---

# Run Tests

Centralized reference for executing tests in the backend project.

## Unit Tests

// turbo
1. Run all unit tests: `cd backend && npm run test:unit`

## E2E Tests

// turbo
2. Run all E2E tests: `cd backend && npm run test:e2e`

## Specific File

// turbo
3. Run a specific test file: `cd backend && npm run test:e2e -- test/{module}/{file}.e2e-spec.ts`

## Specific Test Name

// turbo
4. Run tests matching a name: `cd backend && npm run test:e2e -- -t "{test name}"`

## Coverage

// turbo
5. Run coverage report: `cd backend && npm run test:cov`

## Watch Mode

// turbo
6. Run tests in watch mode: `cd backend && npm run test:watch`

## Lint

// turbo
7. Run lint: `cd backend && npm run lint`

## Frontend Build

// turbo
8. Build frontend (pre-PR check): `cd frontend-v2 && npm run build`
