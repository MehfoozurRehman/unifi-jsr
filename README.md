# UniFi Access ↔ Jisr HR Attendance Bridge

A real-time attendance integration system built with **Convex**, **Next.js 16 (Turbopack)**, and **Tailwind CSS v4**.

It bridges Apple Wallet / NFC access badge swipes from **UniFi Access** consoles into **Jisr HR** attendance logs with guaranteed delivery, deterministic fingerprint deduplication, and dynamic employee mapping.

---

## 🛠️ One-Time Server-Side Configuration

All credentials, API URLs, door rules, and timezone settings are configured **one time** on the server side via environment variables (or `.env.local`). The user panel is strictly dedicated to operations and employee mapping.

Create or update `.env.local` (or configure in your deployment environment / Convex Dashboard):

```env
# Convex URL
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# UniFi Access Console Configuration
UNIFI_BASE_URL=https://192.168.1.1:12445
UNIFI_API_TOKEN=your_unifi_access_api_token_here
UNIFI_WEBHOOK_SECRET=your_optional_webhook_secret_here

# Jisr HR Open API Configuration
# Use https://apis.jisr.net/api (AWS) OR https://api.jisr.net.sa/api/ (Saudi Local Server)
JISR_BASE_URL=https://apis.jisr.net/api
JISR_API_KEY=your_jisr_api_key_here
JISR_API_SECRET=your_jisr_api_secret_here
JISR_ACCESS_TOKEN=your_direct_jisr_access_token_if_available

# Attendance Rules & Timezone
DEFAULT_TIMEZONE=Asia/Riyadh
ATTENDANCE_MODE=RAW
# Options: 
# - RAW (Forward raw punch timestamps, let Jisr calculate in/out)
# - DIRECTION (Use UniFi reader Direction IN/OUT)
# - DOOR_RULES (Match specific door IDs to entry/exit)

ENTRY_DOOR_IDS=door-front-1,door-gate-main
EXIT_DOOR_IDS=door-back-1,door-exit-east
ALLOWED_EVENT_TYPES=access.door.unlock,door_unlock,access_granted
SYNC_INTERVAL_MINUTES=10
```

---

## 🚀 Application Navigation & Features

The panel interface is streamlined exclusively for daily operations:

1. **Dashboard** (`/`): Real-time KPI summaries, system architecture pipeline flow, and live attendance punches formatted in Saudi Arabia Time (`Asia/Riyadh`, UTC+3).
2. **Employee Mapping Studio** (`/mappings`): 1-click user directory sync from both APIs, smart matching suggestions (email & badge number matching), and manual UniFi $\leftrightarrow$ Jisr pairing controls.
3. **Audit & Punch Feed** (`/events`): Complete audit stream of processed Jisr punches and raw UniFi webhooks with expandable JSON drawers and 1-click manual retries.
4. **Webhook Simulator** (`/simulator`): Test and verify swipe events (Apple Wallet / NFC badge) in real time.

---

## 🔌 Webhook Setup in UniFi Access

1. Open your **UniFi OS Console** $\rightarrow$ **Access Application** $\rightarrow$ **Settings** $\rightarrow$ **Developer / Webhooks**.
2. Create a new Webhook:
   * **Webhook URL**: `https://<YOUR_CONVEX_DEPLOYMENT_URL>/webhook/unifi`
   * **Events**: Select `Access Logs` / `Door Unlock` (`access.door.unlock`).
   * **Secret**: (Optional) Enter the secret defined in `UNIFI_WEBHOOK_SECRET`.

---

## 🏃 Running Locally

```bash
# Install dependencies
pnpm install

# Start Convex Backend
npx convex dev

# Start Next.js Development Server
pnpm dev
```
