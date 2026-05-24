# PostgreSQL Docker + psql + Adminer Guide

## Check PostgreSQL Container
```bash
docker ps
docker port ai_books_postgres
```

Example:
```text
5432/tcp -> 0.0.0.0:5433
```

## Connect using psql
```bash
docker exec -it ai_books_postgres psql -U admin -d ai_books
```

Exit:
```sql
\q
```

## Useful psql Commands

List databases:
```sql
\l
```

Connect database:
```sql
\c ai_books
```

Current database:
```sql
SELECT current_database();
```

Current user:
```sql
SELECT current_user;
```

List schemas:
```sql
\dn
```

List tables:
```sql
\dt
```

Describe table:
```sql
\d users
```

Detailed table:
```sql
\d+ users
```

Disable pager:
```sql
\pset pager off
```

## DML Examples

Create table:
```sql
CREATE TABLE users (
 id SERIAL PRIMARY KEY,
 name VARCHAR(100),
 email VARCHAR(255)
);
```

Insert:
```sql
INSERT INTO users(name,email)
VALUES ('Dinesh','d@test.com');
```

Select:
```sql
SELECT * FROM users;
```

Update:
```sql
UPDATE users
SET email='new@test.com'
WHERE id=1;
```

Delete:
```sql
DELETE FROM users
WHERE id=1;
```

## Metadata Queries

List tables:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema='public';
```

List columns:
```sql
SELECT table_name,column_name,data_type
FROM information_schema.columns;
```

## Find PostgreSQL Details

```bash
docker inspect ai_books_postgres | findstr POSTGRES
```

## Adminer Connection

```bash
Default URL: http://localhost:8080/
System: PostgreSQL
Server: host.docker.internal:5433
Username: admin
Password: <your_password>
Database: ai_books
```
## AI Book App Architecture

FastAPI
 -> PostgreSQL
 -> Local folders (images/audio/videos)
 -> ChromaDB
