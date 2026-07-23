---
kind: external_dependency
name: Telegram Bot API (lead notifications)
slug: telegram-bot-api
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
source_files:
    - src/app/api/customers/route.ts
    - .env.example
---

### Notification channel
- The public customers POST route (`src/app/api/customers/route.ts`) sends a Markdown-formatted message to a Telegram chat via `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, using `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` from `.env.example`.
- This is a fire-and-forget side effect of lead capture; failures are logged but do not block the response.