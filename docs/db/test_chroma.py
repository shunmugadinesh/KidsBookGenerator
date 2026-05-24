import chromadb

# Local Chroma DB
# client = chromadb.PersistentClient(path="./chroma_db")

# Create collection
# collection = client.get_or_create_collection(
#     name="stories"
# )

# #Add data
# collection.add(
#     ids=["1", "2", "3"],
#     documents=[
#         "Tommy learns to brush his teeth every morning",
#         "Lucy learns healthy eating habits",
#         "Sam learns the importance of sharing toys"
#     ]
# )
import chromadb

# Connecting from outside Docker (Host machine):
client = chromadb.HttpClient(host="localhost", port=8005)

# Connecting from inside another container in the Docker stack:
# client = chromadb.HttpClient(host="chromadb", port=8000)

# collection = client.get_or_create_collection(
#     name="story_templates"
# )
# print(collection.list())
collection = client.get_collection(
    name="story_templates"
)
#print list of collections
print(client.list_collections())

# return only stories that are more than 85% similar
#vector embedding distance (0 to 1; 0 = identical, 1 = orthogonal)
results = collection.query(
    query_texts=[
        "brushing teeth"
    ],
    n_results=2
)
# # threshold = 0.85
# # filtered = [r for r in results if 1 - float(r["distance"]) >= threshold]


print(results)