# V3 verification

The included /docs is a fresh production build. No paid APIs or remote document services were used.

## Passed automated checks

- All 15 Node tests: old-database/signature migration; page ranges; fillable-field preservation with page changes; shared widgets and deletion; merge flattening; locking; spreadsheet calculations, ranges, cross-sheet references, cycle/unsupported errors, copy-down references; Excel round trip; CSV parsing; Word OOXML generation; Writer/Sheet PDF output; and complete backup/restore without overwriting newer data.
- 21 distinct production WebKit scenarios passed across the PDF regression checks and the focused office checks. Shared startup checks were repeated. The browser fixture used a repository-style /office-test/ subpath, a 390 × 844 touch viewport, and an 844 × 390 landscape check.
- Existing PDF checks: migration, startup budget and core cache, offline viewer, input/control sizes, fill/save/reopen, both signature slots, check/X/date/text/white-out stamps, prepare-then-share gesture, same-document editable forms, locking, acknowledged flattening on merge, local OCR recognition/cache and Template Studio generation/cache.
- New office checks: spreadsheet arithmetic and totals, undo/redo, phone row editing, saving and Excel export with numeric values/results; Writer editing, Word export and re-import, original download availability and PDF handoff; job and checklist persistence/linking; complete backup containing PDF/office/settings/signatures; and reopening used Sheets and Writer workspaces with the origin unavailable.
- Visible office inputs were checked for 16px fonts and at least 44px heights. The phone sheet workspace had no horizontal page overflow; its grid scrolls internally.
- Final focused office run had no functional browser errors and no external HTTP requests. The PDF run recorded a nonfatal ResizeObserver layout notification, with no observed broken behavior.
- Desktop browser review also exercised the branded workspace, job-cost calculation changes, Word preparation, PDF signing handoff/two-slot dialog, notes/checklists, job records and complete backup preparation.
- TypeScript and the production build passed. The build deletes output first, prepares all local OCR files and retains dependency notices.

## Corrections included

Add PDF is disabled until the current pages are initialized, preventing a fast merge from omitting its source pages. Numeric spreadsheet values export as numbers. Switching already-loaded office editors cannot render another editor's file data. Office saves flush on navigation and warn about pending/in-flight writes when closing the browser.

## Practical limits

WebKit automation is not a physical iPhone test. The native Apple share sheet/Files destination, actual keyboard/viewport movement, real finger hardware, physical notch/home-bar placement, and device memory limits remain unverified. The share API was stubbed only to verify file readiness and a fresh active tap. Offline checks made the origin server unreachable; they were not a real airplane-mode test.

The prior GFY field-position fix is retained. This release's PDF regression used a synthetic standard form, not a fresh physical-device run of the GFY document. The optional checkin test requires the user's local PDF and that private file is not bundled.

Read README.md for the explicit Word/Excel/formula/PDF compatibility limits. This release does not add presentations, cloud sync, remote signing, certificate signatures, original PDF text editing or secure redaction. White-out is only a visual cover.
