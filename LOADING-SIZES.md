# V3 loading sizes

Decimal MB: 1 MB = 1,000,000 bytes. User documents are excluded.

| Measurement | Previous PDF Pro build | Office Pro V3 |
| --- | ---: | ---: |
| Automatic startup precache, uncompressed | 9.22 MB | 9.52 MB |
| Same files, gzip estimate | 3.43 MB | 3.72 MB |

A fresh production WebKit visit requested 9.55 MB across unique decoded URLs and transferred 4.17 MB of compressed response bodies in the gzip test server. Transfer includes repeat requests where present; headers and transport overhead are excluded. Actual host compression/cache behaviour varies. The uncompressed first visit remains below approximately 10 MB.

The extra core data is the new app shell/styles and approved local branding. OfficeHub, SheetEditor, WriterEditor, ExcelJS, Word generation/import, OCR and Template Studio are outside the core precache. Their code is requested when used and cached after downloading. They must be used online first before relying on offline availability.

The complete ZIP is much larger because it contains source, optional editors, OCR language data, compiled /docs, branding and notices. There is one current copy of each generated asset; builds clear /docs first. Exact core files and byte totals are in loading-sizes.json.
