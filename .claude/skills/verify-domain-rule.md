---
name: verify-domain-rule
description: Run only the relevant domain unit tests in server/src/domain to verify a clinical rule (state machine, compatibility, FEFO, deferral) before touching downstream code. Use when changing or relying on a domain invariant.
---

# /verify-domain-rule

Run the fast pure-logic tests in `server/src/domain/` for the rule you are about to touch or rely on.

## Common targets

```bash
cd server

# State machine
npx vitest run src/domain/unit/state-machine.test.ts

# Compatibility engine
npx vitest run src/domain/compatibility/abo-rh.test.ts

# FEFO selector
npx vitest run src/domain/compatibility/fefo.test.ts

# Everything in domain
npx vitest run src/domain
```

These tests never touch Mongo, Redis, or the network — they're milliseconds and safe to re-run.

## When to invoke

- Before changing a domain rule (so the failure surface is obvious).
- After changing a domain rule (so regressions are caught before they hit a service).
- When a service in `domain/<feature>` is about to assume a rule (so you trust the invariant).

## If a test fails

- Do **not** loosen the test to make it pass.
- If the test encodes an outdated rule, fix the test and the implementation **together** in one commit.
- If you genuinely need to change the rule, update the domain reference in `memory/domain-quick-ref.md` first so the next session knows.
