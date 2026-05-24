The easiest way to test Chroma is with a **5-minute end-to-end example**.

## Step 1: Create a test file

Create `test_chroma.py`

```python
import chromadb

# Local Chroma DB
client = chromadb.PersistentClient(path="./chroma_db")

# Create collection
collection = client.get_or_create_collection(
    name="stories"
)

# Add sample data
collection.add(
    ids=["1", "2", "3"],
    documents=[
        "Tommy learns to brush his teeth every morning",
        "Lucy learns healthy eating habits",
        "Sam learns the importance of sharing toys"
    ]
)

print("Data inserted")
```

Run:

```bash
python test_chroma.py
```

Expected:

```text
Data inserted
```

---

## Step 2: Verify Storage

You should now see:

```text
project/

├── chroma_db/
│   ├── chroma.sqlite3
│   └── ...
```

This means Chroma persisted data locally.

---

## Step 3: Query Similar Content

Create `search_chroma.py`

```python
import chromadb

client = chromadb.PersistentClient(
    path="./chroma_db"
)

collection = client.get_collection(
    name="stories"
)

results = collection.query(
    query_texts=[
        "story about brushing teeth"
    ],
    n_results=2
)

print(results)
```

Run:

```bash
python search_chroma.py
```

Expected output:

```text
Tommy learns to brush his teeth every morning
```

should be the top match.

---

## Step 4: Pretty Print Results

```python
import chromadb

client = chromadb.PersistentClient(
    path="./chroma_db"
)

collection = client.get_collection(
    name="stories"
)

results = collection.query(
    query_texts=[
        "story about brushing teeth"
    ],
    n_results=3
)

for doc in results["documents"][0]:
    print(doc)
```

Output:

```text
Tommy learns to brush his teeth every morning

Lucy learns healthy eating habits

Sam learns the importance of sharing toys
```

---

## Step 5: Add Metadata

This is useful for your AI book project.

```python
collection.add(
    ids=["4"],
    documents=[
        "Maya learns to brush teeth before sleeping"
    ],
    metadatas=[
        {
            "type": "habit_book",
            "age": 5
        }
    ]
)
```

---

## Step 6: Filter by Metadata

```python
results = collection.query(
    query_texts=["teeth brushing"],
    where={"type": "habit_book"},
    n_results=5
)

print(results)
```

---

# Real Use Case for Your Product

Store:

```python
collection.add(
    ids=["habit_001"],
    documents=[
        """
        Tommy brushes his teeth every morning.
        """
    ],
    metadatas=[
        {
            "category": "habit_book",
            "topic": "brushing_teeth",
            "age": 5
        }
    ]
)
```

User asks:

```text
Create a brushing habit story for a 4-year-old.
```

Search:

```python
results = collection.query(
    query_texts=[
        "brushing habit story"
    ],
    n_results=3
)
```

If a similar story exists, reuse and customize it instead of generating everything from scratch.

---

# Useful Chroma Inspection Commands

List collections:

```python
client.list_collections()
```

Get collection:

```python
client.get_collection("stories")
```

Count documents:

```python
collection.count()
```

Get all documents:

```python
data = collection.get()
print(data)
```

Delete collection:

```python
client.delete_collection("stories")
```

For your MVP, the most important test is:

```text
Insert 3 stories
↓
Search "brushing teeth"
↓
Verify the brushing story ranks first
```

If that works, Chroma retrieval is functioning correctly.
