# DevOps Beginner Reading Guide

Read this in order. Each section ends with **"Check yourself"** questions. If you can answer them in your own words, you've got it. Don't memorise: understand.
You will see every idea here again in the project we're building.

---

## 1. Ports

**The idea.** A computer has one address (an IP address, like `192.168.1.8`), but runs many programs at once. A **port** is a number from 0 to 65535 that says *which program* on that computer should receive the traffic.

Think of an apartment building: the IP address is the street address, the port is the apartment number.

```
http://192.168.1.8:8080
        └── IP ──┘ └ port
```

**Well-known ports you'll meet**

| Port | Used for |
|---|---|
| 22 | SSH — remote login to a server |
| 80 | HTTP — web traffic (not encrypted) |
| 443 | HTTPS — web traffic (encrypted) |
| 5432 | PostgreSQL |
| 3306 | MySQL / MariaDB |
| 27017 | MongoDB |
| 6379 | Redis |
| 8080, 3000, 8081 | Common "development" ports. Anyone can use them. |

**Rules**
- Only **one program** can listen on a port at a time. That's why you got "port is already allocated" errors.
- When you type `http://example.com` the browser silently uses port 80. For `https://` it silently uses 443. Everything else needs `:port` in the URL.
- Ports below 1024 are "privileged". Normally only the system or an admin can use them.

**Ports in Docker.** In `docker-compose.yml` you'll see `"8080:8080"` and `"127.0.0.1:8081:8080"`. The format is `HOST_PORT:CONTAINER_PORT`.
- The container has its own private network. Port mapping is a door from your computer into it.
- `8081:8080` means "traffic arriving on my computer's port 8081 goes to port 8080 inside the container".
- `127.0.0.1:` in front means "only accept connections from this computer".

**Ports on a cloud server (AWS).** A **security group** is a firewall: a list of ports allowed in. If port 80 isn't open in the security group, nobody can reach your site even though it's running.

**Check yourself**
1. What's the difference between an IP address and a port?
2. Why can't two programs listen on port 8080 at once?
3. What does `3000:8080` mean in a Docker port mapping?
4. Why should you never open port 5432 to the whole internet?

---

## 2. Port 80 vs 443: HTTP vs HTTPS

Both carry web traffic. The difference is **encryption**.

| | HTTP (port 80) | HTTPS (port 443) |
|---|---|---|
| Encrypted? | No. Plain text. | Yes (TLS) |
| Padlock in browser | No ("Not secure") | Yes |
| Can someone on the same Wi-Fi read it? | Yes, including passwords and tokens | No, they see only gibberish |
| Needs a certificate? | No | Yes |

**How HTTPS works, simplified**
1. Your browser connects to the server on port 443 and says "let's talk securely".
2. The server shows its **certificate**, which proves "I really am example.com". It is signed by a trusted authority (a Certificate Authority such as Let's Encrypt).
3. Browser and server agree on a secret key.
4. From now on everything between them is encrypted with that key.

**Why it matters for us.** Our app sends a login password and a **JWT token** on every request. Over plain HTTP, anyone on the network between you and the server can copy them. That's why a real deployment uses HTTPS. (When we shared the app through ngrok, it was HTTPS, because ngrok handles the certificate.)

**How it's usually set up.** The app itself speaks plain HTTP on a private port (like 8080). In front of it sits a **reverse proxy** or **load balancer** (Nginx, Caddy, AWS ALB). It listens on 443, handles the certificate and encryption, then forwards the request to the app. This is called **TLS termination**.

```
Browser ──HTTPS :443──▶ [ Nginx / Load balancer ] ──HTTP :8080──▶ [ Your app ]
```

Usually port 80 stays open too, but only to **redirect** visitors to https.

**Check yourself**
1. What does the "S" in HTTPS add?
2. What is a certificate for?
3. Why is it risky to send a JWT over plain HTTP?
4. If an app only speaks HTTP, how can a site still be served over HTTPS?

---

## 3. How a web request flows (put it together)

Typing `https://myapp.com` into a browser:

1. **DNS** turns the name `myapp.com` into an IP address.
2. The browser connects to that IP on port 443.
3. HTTPS handshake (certificate, encryption).
4. The browser sends an **HTTP request**: `GET /todos` plus headers, such as `Authorization: Bearer <token>`.
5. The server runs your code, which may **query the database**.
6. The server sends back an **HTTP response**: a status code and data (JSON or HTML).

**Status codes to know:** `200` OK, `201` created, `400` bad request (your input is wrong), `401` not logged in, `403` logged in but not allowed, `404` not found, `500` server crashed.

**HTTP methods:** `GET` read, `POST` create, `PATCH`/`PUT` update, `DELETE` remove. These are what the todo API's endpoints use.

**Check yourself**
1. What does DNS do?
2. What's the difference between a 401 and a 404?
3. Which HTTP method would you use to add a new todo?

---

## 4. Databases: what they are and how they work

**The problem.** Programs forget everything when they stop. Our first version of the todo app stored todos in an array in memory, so restarting the server wiped them. A **database** is a program whose whole job is to store data safely on disk, find it quickly, and let many users read and write at the same time.

**Your app doesn't touch the files.** It sends a request to the database server (over a port, such as 5432) and the database does the work.

```
App ──"INSERT INTO todos ..."──▶ [ PostgreSQL server :5432 ] ──▶ files on disk
```

### Relational databases (SQL)

Data lives in **tables**, like spreadsheets: rows and columns with a fixed structure. Tables can be linked to each other.

```
users                          todos
id | email                     id | title        | user_id
1  | amy@x.com                 7  | Learn Docker | 1
2  | bo@x.com                  8  | Buy milk     | 2
```

`todos.user_id` points at `users.id`. That link is a **foreign key**.
You talk to them in **SQL**:
```sql
SELECT title FROM todos WHERE user_id = 1;
INSERT INTO todos (title, user_id) VALUES ('Read guide', 1);
```

Examples: **PostgreSQL** (what we use), **MySQL/MariaDB**, SQL Server, Oracle, SQLite.

**Strengths:** strict structure, powerful queries across tables, **ACID transactions** (see below). Best default choice for most apps.

### ACID in plain English
If you transfer money, two things must happen: subtract from A *and* add to B. ACID means the database guarantees:
- **A**tomic: all steps happen, or none do.
- **C**onsistent: rules (like "email must be unique") are never broken.
- **I**solated: two users at once don't corrupt each other's work.
- **D**urable: once it says "saved", it survives a crash.

### Non-relational databases (NoSQL)

"NoSQL" is a group of different designs, not one thing.

| Type | How data looks | Example | Good for |
|---|---|---|---|
| **Document** | JSON-like documents | MongoDB, DynamoDB | Flexible data whose shape changes, e.g. product catalogues |
| **Key-value** | `key → value` | Redis, DynamoDB | Very fast lookups: caches, sessions, rate limits |
| **Wide-column** | Rows with many columns grouped by key | Cassandra | Huge write volumes, e.g. event logs |
| **Graph** | Nodes and relationships | Neo4j | Social networks, recommendations |
| **Time-series** | Values over time | InfluxDB, TimescaleDB | Metrics, sensor data |

### Which one do I pick?

| If you need… | Think about… |
|---|---|
| Users, orders, anything with relationships and rules | PostgreSQL / MySQL |
| Super-fast temporary data (cache, sessions) | Redis |
| Flexible documents that vary a lot | MongoDB |
| A tiny local app or a mobile app | SQLite (a single file, no server) |

Beginners often hear "NoSQL is more modern". It isn't better, just different. When unsure, start with PostgreSQL.

### Other words you'll hear
- **Primary key**: a column that uniquely identifies each row (our `id`).
- **Index**: like a book's index; makes lookups faster.
- **Migration**: a scripted change to the table structure (our `initSchema` does a simple version).
- **Connection pool**: a set of ready-made connections the app reuses (our `pg.Pool`).
- **Backup**: a copy you can restore from. If you don't have one, you don't have your data.
- **Managed database**: the cloud provider runs it for you (AWS **RDS**), so you don't maintain it yourself.

**Check yourself**
1. Why did restarting the app wipe the data in the first version?
2. What is a foreign key? Find one in our `todos` table.
3. What does "atomic" mean in ACID? Give an example where it matters.
4. You're building a chat app's login-session store, needing very fast lookups. Which database type and why?
5. Why do we store a password *hash* and not the password?

---

## 5. Containers and Docker

- A **container** is a packaged program with everything it needs to run (code, runtime, libraries), isolated from the rest of your computer. It runs the same everywhere, which solves "it works on my machine".
- Unlike a **virtual machine**, a container shares the host's operating system kernel, so it's small and starts in seconds.
- An **image** is the recipe/template; a **container** is a running copy of it. One image can run as many containers.
- A **volume** is storage that lives *outside* the container, so data survives when the container is deleted. Our database uses one (`pgdata`).
- **Docker Compose** runs several containers as one app, defined in `docker-compose.yml`. In ours: the app, the database and Adminer.
- Containers on the same Compose network find each other by **service name** (`db`), not `localhost`. Inside a container, `localhost` means *that container itself*.

**Check yourself**
1. Image vs container?
2. What would happen to our database data if we had no volume and removed the container?
3. Why is the database server `db` and not `localhost` when logging into Adminer?

---

## 6. Where to read more (free)

- Docker: *Get started* — https://docs.docker.com/get-started/
- HTTP basics: MDN, "An overview of HTTP" — https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview
- HTTPS: Cloudflare Learning Center, "What is HTTPS?" — https://www.cloudflare.com/learning/ssl/what-is-https/
- PostgreSQL tutorial — https://www.postgresql.org/docs/current/tutorial.html
- SQL practice in the browser — https://sqlbolt.com/
- Ports and networking, "What is a port?" — search for it on the Cloudflare Learning Center

---

## Your task

1. Read sections 1 to 4. Skim 5.
2. Write short answers to **at least 8** of the "Check yourself" questions, in your own words.
3. Write down **three things you didn't understand**. These matter more than the answers, and we'll start tonight with them.
