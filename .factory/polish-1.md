# Polish 1 — finding closure map

Local evidence: `.factory/evidence/local/screenshot-desktop.png`, `.factory/evidence/local/screenshot-mobile.png`, and `verify.json`. The deployed recheck is recorded in the handoff.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Replaced registry/release wording with working Git source install. | `@claim:free-source-install`; README |
| F-1-2 | Rewrote the first screen with job, developer, and one demo action. | home screenshot; `@claim:demo-sandbox` |
| F-1-3 | Added CLI demo, `/demo/`, `?demo=1`, banner, reset, and docs. | `@claim:demo-sandbox`; `.factory/demo.md` |
| F-1-4 | Added registry and one tagged test per listed claim. | `rg @claim:`; `npm test` |
| F-1-5 | Added broadsheet 404 page and response override. | `@claim:routes-and-404`; `/404.html` |
| F-1-6 | Tested local output and same-origin site requests. | `@claim:local-only`; `@claim:site-private` |
| F-1-7 | Tested the manifest preview. | `@claim:manifest-plan` |
| F-1-8 | Tested preview leaves no review folder. | `@claim:preview-read-only` |
| F-1-9 | Tested CI rejection without approval. | `@claim:command-approval` |
| F-1-10 | Added secret fixtures and redaction-before-disk test. | `@claim:redact-before-disk` |
| F-1-11 | Tested digest-only configuration evidence. | `@claim:config-hash-only` |
| F-1-12 | Tested traversal rejection and manifest boundaries. | `@claim:manifest-boundaries` |
| F-1-13 | Tested inspection file/size/hash ledger. | `@claim:inspection-ledger` |
| F-1-14 | Tested changed files block export. | `@claim:inspection-required` |
| F-1-15 | Tested safe ZIP contents. | `@claim:archive-contents` |
| F-1-16 | Added separate demo storage and reset/start controls. | `@claim:demo-sandbox` |
| F-1-17 | Tested offline demo reload. | `@claim:offline-reload` |
| F-1-18 | Removed the untrue release-binary claim. | first-screen audit |
| F-1-19 | Documented Git source install and MIT/free terms. | `@claim:free-source-install` |
| F-1-20 | Tested help, JSON, and CI behavior. | `@claim:cli-contract` |
| F-1-21 | Tested binary/static build outputs. | `@claim:clean-build` |
| F-1-22 | Tested request origin and cookies. | `@claim:site-private` |
| F-1-23 | Tested service-worker cache removal. | `@claim:clear-cache` |
| F-1-24 | Tested Arrow, Home, and End navigation. | `@claim:demo-keyboard` |
| F-1-25 | Added canonical/social metadata, icons, and social card. | `@claim:routes-and-404`; local verify |
| F-1-26 | Added robots and sitemap. | `dist/site/robots.txt`, `sitemap.xml` |
| F-1-27 | Applied one header/footer skeleton with ownership/build id. | local screenshots |
| F-1-28 | Added focusable H1s and polite route announcements. | browser suite |
| F-1-29 | Identified external GitHub links for assistive technology. | browser accessibility suite |
| F-1-30 | Moved sample preview directly below the first screen. | home screenshot |
| F-1-31 | Rewrote the method heading. | copy audit |
| F-1-32 | Rewrote export copy. | copy audit |
| F-1-33 | Rewrote privacy heading. | copy audit |
| F-1-34 | Rewrote manifest heading. | copy audit |
| F-1-35 | Split the long README sentence. | copy audit |
| F-1-36 | Named the action “Reset demo.” | `@claim:demo-sandbox` |
| F-1-37 | Rewrote README opening. | copy audit |
| F-1-38 | Rewrote manifest introduction. | README |
| F-1-39 | Uses “collection item” in prose. | README |
| F-1-40 | Rewrote approval language. | README |
| F-1-41 | Named the five supported types. | README |
| F-1-42 | Standardized all four reported terms. | terminology table |
| F-1-43 | Made issue tracker a 44px standalone link. | mobile screenshot |
