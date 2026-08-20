"""
FutureMe AI — Main FastAPI Application
"""
import os
import uuid
import shutil
import asyncio
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse, FileResponse
from fastapi.requests import Request
from dotenv import load_dotenv

from database import init_db, save_generation, get_all_generations, get_generation, delete_generation
from ai_service import get_generator
from prompt_builder import build_prompt, build_future_profile

load_dotenv()

# ── Directories ──────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
GENERATED_DIR = BASE_DIR / "generated"
STATIC_DIR = BASE_DIR / "static"

UPLOAD_DIR.mkdir(exist_ok=True)
GENERATED_DIR.mkdir(exist_ok=True)

MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10")) * 1024 * 1024
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}

# ── App ──────────────────────────────────────────────────────
app = FastAPI(title="FutureMe AI", version="1.0.0")

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

# Initialize database
init_db()

# Get AI generator
generator = get_generator()


# ── Routes ───────────────────────────────────────────────────

@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse("index.html", {
        "request": request,
        "ai_provider": generator.provider_name,
        "is_demo": generator.is_demo
    })


@app.get("/api/status")
async def api_status():
    return {
        "status": "ok",
        "ai_provider": generator.provider_name,
        "is_demo": generator.is_demo
    }


@app.post("/api/upload")
async def upload_photo(file: UploadFile = File(...)):
    # Validate extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")
    
    # Read contents with size check
    contents = await file.read()
    if len(contents) > MAX_UPLOAD_SIZE:
        raise HTTPException(400, f"File too large. Maximum size: {MAX_UPLOAD_SIZE // (1024*1024)}MB")
    
    # Validate it's actually an image
    try:
        from PIL import Image
        import io
        img = Image.open(io.BytesIO(contents))
        img.verify()
    except Exception:
        raise HTTPException(400, "Invalid image file. Please upload a valid JPG or PNG image.")
    
    # Save with sanitized filename
    safe_name = f"{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / safe_name
    with open(filepath, "wb") as f:
        f.write(contents)
    
    return {
        "success": True,
        "filename": safe_name,
        "original_name": file.filename,
        "size": len(contents),
        "url": f"/api/uploads/{safe_name}"
    }


@app.get("/api/uploads/{filename}")
async def serve_upload(filename: str):
    # Sanitize filename to prevent path traversal
    safe = Path(filename).name
    filepath = UPLOAD_DIR / safe
    if not filepath.exists():
        raise HTTPException(404, "File not found")
    return FileResponse(str(filepath))


@app.get("/api/generated/{filename}")
async def serve_generated(filename: str):
    safe = Path(filename).name
    filepath = GENERATED_DIR / safe
    if not filepath.exists():
        raise HTTPException(404, "File not found")
    return FileResponse(str(filepath))


@app.post("/api/generate")
async def generate_future(request: Request):
    data = await request.json()
    
    uploaded_filename = data.get("uploadedFile")
    params = data.get("params", {})
    
    if not uploaded_filename:
        raise HTTPException(400, "No uploaded file specified")
    
    # Validate uploaded file exists
    upload_path = UPLOAD_DIR / Path(uploaded_filename).name
    if not upload_path.exists():
        raise HTTPException(400, "Uploaded file not found. Please upload again.")
    
    # Validate parameters
    current_age = params.get("currentAge")
    future_age = params.get("futureAge")
    if not current_age or not future_age:
        raise HTTPException(400, "Current age and future age are required")
    if int(future_age) <= int(current_age):
        raise HTTPException(400, "Future age must be greater than current age")
    
    # Build prompts
    prompts = build_prompt(params)
    
    # Generate images
    try:
        generated_files = await generator.generate_future_face(
            original_image_path=str(upload_path),
            prompt=prompts["positive"],
            negative_prompt=prompts["negative"],
            num_variations=4,
            params=params
        )
    except Exception as e:
        raise HTTPException(500, f"Generation failed: {str(e)}")
    
    # Build future profile
    future_profile = build_future_profile(params)
    
    # Save to history
    gen_id = save_generation(
        original_filename=uploaded_filename,
        original_path=str(upload_path),
        generated_paths=generated_files,
        params=params,
        prompt=prompts["positive"],
        negative_prompt=prompts["negative"],
        ai_provider=generator.provider_name
    )
    
    return {
        "success": True,
        "id": gen_id,
        "generated_images": [f"/api/generated/{f}" for f in generated_files],
        "prompt": prompts["positive"],
        "ai_provider": generator.provider_name,
        "is_demo": generator.is_demo,
        "future_profile": future_profile,
        "params": params
    }


@app.post("/api/generate_grid")
async def generate_grid(
    image_filename: str = Form(...),
    lifestyle: str = Form("Normal"),
    fitness: str = Form("Average"),
    facial_hair: str = Form("Auto")
):
    """
    Generate 6-stage age progression grid (18, 25, 30, 35, 40, 50 yosh) concurrently.
    """
    upload_path = UPLOAD_DIR / image_filename
    if not upload_path.exists():
        raise HTTPException(400, "Original image not found")
    
    target_ages = [18, 25, 30, 35, 40, 50]
    generator = get_generator()
    
    async def _gen_single_age(age):
        params = {
            "currentAge": 18,
            "futureAge": age,
            "lifestyle": lifestyle,
            "fitness": fitness,
            "facialHair": facial_hair
        }
        files = await generator.generate_future_face(
            original_image_path=str(upload_path),
            prompt=f"portrait of a person aged {age}",
            negative_prompt="",
            num_variations=1,
            params=params
        )
        return {
            "age": age,
            "image_url": f"/generated/{files[0]}"
        } if files else None

    results = await asyncio.gather(*[_gen_single_age(age) for age in target_ages], return_exceptions=True)
    grid_results = [r for r in results if isinstance(r, dict)]
    
    return JSONResponse({
        "status": "success",
        "grid": grid_results
    })



@app.get("/api/history")
async def get_history():
    generations = get_all_generations()
    # Add URLs
    for gen in generations:
        gen["original_url"] = f"/api/uploads/{Path(gen['original_path']).name}"
        gen["generated_urls"] = [f"/api/generated/{f}" for f in gen["generated_paths"]]
    return {"history": generations}


@app.delete("/api/history/{gen_id}")
async def delete_history(gen_id: int):
    gen = get_generation(gen_id)
    if not gen:
        raise HTTPException(404, "Generation not found")
    
    # Delete generated files
    for f in gen["generated_paths"]:
        fpath = GENERATED_DIR / f
        if fpath.exists():
            fpath.unlink()
    
    # Delete original upload
    orig_path = Path(gen["original_path"])
    if orig_path.exists():
        orig_path.unlink()
    
    delete_generation(gen_id)
    return {"success": True}


# ── Run ──────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
