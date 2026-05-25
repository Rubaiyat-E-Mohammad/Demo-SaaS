#!/usr/bin/env node
/**
 * Generate manual/TEST-CASES.xlsx from the in-script test plan rows.
 * Run via: node manual/generate-xlsx.mjs
 *
 * Uses ExcelJS — install with `npm i -D exceljs` inside e2e/ if missing,
 * or run from a node_modules root that has it.
 *
 * The xlsx is the source-of-truth contract per autoqa conventions.
 * TEST_CASES.md is the human-readable pointer; regenerate both when rows change.
 */
import ExcelJS from 'exceljs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HEADERS = [
  'Test ID', 'Feature', 'Test Title', 'Description', 'Pre-conditions',
  'Test Data', 'Steps', 'Expected Result', 'Severity', 'Priority',
  'Status', 'Case Type', 'Execution Date', 'Executed By', 'Spec File', 'Notes',
];

const E2E_SPEC = 'e2e/tests/signin.spec.ts';
const API_SPEC = 'api/tests/signin.spec.ts';
const TODAY = new Date().toISOString().slice(0, 10);

const rows = [
  {
    id: 'SI0011', feature: 'Sign-in',
    title: 'User sees all core sign-in elements on page load',
    description: 'Confirms the sign-in page renders every interactive control before the user attempts auth.',
    pre: 'Anonymous; no session cookies.',
    data: 'None (static page).',
    steps: '1. Navigate to /sign-in.\n2. Assert email/password fields, Log-in button, "Forgot password?", "Sign up", "Continue with Email", "Continue with Google" are all visible.',
    expected: 'All seven core elements visible on the form.',
    severity: 'Critical', priority: 'P0', status: 'Pass', caseType: 'Happy Path',
  },
  {
    id: 'SI0002', feature: 'Sign-in',
    title: 'User sees validation error when submitting an empty form',
    description: 'Client-side validation must block submission when no email is entered.',
    pre: 'On /sign-in.',
    data: 'Empty form.',
    steps: '1. Click "Log in" without filling fields.\n2. Assert "Invalid email" error visible and URL still /sign-in.',
    expected: '"Invalid email" inline error visible; URL unchanged.',
    severity: 'Major', priority: 'P1', status: 'Pass', caseType: 'Negative',
  },
  {
    id: 'SI0003', feature: 'Sign-in',
    title: 'User sees validation error for an invalid email format',
    description: 'Email-format regex must reject malformed input before the auth call.',
    pre: 'On /sign-in.',
    data: 'Credentials.invalidFormatEmail = "notanemail"; Credentials.arbitraryPassword.',
    steps: '1. Fill email with malformed value.\n2. Fill any password.\n3. Submit.\n4. Assert "Invalid email" error visible; URL unchanged.',
    expected: '"Invalid email" inline error visible.',
    severity: 'Major', priority: 'P1', status: 'Pass', caseType: 'Validation',
  },
  {
    id: 'SI0006', feature: 'Sign-in',
    title: 'User cannot log in with email only and no password',
    description: 'Password is required; submission with only email must not authenticate.',
    pre: 'On /sign-in.',
    data: 'Credentials.valid.email; password empty.',
    steps: '1. Fill email only.\n2. Submit.\n3. Assert URL still /sign-in; email field still visible.',
    expected: 'URL unchanged; form remains.',
    severity: 'Major', priority: 'P1', status: 'Pass', caseType: 'Negative',
  },
  {
    id: 'SI0007', feature: 'Sign-in',
    title: 'User can toggle password field visibility',
    description: 'Visibility toggle flips the password input between masked and plain text.',
    pre: 'On /sign-in.',
    data: 'Credentials.arbitraryPassword.',
    steps: '1. Fill password.\n2. Assert input type=password.\n3. Click toggle. Assert type=text.\n4. Click toggle again. Assert type=password.',
    expected: 'type attribute flips on each toggle click.',
    severity: 'Minor', priority: 'P2', status: 'Pass', caseType: 'Happy Path',
  },
  {
    id: 'SI0008', feature: 'Sign-in',
    title: 'User navigates to the reset-password page via "Forgot password?"',
    description: '"Forgot password?" link routes to /reset-password.',
    pre: 'On /sign-in.', data: 'None.',
    steps: '1. Click "Forgot password?".\n2. Wait for URL to contain /reset-password.',
    expected: 'URL ends with /reset-password.',
    severity: 'Minor', priority: 'P2', status: 'Pass', caseType: 'Happy Path',
  },
  {
    id: 'SI0009', feature: 'Sign-in',
    title: 'User navigates to the sign-up page via the "Sign up" link',
    description: '"Sign up" link routes to /sign-up.',
    pre: 'On /sign-in.', data: 'None.',
    steps: '1. Click "Sign up" inside footer paragraph.\n2. Wait for URL to contain /sign-up.',
    expected: 'URL ends with /sign-up.',
    severity: 'Minor', priority: 'P2', status: 'Pass', caseType: 'Happy Path',
  },
  {
    id: 'SI0010', feature: 'Sign-in',
    title: 'User navigates to the email-OTP page via "Continue with Email"',
    description: 'Alt-auth link routes to /email-otp.',
    pre: 'On /sign-in.', data: 'None.',
    steps: '1. Click "Continue with Email".\n2. Wait for URL to contain /email-otp.',
    expected: 'URL ends with /email-otp.',
    severity: 'Minor', priority: 'P2', status: 'Pass', caseType: 'Happy Path',
  },
  {
    id: 'SI0001', feature: 'Sign-in',
    title: 'User logs in successfully with valid credentials',
    description: 'Happy-path auth: valid email+password lands on /onboarding with welcome banner.',
    pre: 'Anonymous; cookies cleared.',
    data: 'Credentials.valid.email + Credentials.valid.password (env-driven).',
    steps: '1. Submit valid credentials.\n2. Wait for /onboarding.\n3. Assert "Welcome to Demo SaaS" visible.',
    expected: 'URL ends /onboarding; welcome text visible.',
    severity: 'Blocker', priority: 'P0', status: 'Pass', caseType: 'Happy Path',
  },
  {
    id: 'SI0004', feature: 'Sign-in',
    title: 'User sees auth error when password is wrong',
    description: 'Backend rejects valid email + wrong password.',
    pre: 'Anonymous; cookies cleared.',
    data: 'Credentials.valid.email + Credentials.wrongPassword.',
    steps: '1. Submit valid email + wrong password.\n2. Assert rejection error visible (credential error OR rate-limit notice).\n3. Assert URL still /sign-in.',
    expected: 'Rejection message visible; user not authenticated.',
    severity: 'Critical', priority: 'P0', status: 'Pass', caseType: 'Negative',
  },
  {
    id: 'SI0005', feature: 'Sign-in',
    title: 'User sees auth error when email is not registered',
    description: 'Backend rejects unregistered email gracefully.',
    pre: 'Anonymous; cookies cleared.',
    data: 'Credentials.unregisteredEmail + Credentials.arbitraryPassword.',
    steps: '1. Submit unregistered email + any password.\n2. Assert rejection error visible.\n3. Assert URL still /sign-in.',
    expected: 'Rejection message visible; user not authenticated.',
    severity: 'Major', priority: 'P1', status: 'Pass', caseType: 'Negative',
  },
  // ---------- API tests (api/tests/signin.spec.ts) ----------
  {
    id: 'AS0001', feature: 'Sign-in API', spec: API_SPEC,
    title: 'Valid credentials return 200 with user object',
    description: 'Happy path: POST /api/auth/sign-in/email with real credentials returns 200 + user object.',
    pre: 'Network reachable; SIGNIN_EMAIL/SIGNIN_PASSWORD env vars set.',
    data: 'Credentials.valid.email + Credentials.valid.password.',
    steps: '1. POST endpoint with valid body.\n2. Assert HTTP 200.\n3. Assert body.user.email matches Credentials.valid.email and body.user.emailVerified is true.',
    expected: 'HTTP 200; body.user.email = expected; emailVerified = true.',
    severity: 'Blocker', priority: 'P0', status: 'Pass', caseType: 'Happy Path',
  },
  {
    id: 'AS0002', feature: 'Sign-in API', spec: API_SPEC,
    title: 'Wrong password returns 401 INVALID_EMAIL_OR_PASSWORD',
    description: 'Auth API rejects valid email + wrong password.',
    pre: 'Network reachable.',
    data: 'Credentials.valid.email + Credentials.wrongPassword.',
    steps: '1. POST endpoint.\n2. Assert HTTP 401.\n3. Assert body.code = "INVALID_EMAIL_OR_PASSWORD".',
    expected: '401 with documented error code.',
    severity: 'Critical', priority: 'P0', status: 'Pass', caseType: 'Negative',
  },
  {
    id: 'AS0003', feature: 'Sign-in API', spec: API_SPEC,
    title: 'Unregistered email returns 401 INVALID_EMAIL_OR_PASSWORD',
    description: 'Auth API rejects unregistered email with same error code as wrong password (no enumeration).',
    pre: 'Network reachable.',
    data: 'Credentials.unregisteredEmail + Credentials.arbitraryPassword.',
    steps: '1. POST endpoint.\n2. Assert HTTP 401.\n3. Assert body.code = "INVALID_EMAIL_OR_PASSWORD".',
    expected: '401 with same error code as wrong-password (no enumeration leak).',
    severity: 'Major', priority: 'P1', status: 'Pass', caseType: 'Negative',
  },
  {
    id: 'AS0004', feature: 'Sign-in API', spec: API_SPEC,
    title: 'Malformed email returns 400 INVALID_EMAIL',
    description: 'Server-side regex rejects malformed email before auth lookup.',
    pre: 'Network reachable.',
    data: 'Credentials.invalidFormatEmail + Credentials.arbitraryPassword.',
    steps: '1. POST endpoint.\n2. Assert HTTP 400.\n3. Assert body.code = "INVALID_EMAIL".',
    expected: '400 with code = "INVALID_EMAIL".',
    severity: 'Major', priority: 'P1', status: 'Pass', caseType: 'Validation',
  },
  {
    id: 'AS0005', feature: 'Sign-in API', spec: API_SPEC,
    title: 'Missing email field returns 400 with zod details',
    description: 'Schema validation flags missing `email` field with zod-style details array.',
    pre: 'Network reachable.',
    data: '{ password: Credentials.arbitraryPassword }.',
    steps: '1. POST endpoint with body missing `email`.\n2. Assert HTTP 400.\n3. Assert body.details contains an entry with path ["email"].',
    expected: '400 with details array including email path.',
    severity: 'Major', priority: 'P1', status: 'Pass', caseType: 'Validation',
  },
  {
    id: 'AS0006', feature: 'Sign-in API', spec: API_SPEC,
    title: 'Missing password field returns 400 with zod details',
    description: 'Schema validation flags missing `password` field with zod-style details array.',
    pre: 'Network reachable.',
    data: '{ email: Credentials.valid.email }.',
    steps: '1. POST endpoint with body missing `password`.\n2. Assert HTTP 400.\n3. Assert body.details contains an entry with path ["password"].',
    expected: '400 with details array including password path.',
    severity: 'Major', priority: 'P1', status: 'Pass', caseType: 'Validation',
  },
  {
    id: 'AS0007', feature: 'Sign-in API', spec: API_SPEC,
    title: 'Empty JSON body returns 400 with zod details',
    description: 'Both required keys missing surface in zod-style details array.',
    pre: 'Network reachable.',
    data: '{}.',
    steps: '1. POST endpoint with empty JSON body.\n2. Assert HTTP 400.\n3. Assert body.details paths include "email" and "password".',
    expected: '400 with details paths covering both required fields.',
    severity: 'Major', priority: 'P1', status: 'Pass', caseType: 'Validation',
  },
];

const workbook = new ExcelJS.Workbook();
workbook.creator = 'AutoQA';
workbook.created = new Date();

const e2eRows = rows.filter((r) => !r.spec || r.spec === E2E_SPEC);
const apiRows = rows.filter((r) => r.spec === API_SPEC);

function buildSheet(name, sheetRows, defaultSpec) {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = HEADERS.map((h) => ({ header: h, width: Math.max(h.length + 2, 16) }));
  sheet.getRow(1).font = { bold: true };
  sheet.getColumn(7).width = 60; // Steps
  sheet.getColumn(8).width = 50; // Expected Result
  sheet.getColumn(6).width = 40; // Test Data
  sheet.getColumn(4).width = 50; // Description
  for (const r of sheetRows) {
    sheet.addRow([
      r.id, r.feature, r.title, r.description, r.pre, r.data, r.steps,
      r.expected, r.severity, r.priority, r.status, r.caseType,
      TODAY, 'AutoQA', r.spec ?? defaultSpec, r.notes ?? '',
    ]);
  }
  sheet.eachRow((row) => row.alignment = { vertical: 'top', wrapText: true });
  return sheet;
}

buildSheet('e2e', e2eRows, E2E_SPEC);
buildSheet('api', apiRows, API_SPEC);

const outPath = path.join(__dirname, 'TEST-CASES.xlsx');
await workbook.xlsx.writeFile(outPath);
console.log(`Wrote ${outPath} (${e2eRows.length} E2E + ${apiRows.length} API = ${rows.length} rows).`);
