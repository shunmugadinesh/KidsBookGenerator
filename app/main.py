# app/main.py
from app.data import LETTERS_DATA
from app.prompts import generate_prompt
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Book Generator API")


# Mount React build files
app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")


@app.get("/")
def read_ui():
    return FileResponse("frontend/dist/index.html")


class ImageGenerationRequest(BaseModel):
    prompt: str
    image: str | None = None  # Base64 image data
    model: str = "pollinations"


@app.post("/generate-image")
async def generate_image_endpoint(request: ImageGenerationRequest):

    # --- Helper: Pollinations fallback (text-to-image only) ---
    async def _generate_with_pollinations(prompt: str) -> dict:
        import urllib.parse
        import base64

        pollinations_key = os.getenv("POLLINATIONS_API_KEY")
        encoded_prompt = urllib.parse.quote(prompt)

        url = f"https://gen.pollinations.ai/image/{encoded_prompt}?width=1024&height=1024"
        if pollinations_key:
            url += f"&key={pollinations_key}"

        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=60.0)
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Pollinations failed (Status: {response.status_code})"
                )

            img_base64 = base64.b64encode(response.content).decode('utf-8')
            return {
                "status": "success",
                "image": f"data:image/png;base64,{img_base64}"
            }

    # =========================================================
    # 1. POLLINATIONS — Text-to-Image only (free, no key needed)
    # =========================================================
    if request.model == "pollinations":
        try:
            return await _generate_with_pollinations(request.prompt)
        except Exception as e:
            print(f"POLLINATIONS ERROR: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    # =========================================================
    # 2. HUGGING FACE — Supports both Text-to-Image & Image-to-Image
    #    - Image-to-Image: fal-ai provider + FLUX.1-Kontext-dev
    #    - Text-to-Image:  wavespeed provider + FLUX.1-dev
    #    - Falls back to Pollinations on any HF error
    # =========================================================
    elif request.model == "huggingface":
        from huggingface_hub import InferenceClient
        import io
        import base64

        hugging_key = os.getenv("HUGGING_API_KEY")
        if not hugging_key:
            raise HTTPException(status_code=500, detail="HUGGING_API_KEY not found in environment.")

        try:
            if request.image:
                # --- Image-to-Image: Use fal-ai + FLUX.1-Kontext-dev ---
                print("HF: Using fal-ai provider with FLUX.1-Kontext-dev for image-to-image")
                client = InferenceClient(
                    provider="fal-ai",
                    api_key=hugging_key,
                )

                base64_data = request.image
                if "," in base64_data:
                    base64_data = base64_data.split(",")[1]
                input_image_bytes = base64.b64decode(base64_data)

                image = client.image_to_image(
                    image=input_image_bytes,
                    prompt=request.prompt,
                    model="black-forest-labs/FLUX.1-Kontext-dev",
                )
            else:
                # --- Text-to-Image: Use wavespeed + FLUX.1-dev ---
                print("HF: Using wavespeed provider with FLUX.1-dev for text-to-image")
                client = InferenceClient(
                    provider="wavespeed",
                    api_key=hugging_key,
                )

                image = client.text_to_image(
                    request.prompt,
                    model="black-forest-labs/FLUX.1-dev",
                )

            buffered = io.BytesIO()
            image.save(buffered, format="PNG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

            return {
                "status": "success",
                "image": f"data:image/png;base64,{img_base64}"
            }

        except Exception as e:
            # --- Fallback chain on HF failure (likely rate-limited) ---
            print(f"HUGGING FACE ERROR: {e}")

            # Try Gemini first if image was provided (Gemini supports image+text)
            if request.image:
                print("HF failed with image input. Trying Gemini as fallback (supports image+text)...")
                try:
                    import base64 as b64_mod
                    gemini_api_key = os.getenv("GEMINI_API_KEY")
                    if gemini_api_key:
                        gemini_model = "gemini-2.5-flash-image"
                        gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={gemini_api_key}"
                        gemini_prompt = f"Recreate this scene using the provided image of the child as a reference character. Adhere strictly to these stylistic and composition requirements:\n\n{request.prompt}"
                        
                        gbase64 = request.image
                        if "," in gbase64:
                            gbase64 = gbase64.split(",")[1]
                        
                        gpayload = {
                            "contents": [{"parts": [
                                {"text": gemini_prompt},
                                {"inlineData": {"mimeType": "image/jpeg", "data": gbase64}}
                            ]}],
                            "generationConfig": {"responseModalities": ["IMAGE"]},
                        }
                        async with httpx.AsyncClient() as gclient:
                            gresp = await gclient.post(gemini_url, json=gpayload, timeout=60.0)
                            gdata = gresp.json()
                            if gresp.status_code == 200:
                                gparts = gdata["candidates"][0]["content"]["parts"]
                                for gpart in gparts:
                                    if "inlineData" in gpart:
                                        return {
                                            "status": "success",
                                            "image": f"data:image/png;base64,{gpart['inlineData']['data']}",
                                        }
                    print("Gemini fallback also failed or no API key. Trying Pollinations (text-only)...")
                except Exception as gemini_err:
                    print(f"GEMINI FALLBACK ERROR: {gemini_err}")

            # Last resort: Pollinations (text-to-image only, no image reference)
            print("Falling back to Pollinations (text-to-image only, image reference will be lost)...")
            try:
                return await _generate_with_pollinations(request.prompt)
            except Exception as fallback_err:
                print(f"POLLINATIONS FALLBACK ERROR: {fallback_err}")
                raise HTTPException(
                    status_code=500,
                    detail=f"HuggingFace failed: {str(e)}. All fallbacks also failed."
                )

    # =========================================================
    # 3. GEMINI — Supports both Text-to-Image & Image+Text    
    # =========================================================
    elif request.model == "gemini":
        import base64

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY not found in environment.")

        model_name = "gemini-2.5-flash-image"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

        if request.image:
            gemini_prompt = f"Recreate this scene using the provided image of the child as a reference character. Adhere strictly to these stylistic and composition requirements:\n\n{request.prompt}"
        else:
            gemini_prompt = f"Generate this scene adhering strictly to these stylistic and composition requirements:\n\n{request.prompt}"

        payload = {
            "contents": [{"parts": [{"text": gemini_prompt}]}],
            "generationConfig": {"responseModalities": ["IMAGE"]},
        }

        if request.image:
            base64_data = request.image
            if "," in base64_data:
                base64_data = base64_data.split(",")[1]
            payload["contents"][0]["parts"].append(
                {"inlineData": {"mimeType": "image/jpeg", "data": base64_data}}
            )

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=60.0)
                data = response.json()

                if response.status_code != 200:
                    raise Exception(data.get("error", {}).get("message", "Gemini generation failed"))

                parts = data["candidates"][0]["content"]["parts"]
                for part in parts:
                    if "inlineData" in part:
                        img_data = part["inlineData"]["data"]
                        return {
                            "status": "success",
                            "image": f"data:image/png;base64,{img_data}",
                        }

                raise Exception("No image data returned from Gemini API.")

        except Exception as e:
            # --- Fallback to Pollinations on Gemini failure ---
            print(f"GEMINI ERROR: {e}")
            print("Falling back to Pollinations for text-to-image...")
            try:
                return await _generate_with_pollinations(request.prompt)
            except Exception as fallback_err:
                print(f"POLLINATIONS FALLBACK ERROR: {fallback_err}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Gemini failed: {str(e)}. Pollinations fallback also failed: {str(fallback_err)}"
                )

    # =========================================================
    # 4. Unknown model — fallback to Pollinations
    # =========================================================
    else:
        print(f"Unknown model '{request.model}', falling back to Pollinations")
        try:
            return await _generate_with_pollinations(request.prompt)
        except Exception as e:
            print(f"POLLINATIONS FALLBACK ERROR: {e}")
            raise HTTPException(status_code=500, detail=str(e))




class ChildProfile(BaseModel):
    name: str
    age: int
    language: str
    gender: str = "boy"
    skin_tone: str = "warm golden brown"
    hair_color: str = "black"
    hair_style: str = "short curly"
    eye_color: str = "dark brown"
    outfit_color: str = "bright red"


@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Book Generator API. Use /docs to see the endpoints."
    }


@app.post("/generate-prompt/{letter}")
def get_prompt(letter: str, profile: ChildProfile):
    prompt = generate_prompt(
        name=profile.name,
        age=profile.age,
        language=profile.language,
        gender=profile.gender,
        skin_tone=profile.skin_tone,
        hair_color=profile.hair_color,
        hair_style=profile.hair_style,
        eye_color=profile.eye_color,
        outfit_color=profile.outfit_color,
        letter=letter,
    )
    return {"letter": letter.upper(), "prompt": prompt}


@app.post("/generate-book")
def get_book_prompts(profile: ChildProfile):
    prompts = {}
    for item in LETTERS_DATA:
        letter = item["l"]
        prompts[letter] = generate_prompt(
            name=profile.name,
            age=profile.age,
            language=profile.language,
            gender=profile.gender,
            skin_tone=profile.skin_tone,
            hair_color=profile.hair_color,
            hair_style=profile.hair_style,
            eye_color=profile.eye_color,
            outfit_color=profile.outfit_color,
            letter=letter,
        )
    return {"prompts": prompts}
