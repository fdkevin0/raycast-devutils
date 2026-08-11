# Changelog

## [2.0.0] - 2026-06-10

### Changed

- **Breaking**: Removed dependency on the external DevUtils macOS app. All tools now work inline within the extension.
- Upgraded to `@raycast/api` v1.91.0 and `@raycast/utils` v1.18.0
- Added prettier-based formatting for JS, CSS, SCSS, LESS, HTML
- Added js-yaml for YAML/JSON conversions
- Added qrcode library for QR code generation
- Added diff library for text comparison
- Added sql-formatter for SQL formatting

### Added

- Interactive view modes for most tools (Form-based input, Detail-based output)
- Color converter with visual color block
- QR code generator with SVG rendering
- Text diff checker with line/word/character modes
- Regex tester with capture group inspection
- Hash generator with algorithm selection
- UUID/ULID generator
- Lorem ipsum generator
- Random string generator with charset selection
- String inspector with character frequency analysis
- Cron parser with human-readable schedule descriptions

## [1.0.0] - Initial Release

- Original extension by @vietanhlehuu that opened DevUtils macOS app
