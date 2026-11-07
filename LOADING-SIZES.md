# Fan Guys Office V3.1 loading sizes

Decimal MB; user documents are excluded.

| Measurement | Earlier PDF Pro | Office V3 | Office V3.1 |
| --- | ---: | ---: | ---: |
| Startup precache, uncompressed | 9.22 MB | 9.52 MB | 9.52 MB |
| Same files, gzip estimate | 3.43 MB | 3.72 MB | 3.72 MB |

A fresh WebKit visit during V3.1 testing requested 9.55 MB across unique decoded URLs. It transferred 4.16 MB of compressed response bodies on the test server. Hosting compression varies.

The optional OCR files, Template Studio, Writer, Sheets and blue letterhead logos are excluded from the startup cache. Open tools online first so their files can be cached for offline use. The ZIP also includes source, built optional tools and standalone Word templates. Every build clears /docs first.
