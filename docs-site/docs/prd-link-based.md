---
id: prd-link-based
title: PRD — Links
sidebar_label: PRD
---

# Product Requirements Document (link-based)

This PRD is link-based: each major section points to canonical docs and issues rather than containing all content inline.

## Executive Summary
- Problem: Need a low-cost, real-time interactive wine-quiz platform for small events.
- Solution: Sommelier Arena — static frontend on Cloudflare Pages, backend on PartyKit Durable Objects, Docs on Pages.
- Success: working demo, E2E tests passing, clear docs for deploy and contributors.

## User Stories (links)
- [Quick Start](./quick-start) — onboarding for demos
- [Gameplay Workflow](./gameplay-workflow) — user flow and phases
- [Features](./features) — feature list

## Technical Specs (links)
- Architecture: [Architecture](./architecture)
- Tech Stack: [Tech Stack](./tech-stack)
- Deployment: [Deployment & Deploy](./deployment-and-deploy)

## Risks
- PartyKit CI deploy requires credentials — consider alternate deploy strategies.

## Acceptance Criteria
- Docs updated and canonicalized
- CI for docs + deploy scripts added
- E2E integration in Docker passes

(Use linked docs for details and update this PRD with issue links when available.)