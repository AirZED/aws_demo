# 📦 Todo API — AWS Demo Project

A simple REST API built with **Node.js + TypeScript + Express**, designed for an AWS EC2 + Docker deployment demo.

---

## 🗂️ Project Structure

```
todo-api/
├── src/
│   ├── index.ts          ← App entry point & server setup
│   ├── types.ts          ← TypeScript interfaces
│   └── routes/
│       └── todos.ts      ← All /todos route handlers
├── Dockerfile            ← Multi-stage Docker build
├── docker-compose.yml    ← Local dev shortcut
├── ec2-setup.sh          ← Run once on fresh EC2 instance
├── tsconfig.json
└── package.json
```

---

## 🚀 API Endpoints

| Method | Endpoint      | Description            |
|--------|---------------|------------------------|
| GET    | `/`           | Health check           |
| GET    | `/todos`      | Get all todos          |
| GET    | `/todos/:id`  | Get a single todo      |
| POST   | `/todos`      | Create a new todo      |
| PATCH  | `/todos/:id`  | Toggle todo complete   |
| DELETE | `/todos/:id`  | Delete a todo          |

---

## 🧑‍💻 Local Development

```bash
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
npm run dev
```

Open browser → `http://localhost:8080`
Hit with Postman → `GET http://localhost:8080/todos`

**Say:** *"This is a TypeScript REST API running on my laptop. It works fine here — but how do we get it onto the internet?"*

---

### 🎤 STEP 2 — Walk through the Dockerfile (3 min)

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

Run it as a container:

```bash
docker run -p 8080:8080 todo-api
```

Hit it again in Postman — same result.

**Say:** *"Same app, now running inside a container. This container will behave identically on AWS."*

---

### 🎤 STEP 3 — Push code to GitHub (1 min)

```bash
git add .
git commit -m "todo api demo"
git push origin main
```

**Say:** *"Our code lives on GitHub — just like any other project. Instead of a separate image registry, we'll clone this directly onto the server and build it there."*

---

### 🎤 STEP 4 — SSH into EC2 (1 min)

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

### 🎤 STEP 5 — Clone, Build & Run on EC2 (4 min)

```bash
# Clone the repo from GitHub
git clone https://github.com/YOUR_USERNAME/todo-api.git
cd todo-api

# Build the Docker image directly on EC2
docker build -t todo-api .

# Run it — map EC2 port 80 to container port 8080
docker run -d -p 80:8080 --name todo-api todo-api

# Confirm it's running
docker ps

# Watch the logs
docker logs todo-api
```

**Say:** *"We clone the code straight from GitHub — no separate image registry needed. Docker builds it right here on the server, then runs it as a container."*

> ⚡ **Demo tip:** The first `docker build` pulls the Node base image (~150MB). Do this the night before to prime the cache — on stage the build will be near-instant since Docker reuses cached layers.

---

### 🎤 STEP 6 — Hit the live URL 🎉 (2 min)

Open browser → `http://YOUR_EC2_PUBLIC_IP`

Hit with Postman:
- `GET http://YOUR_EC2_PUBLIC_IP/todos`
- `POST http://YOUR_EC2_PUBLIC_IP/todos` with body `{ "title": "Added live from AWS!" }`
- `GET http://YOUR_EC2_PUBLIC_IP/todos` again — new item appears

**Say:** *"This is now live on the internet. Anyone in the world can hit this URL right now."*

---

### 🎤 STEP 7 — Explain the architecture (2 min)

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
  └─ docker build
  └─ docker run ──── port 80 ────▶ 🌐 Internet
```

Key concepts to name:
- **EC2** = virtual computer in AWS
- **Docker** = packaging system (solve "works on my machine")
- **Security Group** = firewall (we opened port 80)
- **GitHub** = where our source code lives — EC2 clones from it directly

**What's next in production:**
- Load Balancer → spread traffic across multiple EC2s
- Auto Scaling → add EC2s when traffic spikes
- CI/CD Pipeline → code push → auto deploy (no manual SSH)

---

## 🛠️ Useful Docker Commands (Cheatsheet)

```bash
docker build -t todo-api .          # Build image
docker run -p 8080:8080 todo-api    # Run (foreground)
docker run -d -p 8080:8080 todo-api # Run (background)
docker ps                           # List running containers
docker logs todo-api                # View logs
docker stop todo-api                # Stop container
docker rm todo-api                  # Remove container
docker images                       # List local images
```

---

## 🔥 Postman Collection

Import these 3 requests:

1. **Health Check** — `GET http://localhost:8080/`
2. **Get All Todos** — `GET http://localhost:8080/todos`
3. **Create Todo** — `POST http://localhost:8080/todos`
   - Body (JSON): `{ "title": "My new todo" }`

After deployment, swap `localhost:8080` for your EC2 public IP on port 80.
