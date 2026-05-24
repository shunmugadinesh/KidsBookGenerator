# AI Book & Video Generator - Database Setup (MVP)

## Recommended Architecture

``` text
FastAPI
   |
PostgreSQL
   |
Local Storage
├── images/
├── audio/
└── videos/
   |
ChromaDB
```

## Components

### PostgreSQL

Stores: - Users - Projects - Stories - Agent outputs - Prompts -
Ratings - Metadata

### Local Storage

Stores: - Generated images - Audio files - Videos - PDFs

### ChromaDB

Stores: - Embeddings - Similar stories - Prompt retrieval - Template
matching

------------------------------------------------------------------------

## Folder Structure

``` text
project/

├── backend/
├── chroma_db/
├── images/
├── audio/
├── videos/
├── postgres_data/
├── docker-compose.yml
└── .env
```

------------------------------------------------------------------------

## Docker Compose

``` yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    container_name: ai_books_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ai_books
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin123
    ports:
      - "5432:5432"
    volumes:
      - ./postgres_data:/var/lib/postgresql/data
```

------------------------------------------------------------------------

## Core Tables

### users

``` sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### projects

``` sql
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    title VARCHAR(255),
    project_type VARCHAR(100),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### stories

``` sql
CREATE TABLE stories (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id),
    story_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### images

``` sql
CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id),
    image_prompt TEXT,
    image_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### videos

``` sql
CREATE TABLE videos (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id),
    video_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

------------------------------------------------------------------------

## Chroma Collections

### story_templates

Stores successful story templates.

### image_prompts

Stores successful image prompts.

### habit_books

Stores habit-book embeddings.

### rhyme_books

Stores rhyme-book embeddings.

------------------------------------------------------------------------

## Retrieval Flow

1.  User requests a story.
2.  Search Chroma for similar content.
3.  If match found:
    -   Reuse template.
    -   Personalize.
4.  If no match:
    -   Generate with agents.
    -   Save to PostgreSQL.
    -   Create embedding.
    -   Store in Chroma.

------------------------------------------------------------------------

## Future Upgrade

``` text
FastAPI
   |
PostgreSQL
   |
MinIO
   |
Qdrant
```

When: - 100+ active users - Large video library - Multi-server
deployment
