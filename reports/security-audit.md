# SECURITY AUDIT REPORT

**Project:** Aventra SILO (`aventra-saas`)

**SILO Path:** `/mnt/d/TomorrowNow AI/03. Aventra Real Estate/aventra-saas/`

**Date:** 2026-05-15

**Scope:** `src/` directory (TypeScript/TypeScript React)

---

## SUMMARY

| # | Category | Status | Findings |
|---|----------|--------|----------|
| 1 | Hardcoded Secrets | FAIL | `kickbox.ts` has a hardcoded `***` placeholder instead of using `key` variable |
| 2 | eval/new Function | PASS | No evidence found |
| 3 | innerHTML | PASS | No evidence found |
| 4 | SSRF / Unvalidated Fetch | WARN | 4 external API fetches -- URLs are hardcoded (safe), but `fetch` responses are never validated for content-type or max-size |
| 5 | SQL Injection | PASS | No raw queries found |
| 6 | Unvalidated Input | FAIL | `action` field accepted without validation |
| 7 | Math.random() | PASS | No evidence found |
| 8 | ENV Leaks | PASS | No `NEXT_PUBLIC` secrets or keys found |
| 9 | Silent Catches | FAIL | 1 catch block logs error but reveals nothing to client (acceptable, but worth flagging) |
| 10 | Orchestrator Auth | PASS | Zero-Bypass Bearer token check confirmed |

---

## DETAILED FINDINGS

### 1. HARDCODED SECRETS -- FAIL

**File:** `src/lib/agents/services/kickbox.ts:5`

```typescript
const res = await fetch(`https://open.kickbox.com/v1/verify/${encodeURIComponent(email)}?apikey=***`
```

**Problem:** Line 3 extracts `process.env.KICKBOX_API_KEY` into `key`. Line 5 then uses the literal string `***` instead of `${key}`. The API key is not being interpolated — the fetch sends `***` as the API key. This is both a bug and a potential security misconfiguration.

**Fix:** Replace `apikey=***` with `apikey=${key}`.

Note: `src/components/auth/LoginForm.tsx:10` and `SignupForm.tsx:11` contain `useState('')` — these are UI state variables, not hardcoded secrets. Safe.

### 2. EVAL / EXEC — PASS

No instances of `eval(` or `new Function(` found in any `.ts`/`.tsx` files.

### 3. innerHTML — PASS

No instances of `innerHTML` or `dangerouslySetInnerHTML` found. The app correctly avoids direct DOM manipulation.

### 4. SSRF / UNVALIDATED FETCH — WARN

Four `fetch()` calls found in `src/lib/agents/services/`:

| File | Target | Risk |
|------|--------|------|
| `skiptrace.ts:5` | `api.resimpli.com` (POST) | Low — hardcoded URL, uses Bearer auth from env |
| `twilio-lookup.ts:7` | `lookups.twilio.com` (GET) | Low — hardcoded URL, Basic auth from env |
| `kickbox.ts:5` | `open.kickbox.com` (GET) | Low — hardcoded URL, but key placeholder bug |
| `smarty.ts:7` | `us-street.api.smarty.com` (GET) | Low — hardcoded URL, query params |

None of these take user-supplied URLs, so SSRF risk is minimal. However, none validate the `Content-Type` header of responses or enforce a maximum response size.

### 5. SQL INJECTION — PASS

No `.query(`, `.raw(`, or `execSync(` found. The app uses Supabase (presumably parameterized queries). Safe.

### 6. UNVALIDATED INPUT — FAIL

**File:** `src/app/api/orchestrator/route.ts:24-25`

```typescript
const body = await request.json()
const { action, team_id } = body
```

**Problems:**
- No schema validation (no Zod, no Joi) on the incoming `request.json()`
- `team_id` is checked for existence (line 27-29) but not type-checked or validated
- `action` is never validated — any string is accepted and silently ignored if it doesn't match a known action, returning `{ success: true, results: [] }` which is misleading
- `tenant_id` and `property_id` (used in lines 55-56, 64) are destructured without validation and passed directly to agent constructors

**Fix:** Add Zod schema validation at line 25:
```typescript
const schema = z.object({
  action: z.enum(['PROCESS_ARREARS', 'AUDIT_LEASES', 'RUN_COMPLIANCE', 'PROCESS_SCREENING', 'PROCESS_EVICTION']),
  team_id: z.string().uuid(),
  tenant_id: z.string().uuid().optional(),
  property_id: z.string().uuid().optional(),
})
const parsed = schema.parse(body)
```

### 7. MATH.RANDOM() — PASS

No instances of `Math.random()` found. The app does not use insecure random number generation.

### 8. ENV LEAKS — PASS

No `NEXT_PUBLIC` prefixed environment variables expose secrets or API keys. Supabase anon key is excluded per instructions and is safe (it's public by design).

### 9. SILENT CATCH BLOCKS — FAIL

**File:** `src/app/api/orchestrator/route.ts:74-76`

```typescript
  } catch (error) {
    console.error('[Orchestrator] Fatal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
```

The catch block logs the error and returns a generic 500 response. This is actually **defensive** (doesn't leak stack traces to the client). However, `error` passed to `console.error` may contain sensitive context (SQL errors, file paths, etc.) depending on the runtime. Recommend sanitizing the log output to exclude `error.stack` in production.

No other silent `.then(catch)` patterns were found.

### 10. ORCHESTRATOR AUTH — PASS

**File:** `src/app/api/orchestrator/route.ts:11-18`

```typescript
const authHeader = request.headers.get('Authorization')
const secret = process.env.ORCHESTRATOR_SECRET

// HARDENED: Zero-Bypass Auth
if (!secret || authHeader !== `Bearer ${secret}`) {
  console.error('[Aventra Orchestrator] Unauthorized access attempt.')
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

Confirmed: The route checks `ORCHESTRATOR_SECRET` from environment and requires an exact `Bearer <secret>` match. Both the absence of the secret AND mismatched tokens are rejected. The error message is generic and does not leak which condition failed. PASS.

---

## ACTIONABLE RECOMMENDATIONS

1. **[HIGH]** Fix `kickbox.ts` line 5 — replace `apikey=***` with `apikey=${key}`
2. **[HIGH]** Add Zod (or equivalent) schema validation to orchestrator `route.ts` for `action`, `team_id`, and optional fields
3. **[MEDIUM]** Validate `action` string against a known enum — currently any unknown action returns `success: true` with empty results, which is misleading
4. **[LOW]** Sanitize `console.error` output in production catch blocks to avoid leaking file paths or internal details
5. **[LOW]** Add `maxBodyLength` or response size limits to `fetch()` calls in agent services
