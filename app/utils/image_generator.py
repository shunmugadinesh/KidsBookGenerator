import os
import base64
import urllib.parse
import httpx
import io
from fastapi import HTTPException

async def _generate_with_pollinations(prompt: str) -> dict:
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

async def generate_image(prompt: str, image: str | None = None, model: str = "pollinations") -> dict:
    if model == "pollinations":
        try:
            return await _generate_with_pollinations(prompt)
        except Exception as e:
            print(f"POLLINATIONS ERROR: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    elif model == "huggingface":
        from huggingface_hub import InferenceClient
        hugging_key = os.getenv("HUGGING_API_KEY")
        if not hugging_key:
            raise HTTPException(status_code=500, detail="HUGGING_API_KEY not found in environment.")

        try:
            if image:
                print("HF: Using fal-ai provider with FLUX.1-Kontext-dev for image-to-image")
                client = InferenceClient(provider="fal-ai", api_key=hugging_key)
                base64_data = image
                if "," in base64_data:
                    base64_data = base64_data.split(",")[1]
                input_image_bytes = base64.b64decode(base64_data)

                img_res = client.image_to_image(
                    image=input_image_bytes,
                    prompt=prompt,
                    model="black-forest-labs/FLUX.1-Kontext-dev",
                )
            else:
                print("HF: Using wavespeed provider with FLUX.1-dev for text-to-image")
                client = InferenceClient(provider="wavespeed", api_key=hugging_key)
                img_res = client.text_to_image(
                    prompt,
                    model="black-forest-labs/FLUX.1-dev",
                )

            buffered = io.BytesIO()
            img_res.save(buffered, format="PNG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            return {"status": "success", "image": f"data:image/png;base64,{img_base64}"}

        except Exception as e:
            print(f"HUGGING FACE ERROR: {e}")
            if image:
                print("HF failed with image input. Trying Gemini as fallback...")
                try:
                    gemini_api_key = os.getenv("GEMINI_API_KEY")
                    if gemini_api_key:
                        gemini_model = "gemini-2.5-flash-image"
                        gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={gemini_api_key}"
                        gemini_prompt = f"Recreate this scene using the provided image of the child as a reference character. Adhere strictly to these stylistic and composition requirements:\n\n{prompt}"
                        
                        gbase64 = image
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
                                        return {"status": "success", "image": f"data:image/png;base64,{gpart['inlineData']['data']}", "used_fallback": "gemini"}
                    print("Gemini fallback also failed or no API key. Trying Pollinations...")
                except Exception as gemini_err:
                    print(f"GEMINI FALLBACK ERROR: {gemini_err}")

            print("Falling back to Pollinations (text-to-image only)...")
            try:
                res = await _generate_with_pollinations(prompt)
                res["used_fallback"] = "pollinations"
                return res
            except Exception as fallback_err:
                print(f"POLLINATIONS FALLBACK ERROR: {fallback_err}")
                raise HTTPException(status_code=500, detail=f"HuggingFace failed: {str(e)}. Fallbacks also failed.")

    elif model == "gemini":
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY not found in environment.")

        model_name = "gemini-2.5-flash-image"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

        if image:
            gemini_prompt = f"Recreate this scene using the provided image of the child as a reference character. Adhere strictly to these stylistic and composition requirements:\n\n{prompt}"
        else:
            gemini_prompt = f"Generate this scene adhering strictly to these stylistic and composition requirements:\n\n{prompt}"

        payload = {
            "contents": [{"parts": [{"text": gemini_prompt}]}],
            "generationConfig": {"responseModalities": ["IMAGE"]},
        }

        if image:
            base64_data = image
            if "," in base64_data:
                base64_data = base64_data.split(",")[1]
            payload["contents"][0]["parts"].append({"inlineData": {"mimeType": "image/jpeg", "data": base64_data}})

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=60.0)
                data = response.json()
                if response.status_code != 200:
                    raise Exception(data.get("error", {}).get("message", "Gemini generation failed"))
                parts = data["candidates"][0]["content"]["parts"]
                for part in parts:
                    if "inlineData" in part:
                        return {"status": "success", "image": f"data:image/png;base64,{part['inlineData']['data']}"}
                raise Exception("No image data returned from Gemini API.")
        except Exception as e:
            print(f"GEMINI ERROR: {e}")
            print("Falling back to Pollinations for text-to-image...")
            try:
                res = await _generate_with_pollinations(prompt)
                res["used_fallback"] = "pollinations"
                return res
            except Exception as fallback_err:
                print(f"POLLINATIONS FALLBACK ERROR: {fallback_err}")
                raise HTTPException(status_code=500, detail=f"Gemini failed: {str(e)}. Pollinations fallback also failed.")

    else:
        print(f"Unknown model '{model}', falling back to Pollinations")
        try:
            res = await _generate_with_pollinations(prompt)
            res["used_fallback"] = "pollinations"
            return res
        except Exception as e:
            print(f"POLLINATIONS FALLBACK ERROR: {e}")
            raise HTTPException(status_code=500, detail=str(e))
