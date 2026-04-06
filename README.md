# Focus Blocker

Simple Chrome extension that blocks configured websites during set days and times, then redirects to https://www.google.com/.

## How to use

1. Edit `rules.json`.
2. Add one rule per domain.
3. Load this folder in Chrome with `chrome://extensions` -> `Load unpacked`.
4. Reload the extension after changing `rules.json`.

## Rule format

```json
[
  {
    "domain": "linkedin.com",
    "days": ["mon", "tue", "wed", "thu", "fri"],
    "start": "08:00",
    "end": "17:00"
  }
]
```

## Notes

- `domain` can be a bare domain like `linkedin.com` or a full URL like `https://www.linkedin.com/`.
- Subdomains and all paths are blocked too.