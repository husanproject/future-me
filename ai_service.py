"""
FutureMe AI — AI Image Generation Service
Modular architecture supporting multiple AI providers.

Providers:
- DemoImageGenerator: OpenCV/NumPy advanced procedural face aging engine (wrinkles, eye bags, grey hair, sagging)
- HuggingFaceGenerator: Free Hugging Face Inference API with Image-to-Image / Prompt support
- StabilityGenerator: Stability AI SDXL API
"""
import os
import io
import uuid
import shutil
import httpx
import asyncio
from typing import List
from abc import ABC, abstractmethod
from PIL import Image, ImageDraw, ImageFont
from dotenv import load_dotenv

from face_aging_engine import apply_face_aging
from face_fx_engine import apply_face_fx

load_dotenv()

GENERATED_DIR = os.path.join(os.path.dirname(__file__), "generated")
os.makedirs(GENERATED_DIR, exist_ok=True)


class AIImageGenerator(ABC):
    """Abstract base class for AI image generators."""
    
    @abstractmethod
    async def generate_future_face(
        self,
        original_image_path: str,
        prompt: str,
        negative_prompt: str,
        num_variations: int = 4,
        params: dict = None
    ) -> list[str]:
        """
        Generate future face variations.
        Returns list of file paths to generated images.
        """
        pass
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass
    
    @property
    def is_demo(self) -> bool:
        return False


class DemoImageGenerator(AIImageGenerator):
    """
    Demo generator that applies high-quality procedural face transformations:
    - Face aging (wrinkles, eye bags, hair greying, stubble)
    - Face FX (Hair Color, Eye Color, Skin Tone, Clown Red Nose, Hats, Glasses, Accessories)
    """
    def __init__(self):
        super().__init__()
        self._provider_name = "FaceFX Local Engine (Demo & Styles)"
        self._is_demo = True

    @property
    def provider_name(self) -> str:
        return self._provider_name
    
    @property
    def is_demo(self) -> bool:
        return self._is_demo
    
    async def generate_future_face(
        self,
        original_image_path: str,
        prompt: str,
        negative_prompt: str = "",
        num_variations: int = 1,
        params: dict = None
    ) -> List[str]:
        if not os.path.exists(original_image_path):
            raise FileNotFoundError(f"Original image not found: {original_image_path}")

        params = params or {}
        output_filenames = []
        
        hair_color = params.get("hairColor", "Original")
        eye_color = params.get("eyeColor", "Original")
        skin_tone = params.get("skinTone", "Original")
        accessory = params.get("accessory", "None")
        hat = params.get("hat", "None")
        glasses = params.get("glasses", "None")
        
        has_custom_fx = any([
            hair_color != "Original",
            eye_color != "Original",
            skin_tone != "Original",
            accessory != "None",
            hat != "None",
            glasses != "None"
        ])

        for i in range(num_variations):
            gen_id = uuid.uuid4().hex[:8]
            output_filename = f"fx_{gen_id}_{i+1}.jpg"
            output_path = os.path.join(GENERATED_DIR, output_filename)

            try:
                if has_custom_fx:
                    transformed_img = await asyncio.to_thread(
                        apply_face_fx,
                        image_path=original_image_path,
                        hair_color=hair_color,
                        eye_color=eye_color,
                        skin_tone=skin_tone,
                        accessory=accessory,
                        hat=hat,
                        glasses=glasses,
                        variation_seed=i
                    )
                else:
                    transformed_img = await asyncio.to_thread(
                        apply_face_aging,
                        image_path=original_image_path,
                        params=params,
                        variation_seed=i
                    )

                watermarked_img = self._add_demo_watermark(transformed_img)
                watermarked_img.save(output_path, "JPEG", quality=95)
                output_filenames.append(output_filename)

            except Exception as e:
                print(f"FaceFX generation error (variation {i+1}): {e}")
                shutil.copy(original_image_path, output_path)
                output_filenames.append(output_filename)

        return output_filenames
    
    def _add_demo_watermark(self, img: Image.Image) -> Image.Image:
        """Add demo mode watermark."""
        draw = ImageDraw.Draw(img)
        text = "DEMO MODE"
        w, h = img.size
        
        overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        
        try:
            font = ImageFont.truetype("arial.ttf", 26)
        except (IOError, OSError):
            font = ImageFont.load_default()
        
        bbox = overlay_draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        x = w - tw - 20
        y = h - th - 20
        
        padding = 8
        overlay_draw.rectangle(
            [x - padding, y - padding, x + tw + padding, y + th + padding],
            fill=(0, 0, 0, 140)
        )
        overlay_draw.text((x, y), text, fill=(255, 200, 0, 220), font=font)
        
        img = img.convert("RGBA")
        img = Image.alpha_composite(img, overlay)
        return img.convert("RGB")


class HuggingFaceGenerator(AIImageGenerator):
    """Hugging Face Inference API generator."""
    
    def __init__(self):
        self.api_token = os.getenv("HF_API_TOKEN", "")
        self.model = os.getenv("HF_MODEL", "stabilityai/stable-diffusion-xl-base-1.0")
        self.api_url = f"https://api-inference.huggingface.co/models/{self.model}"
    
    @property
    def provider_name(self) -> str:
        return "huggingface"
    
    async def generate_future_face(
        self,
        original_image_path: str,
        prompt: str,
        negative_prompt: str,
        num_variations: int = 4,
        params: dict = None
    ) -> list[str]:
        if not self.api_token:
            raise ValueError("HF_API_TOKEN is not configured in .env")
        
        generated_paths = []
        headers = {"Authorization": f"Bearer {self.api_token}"}
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            tasks = []
            for i in range(num_variations):
                variation_prompt = f"{prompt}, portrait variation {i+1}"
                payload = {
                    "inputs": variation_prompt,
                    "parameters": {
                        "negative_prompt": negative_prompt,
                        "num_inference_steps": 30,
                        "guidance_scale": 7.5,
                        "width": 768,
                        "height": 768
                    }
                }
                tasks.append(self._generate_single(client, headers, payload))
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in results:
                if isinstance(result, Exception):
                    print(f"HF Generation error: {result}")
                    continue
                if result:
                    generated_paths.append(result)
        
        if not generated_paths:
            raise RuntimeError("All image generations failed. Check your HF_API_TOKEN.")
        
        return generated_paths
    
    async def _generate_single(self, client: httpx.AsyncClient, headers: dict, payload: dict) -> str:
        response = await client.post(self.api_url, headers=headers, json=payload)
        
        if response.status_code == 503:
            await asyncio.sleep(15)
            response = await client.post(self.api_url, headers=headers, json=payload)
        
        if response.status_code != 200:
            raise RuntimeError(f"HuggingFace API error {response.status_code}: {response.text[:200]}")
        
        img = Image.open(io.BytesIO(response.content))
        filename = f"hf_{uuid.uuid4().hex[:12]}.jpg"
        filepath = os.path.join(GENERATED_DIR, filename)
        img.save(filepath, "JPEG", quality=92)
        return filename


class StabilityGenerator(AIImageGenerator):
    """Stability AI API generator."""
    
    def __init__(self):
        self.api_key = os.getenv("STABILITY_API_KEY", "")
        self.api_url = os.getenv(
            "STABILITY_API_URL",
            "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image"
        )
    
    @property
    def provider_name(self) -> str:
        return "stability"
    
    async def generate_future_face(
        self,
        original_image_path: str,
        prompt: str,
        negative_prompt: str,
        num_variations: int = 4,
        params: dict = None
    ) -> list[str]:
        if not self.api_key:
            raise ValueError("STABILITY_API_KEY is not configured in .env")
        
        generated_paths = []
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        payload = {
            "text_prompts": [
                {"text": prompt, "weight": 1},
                {"text": negative_prompt, "weight": -1}
            ],
            "cfg_scale": 7,
            "height": 1024,
            "width": 1024,
            "samples": num_variations,
            "steps": 30,
            "style_preset": "photographic"
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(self.api_url, headers=headers, json=payload)
            
            if response.status_code != 200:
                raise RuntimeError(f"Stability API error {response.status_code}: {response.text[:200]}")
            
            data = response.json()
            import base64
            
            for artifact in data.get("artifacts", []):
                img_bytes = base64.b64decode(artifact["base64"])
                img = Image.open(io.BytesIO(img_bytes))
                filename = f"stab_{uuid.uuid4().hex[:12]}.jpg"
                filepath = os.path.join(GENERATED_DIR, filename)
                img.save(filepath, "JPEG", quality=92)
                generated_paths.append(filename)
        
        return generated_paths


def get_generator() -> AIImageGenerator:
    """Factory function to get the configured AI generator."""
    provider = os.getenv("AI_PROVIDER", "demo").lower().strip()
    
    if provider == "huggingface":
        token = os.getenv("HF_API_TOKEN", "").strip()
        if token:
            return HuggingFaceGenerator()
        print("WARNING: HF_API_TOKEN not set, falling back to demo mode.")
        return DemoImageGenerator()
    
    elif provider == "stability":
        key = os.getenv("STABILITY_API_KEY", "").strip()
        if key:
            return StabilityGenerator()
        print("WARNING: STABILITY_API_KEY not set, falling back to demo mode.")
        return DemoImageGenerator()
    
    return DemoImageGenerator()
