# 📦 Todo API — AWS Demo Project

A todo app built with **Node.js + TypeScript + Express**, **PostgreSQL**, JWT authentication and a small web frontend — designed as a beginner-friendly DevOps demo: Docker, Docker Compose, health checks, CI and AWS EC2 deployment.

---

## ✅ Prerequisites

**To run it locally (the core demo):**

| Tool | Version | Why | Check |
|---|---|---|---|
| [Docker Engine / Docker Desktop](https://docs.docker.com/get-docker/) | 24+ | Runs the API, PostgreSQL and Adminer containers | `docker --version` |
| Docker Compose **v2** (bundled with Docker Desktop) | 2.20+ | `docker compose` (with a space) starts everything | `docker compose version` |
| [Git](https://git-scm.com/downloads) | any | Clone the repo, push to GitHub | `git --version` |
| [Node.js](https://nodejs.org/) + npm | 20+ | Only for `npm run dev` outside Docker | `node -v` |
| `curl` | any | Quick API calls in the demos | `curl --version` |
| `openssl` | any | Generate `JWT_SECRET` (`openssl rand -hex 32`) | `openssl version` |

Linux users: add yourself to the docker group so you don't need `sudo` (`sudo usermod -aG docker $USER`, then log out and back in).

**Free ports on your machine:** `8080` (app), `8081` (Adminer), `5432` (PostgreSQL). If something already uses one, stop it first — e.g. don't run `npm run dev` and the Compose `todo-api` container at the same time.

**Optional but recommended:**
- [Postman](https://www.postman.com/downloads/) (or Insomnia / `curl`) to call the API.
- A web browser — the app UI is at `http://localhost:8080`.

**For the cloud deployment part (Steps 4–8):**
- A [GitHub](https://github.com/) account and this repo pushed to it.
- An [AWS account](https://aws.amazon.com/free/) with an EC2 instance (Ubuntu) — security group allowing inbound **22** (SSH, ideally your IP only) and **80** (HTTP).
- The instance's key pair file (`.pem`), made private with `chmod 400 your-key.pem`.
- An SSH client (built in on macOS/Linux/Windows 10+).

**First-time setup (once):**
```bash
git clone https://github.com/AirZED/aws_demo.git
cd aws_demo        # use the folder that contains docker-compose.yml
cp .env.example .env
# edit .env: set DB_PASSWORD and JWT_SECRET (openssl rand -hex 32)
docker compose up -d --build
# open http://localhost:8080
```

---

## 🗂️ Project Structure

```
todo-api/
├── src/
│   ├── index.ts          ← App entry point & server setup
│   ├── types.ts          ← TypeScript interfaces
│   ├── db.ts             ← PostgreSQL connection pool, retry, schema
│   ├── auth.ts           ← register/login, JWT, requireAuth middleware
│   └── routes/
│       └── todos.ts      ← /todos route handlers (per-user)
├── public/index.html     ← Frontend (plain HTML/JS, no build step)
├── Dockerfile            ← Multi-stage Docker build
├── docker-compose.yml    ← API + PostgreSQL + Adminer DB viewer (volume, healthchecks)
├── .github/workflows/ci.yml ← CI pipeline (build + smoke test)
├── ec2-setup.sh          ← Run once on fresh EC2 instance
├── tsconfig.json
└── package.json
```

---

## 🚀 API Endpoints

| Method | Endpoint      | Description            |
|--------|---------------|------------------------|
| GET    | `/`           | Frontend (web UI)      |
| GET    | `/info`       | App info (JSON)        |
| GET    | `/health`     | Health check (checks DB)|
| POST   | `/auth/register` | Create account → JWT |
| POST   | `/auth/login` | Log in → JWT           |
| GET    | `/auth/me`    | Current user (needs token) |
| GET    | `/todos`      | Get your todos (needs token) |
| GET    | `/todos/:id`  | Get a single todo (needs token) |
| POST   | `/todos`      | Create a new todo (needs token) |
| PATCH  | `/todos/:id`  | Toggle todo complete (needs token) |
| DELETE | `/todos/:id`  | Delete a todo (needs token) |

Protected routes expect the header `Authorization: Bearer <token>`; get a token from `/auth/register` or `/auth/login`.

---

## 🧑‍💻 Local Development

The app needs PostgreSQL. Start just the database container, then run the API on your machine:

```bash
cp .env.example .env                # set DB_PASSWORD and JWT_SECRET (openssl rand -hex 32)
docker compose up -d db             # PostgreSQL on localhost:5432

# Install dependencies
npm install

# Run in dev mode (with hot reload)
npm run dev

# Build for production
npm run build

# Run compiled output
npm start
```


### 🎤 STEP 1 — Show the app running locally (2 min)

```bash
# In project root
docker compose up -d db
npm run dev
```

Open browser → `http://localhost:8080` → register an account, add a todo.
Hit with Postman → `GET http://localhost:8080/todos` (401 without a token — see Demo 6).

**Say:** *"This is a TypeScript app with a PostgreSQL database running on my laptop. It works fine here — but how do we get it onto the internet?"*

---

### 🎤 STEP 2 — Show environment variables (1 min)

Copy the example file and open it:

```bash
cp .env.example .env
```

```env
PORT=8080
NODE_ENV=development
APP_NAME=Todo API
API_VERSION=1.0.0

DB_HOST=localhost
DB_PORT=5432
DB_USER=todo
DB_PASSWORD=change_me
DB_NAME=tododb

JWT_SECRET=change_me      # openssl rand -hex 32
JWT_EXPIRES_IN=1h
```

**Say:** *"Instead of hardcoding values like the database password or the token secret, we read them from environment variables. The real `.env` is never committed to git. This means the same Docker image can behave differently in dev, staging, and production — just by swapping the env file."*

Hit the info endpoint to see the values in the response:

```bash
GET http://localhost:8080/info
```

On the server, Docker Compose passes the `.env` file into the container (`env_file: .env`), and overrides `DB_HOST=db` so the API finds the database container by its service name.

---

### 🎤 STEP 3 — Walk through the Dockerfile (3 min)


Open `Dockerfile` in your editor and walk through it:

```
Stage 1 (builder): Node + TypeScript → compiles our .ts files to .js
Stage 2 (production): Lean Node image + compiled JS only → smaller, faster
```

**Say:** *"A Dockerfile is like a recipe — it tells Docker exactly how to package our app. The multi-stage build means our final image is small and clean, with no development tools included."*

Build it live:

```bash
docker build -t todo-api .
```

Run it as a container (together with its database, using Compose):

```bash
docker compose up -d --build
docker compose ps
```

Open `http://localhost:8080` again — same app, same behaviour.

**Say:** *"Same app, now running inside a container next to a database container. This will behave identically on AWS."*

---

### 🎤 STEP 4 — Push code to GitHub (1 min)

```bash
git add .
git commit -m "todo api demo"
git push origin main
```

**Say:** *"Our code lives on GitHub — just like any other project. Instead of a separate image registry, we'll clone this directly onto the server and build it there."*

---

### 🎤 STEP 5 — SSH into EC2 (1 min)

```bash
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

Once in:

```bash
# Confirm Docker is ready
docker --version
```

**Say:** *"This is a virtual computer running in Amazon's data center in [region]. I've already installed Docker on it — let me show you those commands."*

Show `ec2-setup.sh` briefly.

---

### 🎤 STEP 6 — Clone, Build & Run on EC2 (4 min)

```bash
# Clone the repo from GitHub
git clone https://github.com/YOUR_USERNAME/todo-api.git
cd todo-api

# Create the env file (secrets are NOT in git)
cp .env.example .env && nano .env      # set a real DB_PASSWORD, PORT=8080

# Build the image and start API + database together
docker compose up -d --build

# Confirm both are running and healthy
docker compose ps

# Watch the logs
docker compose logs -f todo-api
```

**Say:** *"We clone the code straight from GitHub — no separate image registry needed. Docker Compose builds the API and starts a PostgreSQL database next to it with one command."*

> Note: in `docker-compose.yml` change `"8080:8080"` to `"80:8080"` on EC2 so the app is reachable on port 80.

> ⚡ **Demo tip:** The first `docker build` pulls the Node base image (~150MB). Do this the night before to prime the cache — on stage the build will be near-instant since Docker reuses cached layers.

---

### 🎤 STEP 7 — Hit the live URL 🎉 (2 min)

Open browser → `http://YOUR_EC2_PUBLIC_IP` → register an account and add a todo from the web UI.

Then hit it with Postman (see the Postman section for the token header):
- `GET http://YOUR_EC2_PUBLIC_IP/health` → database connected
- `GET http://YOUR_EC2_PUBLIC_IP/todos` with `Authorization: Bearer <token>`
- `POST http://YOUR_EC2_PUBLIC_IP/todos` with body `{ "title": "Added live from AWS!" }` — the new item appears in the web UI

**Say:** *"This is now live on the internet. Anyone in the world can hit this URL right now."*

---

### 🎤 STEP 8 — Explain the architecture (2 min)

Draw or display:

```
[Your Laptop]
     │
     │  git push
     ▼
[GitHub]
     │
     │  git clone
     ▼
[EC2 Instance]
  └─ docker compose up
       ├─ todo-api (Node) ── port 80 ──▶ 🌐 Internet
       └─ todo-db (PostgreSQL + volume)
```

Key concepts to name:
- **EC2** = virtual computer in AWS
- **Docker** = packaging system (solve "works on my machine")
- **Security Group** = firewall (we opened port 80)
- **GitHub** = where our source code lives — EC2 clones from it directly
- **Docker Compose** = runs several containers (API + database) as one app

**What's next in production:**
- Load Balancer → spread traffic across multiple EC2s
- Auto Scaling → add EC2s when traffic spikes
- CI/CD Pipeline → code push → auto deploy (no manual SSH)

---

## 🗄️ DATABASE DEMO — PostgreSQL + Docker Compose (5 min)

**Start everything with one command:**

```bash
cp .env.example .env     # then set DB_PASSWORD
docker compose up -d --build
docker compose ps        # both show (healthy)
```

**Say:** *"Three containers: the API, a PostgreSQL database and Adminer (a database viewer). Compose starts the DB first, waits for its healthcheck, then starts the API."*

### Demo 1 — Data is stored in a real database
```bash
# In the web UI (http://localhost:8080): register, then add "Saved in Postgres". Then:
docker exec -it todo-db psql -U todo -d tododb -c "SELECT title, completed FROM todos;"
docker exec -it todo-db psql -U todo -d tododb -c "SELECT email, left(password_hash, 10) FROM users;"
```
**Say:** *"The row I created in the app is physically in the database — and so is my account, with a hashed password."*

### Viewing the database (web UI)
Open **http://localhost:8081** (Adminer) and log in with:

| Field | Value |
|---|---|
| System | PostgreSQL |
| Server | `db` |
| Username / Password / Database | `DB_USER` / `DB_PASSWORD` / `DB_NAME` from your `.env` |

Click **todos** or **users** → **Select data** to browse rows live while you use the app. You can also run SQL from the "SQL command" link. Terminal alternative:
`docker exec -it todo-db psql -U todo -d tododb` (then `\dt`, `SELECT * FROM todos;`).

**On EC2** the viewer and the database are bound to `127.0.0.1` on purpose (an open database panel is a security hole). View them from your laptop through an SSH tunnel:
```bash
ssh -i aws-demo.pem -L 8081:localhost:8081 ubuntu@YOUR_EC2_PUBLIC_IP
# then open http://localhost:8081 on your laptop
```

### Demo 2 — Containers are disposable, data is not (the "wow" moment)
```bash
docker compose rm -sf todo-api     # destroy the API container
docker compose up -d               # recreate it
# Refresh the web UI — you are still logged in and the todo is still there!
```
**Say:** *"Before, restarting the app wiped everything because data lived in memory. Now data lives in a Docker volume, outside the container."*

```bash
docker volume ls                   # show the pgdata volume
```

### Demo 3 — Health checks
```bash
curl localhost:8080/health         # {"status":"ok","database":"connected"}
docker compose stop db
curl localhost:8080/health         # 503 — "database":"unreachable"
docker compose start db            # recovers by itself
```
**Say:** *"Load balancers and orchestrators use endpoints like this to know when to stop sending traffic or restart something."*

### Demo 4 — Config via environment, not code
`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` come from `.env` (never committed).
Inside Compose `DB_HOST=db` — containers find each other by **service name**.
Later you can point `DB_HOST` at AWS RDS without changing any code.

### Demo 5 — CI pipeline
Show `.github/workflows/ci.yml`. Push to GitHub → Actions tab: it type-checks, builds the image, starts the full stack and smoke-tests `/health` and `/todos`.
**Say:** *"Every push is automatically verified — that's Continuous Integration."*

### Demo 6 — Authentication (JWT)
```bash
curl -i localhost:8080/todos                       # 401 — no token
curl -X POST localhost:8080/auth/register -H 'content-type: application/json' \
  -d '{"email":"me@example.com","password":"supersecret1"}'   # returns a JWT
curl localhost:8080/todos -H "Authorization: Bearer <token>"  # now it works
```
**Say:** *"The server hands back a signed token. The browser sends it on every request; the server verifies the signature, so it never stores sessions. Each user only sees their own todos."*

Show a token at [jwt.io](https://jwt.io) — it is readable by anyone, just not forgeable without `JWT_SECRET`. Passwords are stored as bcrypt hashes: `docker exec todo-db psql -U todo -d tododb -c "SELECT email, password_hash FROM users;"`

> **Known trade-off (next step):** the frontend keeps the JWT in `localStorage`, which any XSS bug could read. The plan is to move it to an `HttpOnly` cookie — all token storage is isolated in the `session` object in `public/index.html` and `requireAuth` in `src/auth.ts`.

### Cleanup
```bash
docker compose down        # stop (keeps data)
docker compose down -v     # stop AND delete the database volume
```

### DevOps concepts this covers
| Concept | Where to see it |
|---|---|
| Containers | `Dockerfile` (multi-stage, non-root user) |
| Multi-container apps | `docker-compose.yml` |
| Persistent storage | `pgdata` volume |
| Health checks | `HEALTHCHECK`, `pg_isready`, `/health` |
| Config / secrets | `.env`, `.env.example`, `.gitignore` (incl. `JWT_SECRET`) |
| Authentication | `src/auth.ts` (bcrypt + JWT) |
| Service dependencies | `depends_on: service_healthy` |
| CI | `.github/workflows/ci.yml` |
| Cloud hosting | `ec2-setup.sh` |
| Next steps | RDS, load balancer, auto scaling, CD |

---

## 🛠️ Useful Docker Commands (Cheatsheet)

```bash
docker build -t todo-api .          # Build image
docker ps                           # List running containers
docker logs todo-api                # View logs
docker compose up -d --build        # Start API + DB
docker compose ps                   # Status / health
docker compose down -v              # Stop and delete data
docker exec -it todo-db psql -U todo -d tododb   # SQL shell
docker compose logs -f todo-api     # Follow API logs
docker compose restart todo-api     # Restart the API only
docker images                       # List local images
```

---

## 🔥 Postman Collection

Create a collection variable `base` = `http://localhost:8080`, then these requests:

1. **Health** — `GET {{base}}/health`
2. **Register** — `POST {{base}}/auth/register` — body (JSON): `{ "email": "me@example.com", "password": "supersecret1" }`
   Copy the `token` from the response.
3. **Login** — `POST {{base}}/auth/login` — same body (use this later instead of registering again)
4. **Get All Todos** — `GET {{base}}/todos`
5. **Create Todo** — `POST {{base}}/todos` — body (JSON): `{ "title": "My new todo" }`

For requests 4–5, open the **Authorization** tab → type **Bearer Token** → paste the token (set it once at collection level). Tokens expire after `JWT_EXPIRES_IN` (1 hour) — log in again if you get `401`.

After deployment, change `base` to `http://YOUR_EC2_PUBLIC_IP`.

this is hotfix branch
