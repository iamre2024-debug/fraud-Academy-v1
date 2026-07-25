# Fraud Academy v1.0.0 Release Notes

Release date: July 25, 2026  
Release commit: `573ea1db64c309719a23df1031be1e4ba6fa4ca6`

## Release status

Fraud Academy v1.0.0 is the verified internal training release. It is ready for owner-led user acceptance and demonstration with fictional data. It is not a production fraud-decision engine, and the repository does not yet define external reuse terms.

## Included

- Evidence-first case briefing, Customer 360, investigation, timeline, decision, and Luna debrief flow
- Separate mobile mission pages with direct back navigation
- Pinned evidence, case-scoped notes, and the floating Quick Pad
- Searchable device, payment, login, IP, document, and relationship evidence
- Honest document-request workflow that records pending requests without inventing a response
- Training-safe Bank Code and Destination ID labels with before/after payment-account information
- Decision submission before all tools are reviewed, with an explicit learner acknowledgement
- Post-submission Luna coaching and manager debrief
- Generated-case persistence and scenario diversity across all ten claim types
- PWA installation support and responsive phone/desktop layouts

## Verification

- `npm run verify`: pass
- Playwright Desktop Chrome: pass
- Playwright Pixel 7 Chromium: pass
- Live user-acceptance review: pass
- Generated scenario catalog: 79 scenario definitions
- Repeated-case diversity check: 80 generated cases across ten claim types
- Runtime console: no application errors observed during the release audit

## Deployment

- Verified release-candidate demo: `https://deploy-preview-80--glittery-custard-26e360.netlify.app/`
- Vercel deployment status: successful for the release commit
- Vercel deployment record: `https://vercel.com/iamre2024-debugs-projects/fraud-academy-v1/DpMwF6VPN2aKQKVT9UPhPdQtizpp`

## Known limitations

- Learner state and generated cases are stored in the current browser and do not synchronize across devices.
- Authentication, instructor administration, a hosted backend, and a managed database are not included.
- Firefox, Safari, and a formal manual accessibility audit remain pending.
- A permanent production alias and matching committed desktop release screenshot remain pending.
- No repository license has been selected.

## Screenshot

The current Android release view is stored at `docs/screenshots/fraud-academy-v1-mobile.png`.
