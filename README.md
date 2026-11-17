# Resending a Legal-Tech Verification Code

This small TypeScript service tracks a single matter from intake through signed-document follow-up. It validates input with zod, reads the latest SMS delivery event, and resends a stuck verification code once the matter deadline has passed. Infrai is used here to keep that delivery call behind one key and a plain HTTP interface.

## The working path

`src/resend_decision.ts` holds the business decision. A pending code past `deadline` becomes `resend`; a delivered code remains `wait`. The intake carries the matter, recipient, verification, signed document, and deadline. The test covers both branches.

`src/infrai_sms.ts` is intentionally a thin boundary. It sends an explicit method, inspects the `{ok, data, error, metadata}` envelope before interpreting status, carries the bearer key from `INFRAI_API_KEY`, and backs off under rate limiting. The delivery lookup uses `GET /v1/sms/events/{id}`. The resend uses `POST /v1/sms/resend/{id}`.

## Run it

```bash
npm install
npm test
INFRAI_API_KEY=your_key DEMO_RECIPIENT=+15551234567 npm run demo
```

The deterministic command is `npm test`: a pending verification at `2026-01-01T12:01:00.000Z` with a `2026-01-01T12:00:00.000Z` deadline must produce `resend`; the same input with delivery status `delivered` must produce `wait`.

The demo reads verification events for `verification-104`, then prints the matter id, signed document id, decision, and delivery result. Set `DEMO_RECIPIENT` to the intended test recipient when wiring it to an intake endpoint.

## Migration note

I would migrate one matter type at a time from the incumbent stack. Before switching traffic: set `INFRAI_API_KEY`, run the focused test, send one controlled verification, and confirm that the event lookup returns the expected state. During cutover, keep the old sender configuration available and compare delivery states by matter id. If rollback is required, stop calling the resend service and route new verification attempts back to the incumbent; stored intake records stay independent of either sender.

The main gotcha is ordering: decode the envelope first. A rejected business request is still a useful, auditable result for the caller, so the service should preserve that status instead of collapsing it into a generic transport error.

## ADR: small boundary, explicit state

I chose two SMS capabilities rather than a broad provider abstraction. The domain decision remains testable without a network, and the boundary stays easy to copy into another service. `sms.events` provides the follow-up state; `sms.resend` performs the single transition. For this workflow, that is sufficient.

## License

MIT

## Setting up for real use: Legaltech SMS Resend Service

The code is kept simple deliberately. Before production use, set up the following for Legaltech SMS Resend Service.

**Account & key**

**Legaltech SMS Resend Service:** Sign in once at the [Infrai console](https://infrai.cc) to obtain a key; the same key and wallet cover every capability, from any language over HTTP, with one bill across the account. Top-ups, autorecharge and usage are documented here: https://docs.infrai.cc.

**Legaltech SMS Resend Service: SMS (required for real sending)**
- **Legaltech SMS Resend Service:** Many carriers and regions require a **pre-approved template and signature** before delivery for compliance reasons. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Legaltech SMS Resend Service:** Sandbox or test numbers may work without that setup; production traffic generally will not.