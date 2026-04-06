# Focus Chrome

Simple Chrome extension that blocks configured websites during set days and times, then redirects to https://www.google.com/.

## How to use

1. Edit `rules.json`.
2. Add one rule per domain.
3. Open `chrome://extensions`
4. Turn on Developer mode
5. Load this folder with -> `Load unpacked`.
6. Reload the extension after changing `rules.json`.

## Rule format

```json
[
  {
    "domain": "example.com",
    "days": ["mon", "tue", "wed", "thu", "fri"],
    "start": "08:00",
    "end": "17:00"
  }
]
```

## Notes

- `domain` can be a bare domain like `google.com` or a full URL like `https://www.google.com/`.
- Subdomains and all paths are blocked too.
- Redirect page (`REDIRECT_URL`) can be configured in `background.json`.

## Example

<img width="310" height="443" alt="image" src="https://github.com/user-attachments/assets/2f0f71ae-1161-408d-a4d5-f85ee0f52a3e" />
