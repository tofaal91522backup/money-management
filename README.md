# Money Management

A personal finance app built with Next.js 16, Prisma 7 and PostgreSQL: accounts, transactions, loans, budgets and reports.

## Local development

Requirements: Node 22+ and a PostgreSQL database.

```bash
cp .env.example .env     # set DATABASE_URL, INITIAL_USER_EMAIL, INITIAL_USER_PASSWORD
npm install              # also runs `prisma generate`
npx prisma migrate deploy
npm run db:seed          # creates the initial user and default categories
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://user:pass@localhost:5432/money_management` |
| `INITIAL_USER_EMAIL` / `INITIAL_USER_PASSWORD` | Used only by `npm run db:seed` |

## Database

- PostgreSQL through Prisma (`@prisma/adapter-pg`). The schema is `prisma/schema.prisma`.
- Migrations live in `prisma/migrations`. The single baseline `20261017000000_postgres_init` replaced the earlier SQLite/Turso migrations (still in git history).
- Create a new migration while developing with `npm run db:migrate`.
- The app has CSV export and import under Settings. Import replaces all of the signed-in user's data.

## Deploying to a VPS (Ubuntu + nginx + systemd)

The app builds as a Next.js standalone server (`output: "standalone"`). Build on your own machine and upload the result, so a small server (1 GB RAM) never has to run `next build`.

Production runs at `https://wallet.tofaal.online`. Session cookies are `secure` in production, so HTTPS is required for login.

### 1. Server setup (once)

```bash
# PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib
sudo -u postgres psql -c "CREATE ROLE money_app LOGIN PASSWORD '<password>'"
sudo -u postgres psql -c "CREATE DATABASE money_management OWNER money_app"

# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Create `~/money-management/app/.env` on the server (mode 600):

```
NODE_ENV=production
PORT=3000
HOSTNAME=127.0.0.1
DATABASE_URL=postgresql://money_app:<password>@127.0.0.1:5432/money_management
```

### 2. Build locally and package

```bash
DATABASE_URL=postgresql://x:x@localhost/x npx next build

rm -rf deploy && mkdir deploy
cp -R .next/standalone/. deploy/
rm -f deploy/.env                       # never ship local secrets
mkdir -p deploy/.next
cp -R .next/static deploy/.next/static
cp -R public deploy/public
cp -R prisma/migrations deploy/migrations
tar -czf app.tgz -C deploy .
```

The `DATABASE_URL` above is a placeholder, needed only so the module loads during the build.

### 3. Upload and run

```bash
scp app.tgz <host>:/tmp/
ssh <host> 'cd ~/money-management/app && tar -xzf /tmp/app.tgz'
```

First deploy only: create the tables, then seed or import data.

```bash
psql "$DATABASE_URL" -f migrations/20261017000000_postgres_init/migration.sql
```

Prisma is not installed on the server, so apply later migrations by running their `migration.sql` with `psql`.

### 4. systemd service

`/etc/systemd/system/money-management.service`:

```ini
[Unit]
Description=Money Management (Next.js)
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=<user>
WorkingDirectory=/home/<user>/money-management/app
EnvironmentFile=/home/<user>/money-management/app/.env
ExecStart=/usr/bin/node --max-old-space-size=384 server.js
Restart=always
RestartSec=3
MemoryMax=450M

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now money-management
```

Day to day:

```bash
systemctl status money-management
journalctl -u money-management -f
sudo systemctl restart money-management    # after uploading a new build
```

### 5. nginx reverse proxy

`/etc/nginx/sites-available/wallet.tofaal.online`, linked into `sites-enabled`:

```nginx
server {
    listen 80;
    server_name wallet.tofaal.online;
    client_max_body_size 50m;            # matches the 50 MB CSV import limit

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

nginx only proxies. The Next.js server handles pages and `/api`, so a static-file setup will not work.

### 6. HTTPS

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d wallet.tofaal.online --redirect
```

certbot adds the 443 block and installs a timer for automatic renewal.
