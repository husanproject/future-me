"""
FaceFX Studio — Magic Face & Accessories Image Engine
Applies instant, high-quality visual face transformations:
1. Hair recoloring (Blonde, Red, Neon Blue, Purple, Silver, Green, Pink, Black)
2. Eye color lens (Sapphire Blue, Emerald Green, Golden Amber, Ruby Red, Cyber Neon)
3. Skin tone & glow filters (Golden Sun, Bronze Tan, Porcelain Pale, Cyber Neon, Avatar Blue)
4. Fun Accessory Overlays:
   - 🔴 Clown Red Nose (Masqaraboz burni)
   - 🎩 Hats (Cowboy Hat, Top Hat, Crown, Party Hat, Santa Hat)
   - 🕶️ Glasses (Cool Sunglasses, Cyber Goggles, Thug Life)
   - 🐱 Face Accessories (Cat Ears, Angel Halo, Devil Horns)
"""

import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageDraw, ImageFilter
import math
import random


def apply_face_fx(
    image_path: str,
    hair_color: str = "Original",
    eye_color: str = "Original",
    skin_tone: str = "Original",
    accessory: str = "None",
    hat: str = "None",
    glasses: str = "None",
    variation_seed: int = 0
) -> Image.Image:
    """
    Applies real-time visual face transformations and accessory overlays.
    """
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        raise ValueError(f"Could not load image: {image_path}")
    
    h, w = img_bgr.shape[:2]
    
    # Standardize image size to 1024px max dimension
    max_dim = 1024
    if max(h, w) > max_dim:
        scale = max_dim / float(max(h, w))
        img_bgr = cv2.resize(img_bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
        h, w = img_bgr.shape[:2]
    
    # ── 1. Face & Landmark Detection ──────────────────────────────────
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
    
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(100, 100))
    
    if len(faces) > 0:
        fx, fy, fw, fh = max(faces, key=lambda rect: rect[2] * rect[3])
    else:
        fx, fy, fw, fh = int(w * 0.25), int(h * 0.25), int(w * 0.5), int(h * 0.5)
    
    roi_gray = gray[fy:fy+fh, fx:fx+fw]
    eyes = eye_cascade.detectMultiScale(roi_gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    
    if len(eyes) >= 2:
        eyes = sorted(eyes, key=lambda e: e[0])
        ex1, ey1, ew1, eh1 = eyes[0]
        ex2, ey2, ew2, eh2 = eyes[-1]
        eye_left = (fx + ex1 + ew1 // 2, fy + ey1 + eh1 // 2)
        eye_right = (fx + ex2 + ew2 // 2, fy + ey2 + eh2 // 2)
    else:
        eye_left = (fx + int(fw * 0.32), fy + int(fh * 0.4))
        eye_right = (fx + int(fw * 0.68), fy + int(fh * 0.4))
    
    eye_center_x = (eye_left[0] + eye_right[0]) // 2
    eye_center_y = (eye_left[1] + eye_right[1]) // 2
    nose_tip = (fx + fw // 2, fy + int(fh * 0.62))
    
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    
    # ── 2. Hair Recoloring (Soch Rangi) ───────────────────────────────
    if hair_color != "Original":
        img_rgb = _recolor_hair(img_rgb, fx, fy, fw, fh, eye_center_y, hair_color, h, w)

    # ── 3. Eye Color Lens (Ko'zlar Rangi) ─────────────────────────────
    if eye_color != "Original":
        img_rgb = _recolor_eyes(img_rgb, eye_left, eye_right, fw, eye_color)

    # ── 4. Skin Tone & Glow Filter (Teri Rangi va Glow) ────────────────
    if skin_tone != "Original":
        img_rgb = _apply_skin_tone(img_rgb, fx, fy, fw, fh, skin_tone)

    # ── 5. Convert to Pillow RGBA for Accessory Compositing ────────────
    pil_img = Image.fromarray(img_rgb).convert("RGBA")
    
    # ── 6. Accessories & Overlays ──────────────────────────────────────
    # A. Clown Nose (Masqarabozning qizil popugi) / Red Nose
    if accessory in ["Clown Nose", "Red Nose", "Clown Party"]:
        pil_img = _draw_clown_nose(pil_img, nose_tip, fw)
    
    # B. Glasses & Shades (Ko'zoynaklar)
    if glasses != "None":
        pil_img = _draw_glasses(pil_img, eye_left, eye_right, fw, glasses)
    
    # C. Hats & Crowns (Shlyapalar va Tojlar)
    if hat != "None":
        pil_img = _draw_hat(pil_img, fx, fy, fw, fh, eye_center_x, hat)
    
    # D. Fun Accessories (Cat Ears, Halo, Devil Horns)
    if accessory in ["Cat Ears", "Angel Halo", "Devil Horns", "Mustache"]:
        pil_img = _draw_fun_accessory(pil_img, fx, fy, fw, fh, nose_tip, accessory)

    return pil_img.convert("RGB")


# ── Hair Recoloring ───────────────────────────────────────────────────
def _recolor_hair(img_rgb: np.ndarray, fx: int, fy: int, fw: int, fh: int, eye_center_y: int, hair_color: str, h: int, w: int) -> np.ndarray:
    """Applies HSV hair recoloring (Blonde, Red, Neon Blue, Purple, Silver, Green, Pink, Black)."""
    img_hsv = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2HSV).astype(np.float32)
    h_ch, s_ch, v_ch = img_hsv[:, :, 0], img_hsv[:, :, 1], img_hsv[:, :, 2]
    
    spatial_mask = np.zeros((h, w), dtype=np.float32)
    top_hair_y = max(0, fy - int(fh * 0.28))
    bottom_hair_y = eye_center_y + 10
    
    cv2.rectangle(spatial_mask, (max(0, fx - int(fw * 0.18)), top_hair_y),
                  (min(w, fx + int(fw * 1.18)), bottom_hair_y), 1.0, -1)
    
    skin_v_min = np.percentile(v_ch[fy:eye_center_y, fx:fx+fw], 30) if fh > 0 and fw > 0 else 80
    hair_mask = cv2.GaussianBlur((v_ch < skin_v_min + 35).astype(np.float32) * spatial_mask, (19, 19), 0)
    
    # Color mapping: Hue (0-179), Saturation boost, Value boost
    color_map = {
        "Blonde": (28, 0.9, 1.45),
        "Red": (5, 1.6, 1.1),
        "Neon Blue": (105, 1.8, 1.3),
        "Purple": (145, 1.7, 1.2),
        "Silver": (0, 0.05, 1.6),
        "Emerald Green": (65, 1.8, 1.2),
        "Hot Pink": (160, 1.8, 1.3),
        "Black": (0, 0.2, 0.3)
    }
    
    if hair_color in color_map:
        target_h, target_s_factor, target_v_factor = color_map[hair_color]
        
        h_ch = h_ch * (1.0 - hair_mask) + target_h * hair_mask
        s_ch = np.clip(s_ch * (1.0 - hair_mask) + s_ch * target_s_factor * hair_mask, 0, 255)
        v_ch = np.clip(v_ch * (1.0 - hair_mask) + v_ch * target_v_factor * hair_mask, 0, 255)
        
        img_hsv[:, :, 0] = h_ch
        img_hsv[:, :, 1] = s_ch
        img_hsv[:, :, 2] = v_ch
        
        return cv2.cvtColor(img_hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)
    
    return img_rgb


# ── Eye Color Lens ────────────────────────────────────────────────────
def _recolor_eyes(img_rgb: np.ndarray, eye_left: tuple, eye_right: tuple, fw: int, eye_color: str) -> np.ndarray:
    """Applies colored contacts / iris lens effect."""
    iris_radius = max(4, int(fw * 0.035))
    eye_mask = np.zeros(img_rgb.shape[:2], dtype=np.float32)
    
    for eye_pt in [eye_left, eye_right]:
        cv2.circle(eye_mask, eye_pt, iris_radius, 1.0, -1)
    
    eye_mask = cv2.GaussianBlur(eye_mask, (5, 5), 0)[:, :, None]
    
    color_rgb = {
        "Sapphire Blue": np.array([20, 120, 245], dtype=np.float32),
        "Emerald Green": np.array([10, 200, 80], dtype=np.float32),
        "Golden Amber": np.array([245, 180, 20], dtype=np.float32),
        "Ruby Red": np.array([235, 30, 40], dtype=np.float32),
        "Cyber Neon": np.array([0, 255, 220], dtype=np.float32)
    }.get(eye_color, np.array([30, 140, 240], dtype=np.float32))
    
    blended = img_rgb.astype(np.float32) * (1.0 - eye_mask * 0.6) + color_rgb * (eye_mask * 0.6)
    return np.clip(blended, 0, 255).astype(np.uint8)


# ── Skin Tone & Glow ──────────────────────────────────────────────────
def _apply_skin_tone(img_rgb: np.ndarray, fx: int, fy: int, fw: int, fh: int, skin_tone: str) -> np.ndarray:
    """Applies glowing skin tone filter (Golden Sun, Bronze Tan, Porcelain, Cyber Neon, Avatar Blue)."""
    hsv = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2HSV).astype(np.float32)
    
    if skin_tone == "Golden Sun":
        img_rgb = np.clip(img_rgb.astype(np.float32) * [1.12, 1.04, 0.9], 0, 255).astype(np.uint8)
    elif skin_tone == "Bronze Tan":
        img_rgb = np.clip(img_rgb.astype(np.float32) * [1.08, 0.95, 0.85], 0, 255).astype(np.uint8)
    elif skin_tone == "Porcelain Pale":
        hsv[:, :, 1] *= 0.75
        hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 1.15, 0, 255)
        img_rgb = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)
    elif skin_tone == "Cyber Neon":
        img_rgb = np.clip(img_rgb.astype(np.float32) * [0.85, 1.15, 1.25], 0, 255).astype(np.uint8)
    elif skin_tone == "Avatar Blue":
        hsv[:, :, 0] = 110
        hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.4, 0, 255)
        img_rgb = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)
        
    return img_rgb


# ── Clown Red Nose Overlay (Masqaraboz Burni) ─────────────────────────
def _draw_clown_nose(pil_img: Image.Image, nose_tip: tuple, fw: int) -> Image.Image:
    """Renders a glossy red clown nose at the nose tip."""
    draw = ImageDraw.Draw(pil_img, "RGBA")
    nx, ny = nose_tip
    r = max(12, int(fw * 0.08))
    
    # Red bulb
    draw.ellipse([nx - r, ny - r, nx + r, ny + r], fill=(235, 25, 35, 245), outline=(180, 10, 20, 255), width=2)
    
    # Glossy highlight arc
    hr = int(r * 0.4)
    hx, hy = nx - int(r * 0.3), ny - int(r * 0.3)
    draw.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=(255, 240, 240, 200))
    
    return pil_img


# ── Glasses & Sunglasses Overlay ──────────────────────────────────────
def _draw_glasses(pil_img: Image.Image, eye_left: tuple, eye_right: tuple, fw: int, glasses: str) -> Image.Image:
    """Renders sunglasses, cyber goggles, or nerd glasses."""
    draw = ImageDraw.Draw(pil_img, "RGBA")
    ex1, ey1 = eye_left
    ex2, ey2 = eye_right
    ey = (ey1 + ey2) // 2
    gw = int(fw * 0.85)
    gh = int(fw * 0.24)
    gx = (ex1 + ex2) // 2 - gw // 2
    gy = ey - gh // 2
    
    if glasses in ["Sunglasses", "Cool Sunglasses"]:
        # Dark lens frames
        draw.rounded_rectangle([gx, gy, gx + gw // 2 - 5, gy + gh], radius=15, fill=(15, 15, 20, 230), outline=(230, 230, 240, 255), width=3)
        draw.rounded_rectangle([gx + gw // 2 + 5, gy, gx + gw, gy + gh], radius=15, fill=(15, 15, 20, 230), outline=(230, 230, 240, 255), width=3)
        # Bridge
        draw.line([gx + gw // 2 - 5, gy + gh // 3, gx + gw // 2 + 5, gy + gh // 3], fill=(230, 230, 240, 255), width=4)
        # Lens shine
        draw.line([gx + 10, gy + 10, gx + gw // 4, gy + gh - 10], fill=(255, 255, 255, 100), width=3)
        draw.line([gx + gw // 2 + 15, gy + 10, gx + 3 * gw // 4, gy + gh - 10], fill=(255, 255, 255, 100), width=3)
    
    elif glasses == "Cyber Goggles":
        # Neon cyan goggles visor
        draw.rounded_rectangle([gx - 10, gy - 5, gx + gw + 10, gy + gh + 10], radius=10, fill=(0, 230, 255, 180), outline=(0, 255, 220, 255), width=4)
        draw.line([gx - 5, gy + gh // 2, gx + gw + 5, gy + gh // 2], fill=(255, 255, 255, 220), width=3)
        
    elif glasses == "Nerd Glasses":
        # Thick black round frames
        r = gh // 2 + 5
        draw.ellipse([ex1 - r, ey - r, ex1 + r, ey + r], outline=(20, 20, 20, 255), width=6)
        draw.ellipse([ex2 - r, ey - r, ex2 + r, ey + r], outline=(20, 20, 20, 255), width=6)
        draw.line([ex1 + r - 2, ey, ex2 - r + 2, ey], fill=(20, 20, 20, 255), width=6)
        
    return pil_img


# ── Hats & Crowns Overlay ─────────────────────────────────────────────
def _draw_hat(pil_img: Image.Image, fx: int, fy: int, fw: int, fh: int, eye_center_x: int, hat: str) -> Image.Image:
    """Renders Cowboy Hat, Top Hat, Crown, Party Hat, or Santa Hat."""
    draw = ImageDraw.Draw(pil_img, "RGBA")
    top_head_y = max(10, fy - int(fh * 0.15))
    
    if hat in ["Cowboy Hat", "Fedora"]:
        # Wide brim
        brim_w = int(fw * 1.5)
        brim_h = int(fh * 0.18)
        bx = eye_center_x - brim_w // 2
        by = top_head_y
        draw.ellipse([bx, by - brim_h // 2, bx + brim_w, by + brim_h // 2], fill=(80, 50, 25, 255), outline=(40, 25, 10, 255), width=3)
        # Crown dome
        cw = int(fw * 0.8)
        ch = int(fh * 0.5)
        cx = eye_center_x - cw // 2
        cy = by - ch
        draw.rounded_rectangle([cx, cy, cx + cw, by], radius=15, fill=(70, 42, 20, 255), outline=(40, 25, 10, 255), width=3)
        # Hat ribbon
        draw.rectangle([cx, by - 15, cx + cw, by - 3], fill=(200, 30, 40, 255))
        
    elif hat in ["Crown", "Royal Crown"]:
        # Golden Crown
        cw = int(fw * 0.9)
        ch = int(fh * 0.45)
        cx = eye_center_x - cw // 2
        cy = top_head_y - ch
        
        points = [
            (cx, cy + ch),
            (cx, cy + int(ch * 0.2)),
            (cx + int(cw * 0.25), cy + int(ch * 0.5)),
            (cx + int(cw * 0.5), cy),
            (cx + int(cw * 0.75), cy + int(ch * 0.5)),
            (cx + cw, cy + int(ch * 0.2)),
            (cx + cw, cy + ch)
        ]
        draw.polygon(points, fill=(255, 215, 0, 245), outline=(200, 160, 0, 255), width=3)
        # Jewels
        draw.ellipse([cx + int(cw * 0.5) - 6, cy - 6, cx + int(cw * 0.5) + 6, cy + 6], fill=(230, 20, 30, 255))
        draw.ellipse([cx + 5, cy + int(ch * 0.2) - 5, cx + 15, cy + int(ch * 0.2) + 5], fill=(30, 140, 240, 255))
        draw.ellipse([cx + cw - 15, cy + int(ch * 0.2) - 5, cx + cw - 5, cy + int(ch * 0.2) + 5], fill=(30, 200, 80, 255))

    elif hat in ["Party Hat", "Cone Hat"]:
        cw = int(fw * 0.5)
        ch = int(fh * 0.6)
        cx = eye_center_x
        cy = top_head_y - ch
        points = [(cx - cw // 2, top_head_y), (cx, cy), (cx + cw // 2, top_head_y)]
        draw.polygon(points, fill=(160, 30, 230, 245), outline=(255, 255, 255, 255), width=3)
        # Pom pom top
        draw.ellipse([cx - 10, cy - 10, cx + 10, cy + 10], fill=(255, 220, 0, 255))
        
    elif hat in ["Santa Hat", "Christmas Hat"]:
        cw = int(fw * 0.85)
        ch = int(fh * 0.55)
        cx = eye_center_x
        by = top_head_y
        points = [(cx - cw // 2, by), (cx + int(cw * 0.4), by - ch), (cx + cw // 2, by)]
        draw.polygon(points, fill=(225, 25, 35, 255))
        # White fur rim
        draw.rounded_rectangle([cx - cw // 2 - 10, by - 12, cx + cw // 2 + 10, by + 8], radius=8, fill=(250, 250, 250, 255))
        # White pom pom
        draw.ellipse([cx + int(cw * 0.4) - 12, by - ch - 12, cx + int(cw * 0.4) + 12, by - ch + 12], fill=(250, 250, 250, 255))

    return pil_img


# ── Fun Accessory Overlay (Cat Ears, Halo, Horns) ──────────────────────
def _draw_fun_accessory(pil_img: Image.Image, fx: int, fy: int, fw: int, fh: int, nose_tip: tuple, accessory: str) -> Image.Image:
    """Renders Cat Ears, Angel Halo, Devil Horns, or Mustache."""
    draw = ImageDraw.Draw(pil_img, "RGBA")
    eye_center_x = fx + fw // 2
    top_head_y = max(10, fy - int(fh * 0.2))
    
    if accessory == "Cat Ears":
        ew = int(fw * 0.3)
        eh = int(fh * 0.35)
        # Left ear
        lx = eye_center_x - int(fw * 0.35)
        draw.polygon([(lx, top_head_y), (lx + ew // 2, top_head_y - eh), (lx + ew, top_head_y)], fill=(30, 30, 30, 240), outline=(240, 120, 180, 255), width=3)
        draw.polygon([(lx + 8, top_head_y - 2), (lx + ew // 2, top_head_y - eh + 12), (lx + ew - 8, top_head_y - 2)], fill=(240, 120, 180, 220))
        # Right ear
        rx = eye_center_x + int(fw * 0.05)
        draw.polygon([(rx, top_head_y), (rx + ew // 2, top_head_y - eh), (rx + ew, top_head_y)], fill=(30, 30, 30, 240), outline=(240, 120, 180, 255), width=3)
        draw.polygon([(rx + 8, top_head_y - 2), (rx + ew // 2, top_head_y - eh + 12), (rx + ew - 8, top_head_y - 2)], fill=(240, 120, 180, 220))
        
    elif accessory == "Angel Halo":
        hw = int(fw * 0.8)
        hh = int(fh * 0.18)
        hx = eye_center_x - hw // 2
        hy = top_head_y - int(fh * 0.35)
        draw.ellipse([hx, hy, hx + hw, hy + hh], outline=(255, 235, 100, 255), width=7)
        draw.ellipse([hx + 4, hy + 4, hx + hw - 4, hy + hh - 4], outline=(255, 255, 200, 255), width=3)

    elif accessory == "Devil Horns":
        hw = int(fw * 0.22)
        hh = int(fh * 0.32)
        # Left horn
        lx = eye_center_x - int(fw * 0.3)
        draw.polygon([(lx, top_head_y), (lx - 10, top_head_y - hh), (lx + hw, top_head_y)], fill=(220, 20, 30, 245), outline=(150, 10, 20, 255), width=2)
        # Right horn
        rx = eye_center_x + int(fw * 0.1)
        draw.polygon([(rx, top_head_y), (rx + hw + 10, top_head_y - hh), (rx + hw), top_head_y], fill=(220, 20, 30, 245), outline=(150, 10, 20, 255), width=2)

    elif accessory == "Mustache":
        nx, ny = nose_tip
        mw = int(fw * 0.45)
        mh = int(fh * 0.12)
        mx = nx - mw // 2
        my = ny + 5
        draw.ellipse([mx, my, mx + mw, my + mh], fill=(20, 20, 20, 245))

    return pil_img
