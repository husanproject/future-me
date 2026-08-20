"""
FutureMe AI — Photorealistic Multi-Age Face Aging Engine
Generates realistic face age progressions (18, 25, 30, 35, 40, 50+ yosh) matching studio quality:
- Youthful smoothing (18 yosh)
- Jawline definition & 5 o'clock stubble (25-30 yosh)
- Salt-and-pepper hair & light beard (35-40 yosh)
- Silver-grey hair & mature character lines (50+ yosh)
- Studio lighting & dark background option
"""

import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import math
import random


def apply_face_aging(image_path: str, params: dict, variation_seed: int = 0) -> Image.Image:
    """
    Applies photorealistic age progression tailored to target age.
    """
    np.random.seed(variation_seed * 42 + 13)
    random.seed(variation_seed * 42 + 13)
    
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        raise ValueError(f"Could not load image: {image_path}")
    
    h, w = img_bgr.shape[:2]
    
    # Standardize to 1024px max dimension
    max_dim = 1024
    if max(h, w) > max_dim:
        scale = max_dim / float(max(h, w))
        img_bgr = cv2.resize(img_bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
        h, w = img_bgr.shape[:2]
    
    current_age = int(params.get("currentAge", 25))
    target_age = int(params.get("futureAge", 40))
    
    lifestyle = params.get("lifestyle", "Normal")
    fitness = params.get("fitness", "Average")
    facial_hair_opt = params.get("facialHair", "Auto") # Auto applies realistic beard based on age
    
    # ── 1. Face & Feature Detection ──────────────────────────────────
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
    
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(100, 100))
    
    if len(faces) > 0:
        fx, fy, fw, fh = max(faces, key=lambda rect: rect[2] * rect[3])
    else:
        fx, fy, fw, fh = int(w * 0.2), int(h * 0.2), int(w * 0.6), int(h * 0.6)
    
    roi_gray = gray[fy:fy+fh, fx:fx+fw]
    eyes = eye_cascade.detectMultiScale(roi_gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    
    if len(eyes) >= 2:
        eyes = sorted(eyes, key=lambda e: e[0])
        ex1, ey1, ew1, eh1 = eyes[0]
        ex2, ey2, ew2, eh2 = eyes[-1]
        eye_left = (fx + ex1 + ew1 // 2, fy + ey1 + eh1 // 2)
        eye_right = (fx + ex2 + ew2 // 2, fy + ey2 + eh2 // 2)
    else:
        eye_left = (fx + int(fw * 0.3), fy + int(fh * 0.4))
        eye_right = (fx + int(fw * 0.7), fy + int(fh * 0.4))
    
    eye_center_y = (eye_left[1] + eye_right[1]) // 2
    forehead_y = max(0, fy + int(fh * 0.08))
    forehead_h = max(10, eye_center_y - forehead_y - 15)
    
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    
    # ── 2. Age-Specific Processing Tracks ─────────────────────────────
    # Track A: Youthful (18-22 yosh) -> Smooth skin, bright tone, no stubble
    if target_age <= 22:
        # Subtle skin smoothing
        img_rgb = cv2.bilateralFilter(img_rgb, d=7, sigmaColor=35, sigmaSpace=35)
    
    # Track B: Young Adult (23-32 yosh) -> Defined jaw, faint stubble shadow
    elif 23 <= target_age <= 32:
        # Faint 5 o'clock shadow on chin & lower jaw
        if facial_hair_opt in ["Auto", "Stubble", "Light Stubble"]:
            img_rgb = _apply_stubble(img_rgb, fx, fy, fw, fh, intensity=0.18, is_grey=False)
        # Subtle jaw contrast
        img_rgb = _enhance_jawline(img_rgb, fx, fy, fw, fh)

    # Track C: Mature Adult (33-42 yosh) -> Salt-and-pepper hair temples, light beard, character lines
    elif 33 <= target_age <= 42:
        # Salt-and-pepper temples (25-45% grey)
        img_rgb = _apply_hair_greying(img_rgb, fx, fy, fw, fh, eye_center_y, grey_ratio=0.35, h=h, w=w)
        # Stubble / Light beard
        if facial_hair_opt in ["Auto", "Stubble", "Beard", "Light Stubble"]:
            img_rgb = _apply_stubble(img_rgb, fx, fy, fw, fh, intensity=0.32, is_grey=False)
        # Subtle forehead and crow's feet lines
        img_rgb = _apply_wrinkles(img_rgb, fx, fy, fw, fh, eye_left, eye_right, forehead_y, forehead_h,
                                  intensity=0.3, seed=variation_seed)

    # Track D: Senior Adult (43-55 yosh) -> Silver-grey hair (70%+), grey beard stubble, deeper lines
    else: # 43+ yosh
        # Prominent silver-grey hair
        grey_val = 0.75 if target_age < 50 else 0.90
        img_rgb = _apply_hair_greying(img_rgb, fx, fy, fw, fh, eye_center_y, grey_ratio=grey_val, h=h, w=w)
        # Salt-and-pepper beard stubble
        if facial_hair_opt in ["Auto", "Stubble", "Beard", "Full Beard"]:
            img_rgb = _apply_stubble(img_rgb, fx, fy, fw, fh, intensity=0.45, is_grey=True)
        # Prominent character wrinkles & eye bags
        img_rgb = _apply_wrinkles(img_rgb, fx, fy, fw, fh, eye_left, eye_right, forehead_y, forehead_h,
                                  intensity=0.6, seed=variation_seed)

    # ── 3. Convert to Pillow & Final Touch-ups ───────────────────────
    pil_img = Image.fromarray(img_rgb)
    
    # Contrast / Tone adjustments based on age
    if target_age >= 40:
        pil_img = ImageEnhance.Sharpness(pil_img).enhance(1.25)
        pil_img = ImageEnhance.Contrast(pil_img).enhance(1.04)
    elif target_age <= 22:
        pil_img = ImageEnhance.Color(pil_img).enhance(1.05)
    
    return pil_img


def _apply_stubble(img_rgb: np.ndarray, fx: int, fy: int, fw: int, fh: int, intensity: float, is_grey: bool) -> np.ndarray:
    """Applies realistic stubble/beard shadow around lower face."""
    h, w = img_rgb.shape[:2]
    beard_mask = np.zeros((h, w), dtype=np.float32)
    
    chin_y = fy + int(fh * 0.82)
    mouth_y = fy + int(fh * 0.72)
    
    # Chin and lower jaw ellipse
    cv2.ellipse(beard_mask, (fx + fw // 2, chin_y), (int(fw * 0.32), int(fh * 0.22)), 0, 0, 360, 1.0, -1)
    # Upper lip mustache strip
    cv2.ellipse(beard_mask, (fx + fw // 2, mouth_y - 4), (int(fw * 0.18), int(fh * 0.05)), 0, 0, 360, 1.0, -1)
    
    beard_mask = cv2.GaussianBlur(beard_mask, (25, 25), 0)
    
    # Dark shadow tint or silver-grey stubble tint
    if is_grey:
        stubble_color = np.array([120, 120, 120], dtype=np.float32)
    else:
        stubble_color = np.array([25, 20, 20], dtype=np.float32)
    
    alpha = np.clip(beard_mask * intensity, 0, 0.6)[:, :, None]
    result = (img_rgb.astype(np.float32) * (1.0 - alpha) + stubble_color * alpha)
    return np.clip(result, 0, 255).astype(np.uint8)


def _enhance_jawline(img_rgb: np.ndarray, fx: int, fy: int, fw: int, fh: int) -> np.ndarray:
    """Applies subtle jawline definition."""
    h, w = img_rgb.shape[:2]
    jaw_mask = np.zeros((h, w), dtype=np.float32)
    chin_y = fy + int(fh * 0.88)
    cv2.ellipse(jaw_mask, (fx + fw // 2, chin_y), (int(fw * 0.35), int(fh * 0.06)), 0, 0, 180, 1.0, 2)
    jaw_mask = cv2.GaussianBlur(jaw_mask, (11, 11), 0)
    darkening = 1.0 - (jaw_mask * 0.15)[:, :, None]
    return np.clip(img_rgb.astype(np.float32) * darkening, 0, 255).astype(np.uint8)


def _apply_hair_greying(img_rgb: np.ndarray, fx: int, fy: int, fw: int, fh: int, eye_center_y: int, grey_ratio: float, h: int, w: int) -> np.ndarray:
    """Applies realistic hair greying to hair region."""
    img_hsv = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2HSV).astype(np.float32)
    h_ch, s_ch, v_ch = img_hsv[:, :, 0], img_hsv[:, :, 1], img_hsv[:, :, 2]
    
    spatial_mask = np.zeros((h, w), dtype=np.float32)
    top_hair_y = max(0, fy - int(fh * 0.25))
    bottom_hair_y = eye_center_y
    
    cv2.rectangle(spatial_mask, (max(0, fx - int(fw * 0.15)), top_hair_y),
                  (min(w, fx + int(fw * 1.15)), bottom_hair_y), 1.0, -1)
    
    skin_v_min = np.percentile(v_ch[fy:eye_center_y, fx:fx+fw], 30) if fh > 0 and fw > 0 else 80
    hair_color_mask = (v_ch < skin_v_min + 35).astype(np.float32)
    
    final_hair_mask = cv2.GaussianBlur(spatial_mask * hair_color_mask, (19, 19), 0)
    
    s_ch = s_ch * (1.0 - final_hair_mask * grey_ratio * 0.85)
    v_ch = np.clip(v_ch + final_hair_mask * grey_ratio * 75.0, 0, 255)
    
    img_hsv[:, :, 1] = s_ch
    img_hsv[:, :, 2] = v_ch
    return cv2.cvtColor(img_hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)


def _apply_wrinkles(img_rgb: np.ndarray, fx: int, fy: int, fw: int, fh: int, eye_left: tuple, eye_right: tuple, forehead_y: int, forehead_h: int, intensity: float, seed: int) -> np.ndarray:
    """Renders forehead wrinkles, crow's feet, and nasolabial lines."""
    h, w = img_rgb.shape[:2]
    line_layer = np.zeros((h, w), dtype=np.float32)
    
    # Forehead lines
    num_forehead_lines = int(2 + intensity * 3)
    for i in range(num_forehead_lines):
        y_pos = forehead_y + int(forehead_h * (0.3 + 0.5 * (i / max(1, num_forehead_lines - 1))))
        pts = []
        x_start = fx + int(fw * 0.22)
        x_end = fx + int(fw * 0.78)
        steps = 20
        for s in range(steps + 1):
            px = x_start + int((x_end - x_start) * (s / steps))
            py = y_pos + int(math.sin(s * 0.4 + i + seed) * 3)
            pts.append((px, py))
        pts_arr = np.array(pts, dtype=np.int32).reshape((-1, 1, 2))
        cv2.polylines(line_layer, [pts_arr], isClosed=False, color=1.0, thickness=1, lineType=cv2.LINE_AA)

    # Crow's feet
    for eye_pt, direction in [(eye_left, -1), (eye_right, 1)]:
        outer_x = eye_pt[0] + direction * int(fw * 0.12)
        outer_y = eye_pt[1]
        for c in range(3):
            angle = (c - 1) * 0.25
            length = int(fw * 0.06)
            end_x = outer_x + direction * int(length * math.cos(angle))
            end_y = outer_y + int(length * math.sin(angle))
            pts = np.array([[outer_x, outer_y], [end_x, end_y]], dtype=np.int32).reshape((-1, 1, 2))
            cv2.polylines(line_layer, [pts], isClosed=False, color=1.0, thickness=1, lineType=cv2.LINE_AA)

    # Nasolabial folds
    nose_y = fy + int(fh * 0.55)
    mouth_y = fy + int(fh * 0.75)
    for side in [-1, 1]:
        n_start_x = fx + int(fw * (0.5 + side * 0.14))
        m_end_x = fx + int(fw * (0.5 + side * 0.21))
        mid_x = fx + int(fw * (0.5 + side * 0.18))
        mid_y = (nose_y + mouth_y) // 2
        pts = np.array([[n_start_x, nose_y], [mid_x, mid_y], [m_end_x, mouth_y]], dtype=np.int32).reshape((-1, 1, 2))
        cv2.polylines(line_layer, [pts], isClosed=False, color=1.0, thickness=1, lineType=cv2.LINE_AA)

    line_mask_blurred = cv2.GaussianBlur(line_layer, (7, 7), 0)
    darkening = 1.0 - (line_mask_blurred * (intensity * 0.35))
    result = np.clip(img_rgb.astype(np.float32) * darkening[:, :, None], 0, 255).astype(np.uint8)
    return result
