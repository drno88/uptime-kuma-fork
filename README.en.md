<div align="center" width="100%">
    <img src="./public/icon.svg" width="128" alt="Uptime Kuma Logo" />
</div>

# Uptime Kuma + multi-user support

**Languages:** English | [Русский](README.md)

Fork of [louislam/uptime-kuma](https://github.com/louislam/uptime-kuma) with added roles (admin / user), per-user monitor sharing, and status page access control.

---

Uptime Kuma is an easy-to-use self-hosted monitoring tool.

<img src="https://user-images.githubusercontent.com/1336778/212262296-e6205815-ad62-488c-83ec-a5b0d0689f7c.jpg" width="700" alt="Uptime Kuma Dashboard Screenshot" />

## ⭐ Features

- Monitoring uptime for HTTP(s) / TCP / HTTP(s) Keyword / HTTP(s) Json Query / Websocket / Ping / DNS Record / Push / Steam Game Server / Docker Containers
- Fancy, Reactive, Fast UI/UX
- Notifications via Telegram, Discord, Gotify, Slack, Pushover, Email (SMTP), and 90+ notification services
- 20-second intervals
- Multi Languages
- Multiple status pages
- Map status pages to specific domains
- Ping chart
- Certificate info
- Proxy support
- 2FA support
- **Multi-user support** — admin and user roles, selective per-user monitor sharing
- **Status page access control** — public, password-protected, or login-required

## 👥 Multi-User Support

| Feature | Admin | User |
|---|:---:|:---:|
| View own monitors | ✅ | ✅ |
| View monitors shared with them | ✅ | ✅ |
| Create monitors | ✅ | ✅ |
| Edit / delete own monitors | ✅ | ✅ |
| Share a monitor with specific users | ✅ | ❌ |
| Add / delete users | ✅ | ❌ |

**How it works:**
1. The first account created during initial setup automatically becomes **Admin**.
2. Admin adds more users via **Settings → Users**.
3. When creating or editing a monitor, admins see a **"Share With"** section to grant read access to specific users.
4. Users with shared access can view the monitor but cannot edit it.
5. If a monitor belongs to a group, the group is shared automatically.

## 🔒 Status Page Access Control

Each status page can be configured with one of three access modes:

| Mode | Description |
|---|---|
| **Public** | Open to everyone, no login required |
| **Password protected** | Shows a password prompt before the page loads |
| **Login required** | Requires login with a user account from the system |

The mode is set in the status page settings (**Access** field). The auth token is stored in the browser session.

> The "Login required" mode is useful for internal dashboards: create a regular user, share the status page URL — they log in with their credentials and see only the relevant monitors.

## 🔧 How to Install

### 🐳 Docker + Caddy — recommended (automatic HTTPS)

The [`docker-deploy/`](docker-deploy/) folder contains everything needed:

```
docker-deploy/
├── docker-compose.yaml   # Caddy + Uptime Kuma
├── Dockerfile            # builds the app from source (frontend + backend)
└── Caddyfile.example     # copy this to Caddyfile and set your domain
```

**Steps:**

```bash
# 1. Clone this repo
git clone https://github.com/drno88/uptime-kuma-fork.git
cd uptime-kuma-fork/docker-deploy

# 2. Create Caddyfile from the example and set your domain
cp Caddyfile.example Caddyfile
nano Caddyfile

# 3. Build and start
docker compose up -d --build
```

What happens on `--build`:
- Docker installs Node.js dependencies
- Builds the Vue frontend (`npm run build`)
- Starts Uptime Kuma + Caddy in the same network
- Caddy gets a TLS certificate automatically

Port 3001 is **not** exposed to the internet — traffic goes through Caddy only.

> [!WARNING]
> File Systems like **NFS** (Network File System) are **NOT** supported. Please map to a local directory or volume.

### 💪🏻 Without Docker

Requirements:

- Platform:
  - ✅ Major Linux distros (Debian, Ubuntu, Fedora, Arch, etc.)
  - ✅ Windows 10 (x64), Windows Server 2012 R2 (x64) or higher
  - ❌ FreeBSD / OpenBSD / NetBSD
- [Node.js](https://nodejs.org/en/download/) >= 20.4
- [Git](https://git-scm.com/downloads)
- [pm2](https://pm2.keymetrics.io/) — for running in the background

```bash
git clone https://github.com/drno88/uptime-kuma-fork.git
cd uptime-kuma-fork
npm run setup

# Option 1. Try it
node server/server.js

# Option 2. Run in the background with PM2 (recommended)
npm install pm2 -g && pm2 install pm2-logrotate
pm2 start server/server.js --name uptime-kuma

# Add to startup
pm2 startup && pm2 save
```

## 🆙 How to Update

```bash
cd uptime-kuma-fork
git pull
cd docker-deploy
docker compose up -d --build
```

## 🖼 Screenshots

Light Mode:

<img src="https://uptime.kuma.pet/img/light.jpg" width="512" alt="Uptime Kuma Light Mode" />

Status Page:

<img src="https://user-images.githubusercontent.com/1336778/134628766-a3fe0981-0926-4285-ab46-891a21c3e4cb.png" width="512" alt="Uptime Kuma Status Page" />

Settings Page:

<img src="https://louislam.net/uptimekuma/2.jpg" width="400" alt="Uptime Kuma Settings Page" />

---

Based on [louislam/uptime-kuma](https://github.com/louislam/uptime-kuma).
