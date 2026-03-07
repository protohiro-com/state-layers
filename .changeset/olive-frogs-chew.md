---
"@protohiro/state-layers": patch
---

Harden package publishing and release infrastructure.

- fix package export metadata for ESM and CommonJS consumers
- add deterministic verification gates including publint and pack checks
- add Docker-based demo deployment and Changesets-based npm release workflow
- improve runtime and CSS fallback coverage with regression tests
