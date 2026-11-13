---
ai_generated: true
model: "unknown/unknown@unknown"
operator: "@llealii"
chat_id: "cd398216-b484-4e52-8694-fe0596821bb2"
prompt: |
  create an implementation spec for slice 1
started: "2026-11-13T13:06:56.169-06:00"
ended: "2026-11-13T13:10:18.741-06:00"
task_durations:
  - task: "Drafting and validating the Slice 1 specification"
    duration: "00:03:22"
total_duration: "00:03:22"
ai_log: "ai-logs/2026/11/13/cd398216-b484-4e52-8694-fe0596821bb2/conversation.md"
source: "user"
---

# SL-001: Capture and reopen a task

- Status: Approved (requester override; see decision note below)
- Owner/reviewer: Technical lead for implementation design; Product Owner for product behavior
- Sources: [Approved requirements](../../docs/task-manager-requirements.md), [implementation plan](../../docs/task-manager-implementation-plan.md), [architecture options](../../docs/task-manager-architecture-options.md)

## Goal

The intended single user can create a task with a required title and optional date-only due date, see it in the task list with `Open` status, and find the saved values after closing and reopening the product in the same private environment.

## Scope and exclusions

- In scope: minimum responsive application setup; task entry and validation; creation and same-environment persistence; the single task list and its empty state; visible save errors; keyboard and screen-reader access for this flow.
- Out of scope: task editing, status changes, search and filtering, deletion, CSV export, whole-store erasure, accounts, sign-in, sharing, remote task services, backups, recovery, and cross-device synchronization.
- No list ordering, title normalization beyond rejecting whitespace-only input, date display format, or internal task identifier is prescribed unless needed to implement the approved behavior.

## Context and dependencies

- Existing implementation and conventions: The repository contains requirements, an architecture recommendation, and a delivery plan, but no application source, test suite, or established test commands were identified.
- Prerequisites: No earlier slice. The requester explicitly overrode the architecture/environment approval gate for this specification. For SL-001, this specification treats the proposed browser-only client with IndexedDB in the intended user's private environment as approved. This does not approve shared or hosted exposure or change the approved requirements.
- Environment setup: Before executable verification, record the supported browser/device combination and the stable app origin/package used for both saving and reopening. The approval override did not specify those concrete values; do not claim reopen persistence based on a different origin or profile.
- Assumptions: The intended user controls a private device/browser profile. Browser storage does not itself enforce the single-user boundary and may be lost if the profile or device is cleared or lost. The MVP has no backup or recovery.
- Open questions/blockers: No product behavior blocker remains for this slice. The implementation team must resolve and document the concrete browser/device and packaging/origin choices before running the real-environment persistence check.

## Behavior and contracts

- Inputs: A title and either no due date or a valid calendar date without a time component.
- Successful result: Create exactly one task with the submitted non-whitespace title, the optional selected date, and status `Open`. Show it in the single list with title, status, and due date when present. Do not normalize a valid title; the displayed title matches the submitted title.
- Initial list: Show all saved tasks. When there are no tasks, show an empty state. No sort order is required.
- Validation: Reject an empty or whitespace-only title, show a clear title-required message, and do not create a task. Reject an invalid calendar date rather than storing a timestamp or silently changing the selected date.
- Persistence and errors: Persist the task in the approved local store. Treat a save as successful only after the storage operation completes; on failure, clearly report failure and do not present the task as successfully saved. Preserve the form state after failure only if supported by the selected implementation; it is not an acceptance requirement.
- Accessibility and boundary: The capture and list flow is keyboard-operable with visible focus and meaningful screen-reader names and status. Add no account, sign-in, sharing, or remote task-data behavior. This slice does not claim whole-product WCAG 2.2 AA conformance.
- Compatibility: Keep the user-visible and data behavior consistent with FR-01, FR-02's basic list, and FR-06. Do not implement later-slice behavior as part of this slice.
- Migration, observability, and rollback: No migration is required for a new application with no existing data. Do not log task contents or send them to remote telemetry. Report storage errors to the user. If the chosen store requires an initial schema/version decision, document it as part of implementation; rollback/recovery must not introduce backups or recovery behavior excluded from the MVP.

## Acceptance criteria

- AC-001: Given a valid non-whitespace title and no due date, when the user saves, then exactly one task appears with the submitted title, no due date, and `Open` status.
- AC-002: Given a valid non-whitespace title and a valid calendar due date, when the user saves, then exactly one task appears with that title, the same calendar date without a time component, and `Open` status.
- AC-003: Given an empty or whitespace-only title, when the user saves, then no task is created and a clear title-required message is shown.
- AC-004: Given saved tasks, when the user opens the list, then each task's title and `Open` status are shown, its due date is shown when present, and an empty state is shown when the store is empty.
- AC-005: Given a successfully saved task, when the user closes and reopens the product in the same supported browser/device, origin, and user profile, then the saved title, status, and optional due date remain available.
- AC-006: Given a storage failure during save, when the user saves a valid task, then a clear failure indication is shown and the product does not report or display the task as successfully saved.
- AC-007: Given the capture and list flow, when operated using only a keyboard and a screen reader, then controls can be used, focus is visible, and the task fields and operation feedback have meaningful accessible names or announcements.
- AC-008: Given the MVP boundary, when the Slice 1 application is reviewed, then it has no account creation, sign-in, sharing controls, or remote task-data service.
- AC-009: Given a due-date value that is not a valid calendar date, when the user saves, then no task is created and a clear due-date validation message is shown.

## Verification

No application test paths, test runner, or repository-supported commands exist yet. The checks below are planned; the implementing team must select and record exact test paths and commands after the approved stack is bootstrapped. Do not treat unit tests or mocks as evidence for AC-005's real reopen behavior.

| Criterion | Planned test/check | Command and working directory | Expected result |
|-----------|--------------------|-------------------------------|-----------------|
| AC-001 | Behavior test for a title without a due date; assert one created record and its displayed values. | Not established; determine from the project root after test tooling is selected. | One task with the submitted title, no due date, and `Open` status. |
| AC-002 | Behavior test with a valid date-only value; assert the calendar date is unchanged and no time is stored or displayed. | Not established; determine from the project root after test tooling is selected. | One task with the selected date and `Open` status. |
| AC-003 | Behavior test with empty and whitespace-only titles. | Not established; determine from the project root after test tooling is selected. | No task is created; title-required feedback is visible. |
| AC-004 | List behavior check with zero, one dated, and one undated task. | Not established; determine from the project root after test tooling is selected. | Empty state for zero tasks; required fields for each saved task. |
| AC-005 | End-to-end or manual check in the selected real browser/device and stable origin: save, close the product, reopen it in the same profile, and compare fields. | Manual until an application test command and supported environment are established. | All saved fields remain after reopen. |
| AC-006 | Exercise a controlled storage-write failure through the implementation's supported test seam or environment; confirm the visible result and that no success is reported. | Not established; choose after the storage implementation is selected. | Clear failure feedback; no success state or task presented as saved. |
| AC-007 | Keyboard-only walkthrough and screen-reader check of title/date entry, save, list, validation, and error feedback. | Manual; supported assistive technology and browser are TBD. | Flow is operable, focus visible, and names/feedback are announced meaningfully. |
| AC-008 | Review the Slice 1 UI and network/task-data boundary. | Manual; inspect the implemented UI and network behavior. | No account, sign-in, sharing, or remote task-data behavior is present. |
| AC-009 | Behavior test with an impossible calendar date, such as 2026-02-30. | Not established; determine from the project root after test tooling is selected. | No task is created; due-date validation feedback is visible. |

## Showcase and completion

1. In the selected private test profile, create one task with a title and date-only due date, then create one without a due date.
2. Confirm both appear with `Open` status and the expected fields. Close and reopen the product in the same profile and origin; confirm the values persist.
3. Try a whitespace-only title and an impossible calendar date and confirm rejection. Exercise a controlled save failure and confirm visible failure without a success state.
4. Walk through capture and list using keyboard and screen reader; verify there are no account, sharing, or remote task-data features.

- Completion evidence: Implementation diff; results mapped to AC-001 through AC-009; documented browser/device, profile, and origin for AC-005; failure-path evidence for AC-006; accessibility observations for AC-007.
- Execution evidence: Not run; this artifact specifies work only.
- Risks: Browser profile/device loss can make tasks unavailable. Browser storage is not access control. This slice does not establish full WCAG 2.2 AA conformance.
- Next dependency/handoff: Once SL-001 evidence is reviewed, proceed with dependent task-management slices in the [implementation plan](../../docs/task-manager-implementation-plan.md). The plan does not authorize parallel implementation.

## Approval note

The requester selected the override to treat the proposed Option A browser-only/IndexedDB design and private single-user environment as approved for this slice. Concrete browser/device support and packaging/origin details were not supplied, so they remain implementation setup items rather than invented decisions. Specification approval does not itself authorize code changes, commits, or deployment; use the [implement-vertical-slice skill](../../.github/skills/implement-vertical-slice/SKILL.md) with this specification and obtain the implementation approval it requires.
