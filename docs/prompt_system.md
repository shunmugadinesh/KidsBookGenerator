# ABCD Book Prompt System

This project automates the generation of image prompts for personalized children's books.

## Current Phase: Base Prompt Filling
In this phase, the system uses pre-defined scene descriptions extracted from `abcd_book_prompts_AZ.html` and fills them with the child's profile details.

## Next Phase: AI Generation
In the next phase, we will use **CrewAI** and **Ollama (Qwen3:1.7b)** to dynamically generate creative scenes for each letter based on the child's profile.

### How to use
Send a POST request to `/generate-book` with the following JSON body:

```json
{
  "name": "Shantu",
  "age": 3,
  "language": "English",
  "gender": "boy",
  "skin_tone": "brown",
  "hair_color": "black",
  "hair_style": "curly",
  "eye_color": "black",
  "outfit_color": "red"
}
```

The response will be a JSON object containing prompts for all letters A-Z.
