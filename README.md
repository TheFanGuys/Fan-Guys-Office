# Fan Guys Office Pro — V3

A free, private office workspace for your iPhone and computer. Hosted as static files on your existing GitHub Pages repository. Files stay in this browser on this device. No document uploads, paid services, API keys, sign-in, telemetry or cloud dependencies.

**The ZIP includes complete source AND a freshly built `/docs`. You do not need to install anything or run a build.**

## Update your existing website

1. Download and unzip `Fan-Guys-Office-Pro-V3.zip`.
2. Replace the repository files with this ZIP's contents. Replace the ENTIRE old `/docs` folder, rather than adding another set of assets to it.
3. Keep GitHub Settings → Pages → Deploy from a branch → `main` → `/docs`.
4. The included `.github/workflows/pages.yml` is deliberately disabled. Upload it over the old workflow, or delete the old Pages Actions workflow if your phone cannot upload hidden folders. There is only one deployment method: `/docs`.
5. Open the SAME website address as before. Accept **Save & reload** if offered, then close and reopen older app tabs.

**Do not clear Safari website data to update. That would remove your saved files.** Your repository name and URL do not need to change. The existing app database remains `pdf-pro-v1`, so PDFs, originals, templates, settings and both signatures stay in place. Older Docketra data still migrates automatically when present.

## What V3 adds

- Approved yellow Fan Guys Office Pro badge, home screen, sidebar, app icons and share-thumbnail file.
- **Spreadsheets:** new workbooks, multiple sheets, formulas, bold cells, number/currency/percentage formatting, row filtering, range sorting, copy-down, undo/redo, extra rows/columns, and a large-field row editor for phones.
- **Excel/CSV:** import an editable copy; export `.xlsx` or first-sheet CSV/PDF. Imported XLSX originals remain available to download.
- **Writer:** headings, paragraphs, bold/italic, lists, links and editable tables, undo/redo, word count, a scope-of-work starter, simplified Word/TXT import, Word/PDF export, and opening a generated PDF directly in the existing signing workspace.
- **Jobs & contacts:** customer, contact, email, phone, site address, job number, stage and notes. Office files can be linked to a job. These are local job records, not an email service or cloud CRM.
- **Notes & checklists:** editable notes, checkable items, job linking and text export including the checklist.
- **Complete backup/restore:** PDFs and imported originals, signatures/settings, PDF templates and all V3 office files in a single ZIP. Restore adds missing records and preserves current records with matching IDs. It does not overwrite newer work.

The first release of this expanded suite includes these working modules. Presentations, calendar scheduling, cross-device sync, automatic job-field insertion, document history snapshots and assembling mixed office-file packages are future work; there are no placeholder buttons claiming these exist.

## Existing PDF tools retained

Reading/search/zoom/print/thumbnails; annotations, comments, free text, ink, shapes and image insertion; standard form filling and creation; two renameable saved drawn/typed signature slots; quick Text, Check, X, Date and visual White-out stamps; multiple PDF tabs; local saving/recovery; originals and copies; image-to-PDF; page extraction/merge/reorder/rotation/deletion; lossless optimization attempts; English OCR; template design/import/export/PDF generation; business details; PDF search/favorites/rename/duplicate/delete; PDF-only backup; keyboard shortcuts; installable/offline support.

The GFY form phone fix remains: PDF inputs keep their PDF dimensions instead of expanding over neighboring lines. Form writes are serialized and export waits for pending edits. Same-document page edits retain standard fillable fields; multi-document merging warns before flattening. Lock form fields exports standard read-only flags in a copy. White-out only covers content visually; it is NOT secure redaction.

## Saving and sharing

Office files autosave shortly after an edit. **Save now** confirms a device save; leaving an office workspace flushes pending saves. PDFs retain their existing autosave and Save/Export flow. Download important work as an additional backup.

Office exports prepare the complete file first. Then tap **Share / Save to Files** to open the device share sheet from a fresh tap. Download is also provided. Choose Mail, Messages or another app from your device; Office Pro does not send email itself.

Browser storage is not a backup or an encrypted vault. Clearing website data, private browsing, device loss or browser eviction can remove local work. Complete backups are not encrypted and include signature images; keep them private. Restore supports complete V3 backups; the older PDF-only ZIP can still be restored by reopening the PDFs it contains. Close other app tabs before restoring and reload afterwards.

## Honest format limits

- **Sheets:** up to 10 MB per import, 2,000 rows and 100 columns per sheet, and 50,000 populated cells per workbook import. The visible grid pages through 50 rows and 20 columns at a time so phones do not render the whole workbook at once. Large imports may still be slow on a phone.
- **Formulas:** arithmetic, percentages, comparisons, relative/absolute cell references, ranges, cross-sheet references, SUM, AVERAGE, MIN, MAX, COUNT, COUNTA, ROUND, ABS, IF, AND, OR, NOT. IF currently evaluates both branches. Unsupported expressions show an explicit error; formulas are never executed as JavaScript. This is a focused formula engine, not full Excel compatibility.
- **Excel compatibility:** charts, macros, pivots, external workbook links, complex styles/validation, merged cells and advanced formulas are not preserved in the editable model. Export makes a new simplified workbook. Unsupported formulas export as text. Sorting keeps references address-based; renaming a sheet requires updating references to its old name. Original XLSX files are retained. CSV contains calculated values; potentially executable text is neutralized on export.
- **Word import:** body text, basic headings, bold/italic and simple tables. No images, headers/footers, tracked changes, comments, footnotes, numbering fidelity or exact page layout. Imported DOCX originals are retained. Link text is preserved on Word export, but hyperlink targets are not yet exported. Pasted text is plain text; apply formatting in Writer.
- **PDF from Writer:** a simplified layout, not a pixel-perfect Word conversion. Tables print as text columns with row rules. Built-in Latin fonts replace unsupported characters with `?`; use DOCX export when those characters matter. Spreadsheet PDF prints the first sheet across pages, with a 100-page safety limit; choose Excel for large sheets.
- **PDF limits unchanged:** original PDF text editing, DOCX/PDF exact round trips, certificate signatures, remote signing, live collaboration, hosted links and independently verified secure redaction are not included. Standard PDFs/image batches are limited to 50 MB. XFA page assembly is rejected. Read-only field flags are not password or cryptographic protection. OCR extracts English text; it does not add a searchable PDF layer. Optimization does not guarantee a smaller file.

## Offline and startup

Core PDF assets are precached. Office workspaces, Excel/Word support, OCR and Template Studio load only as needed and are cached after their assets have downloaded. Open and use the tools you need while online before taking them offline. A tool you have never opened is not guaranteed offline. Save important exports before leaving connectivity.

The approved badge is bundled locally. `public/brand/office-pro-share.jpg` is provided for link/website thumbnails; some social platforms require an absolute image URL. Set that metadata to your existing public Pages image URL if needed. Home-screen icons are included in the manifest.

See `LOADING-SIZES.md` and `TEST-RESULTS.md` for actual measured sizes and verification limits.

## Optional developer information

The included `/docs` is already built. These commands are only for future source work (Node.js 24 recommended; required for the TypeScript-based tests):

```sh
npm ci
npm test
npm run build
```

Every build prepares the local OCR assets and third-party licenses, deletes `/docs` and `/dist`, type-checks, then builds directly into fresh `/docs`. Runtime dependencies are bundled with the app, not loaded from public CDNs.

`npm run dev` starts development; `npm run preview` serves the production build. Optional `npm run test:webkit` uses separately installed Playwright WebKit, which is not an app dependency. The test fixture serves the app under a repository-style subpath. Do not upload `node_modules`.

## Licenses

App source is MIT. Keep `LICENSE`, `THIRD-PARTY-NOTICES.txt` and bundled `public/licenses`/`docs/licenses` when redistributing. V3 uses ExcelJS, ProseMirror and docx in addition to the existing PDF libraries. No commercial spreadsheet/editor SDK or hosted conversion service is included.
