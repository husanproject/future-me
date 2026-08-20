"""
FutureMe AI — Prompt Builder
Generates structured AI image prompts from user parameters.
"""


def build_prompt(params: dict) -> dict:
    """Build positive and negative prompts from user parameters."""
    
    current_age = params.get("currentAge", 25)
    future_age = params.get("futureAge", 40)
    age_diff = future_age - current_age
    lifestyle = params.get("lifestyle", "Normal")
    fitness = params.get("fitness", "Average")
    hair = params.get("hair", "Short")
    clothing = params.get("clothing", "Casual")
    facial_hair = params.get("facialHair", "None")
    environment = params.get("environment", "Studio")
    
    # --- Build age-related descriptors ---
    age_desc = f"{future_age}-year-old person"
    
    if future_age < 30:
        age_features = "youthful face, smooth skin, vibrant appearance"
    elif future_age < 40:
        age_features = "mature face, slight smile lines, defined jawline, confident expression"
    elif future_age < 50:
        age_features = "mature distinguished face, subtle wrinkles around eyes, experienced appearance, slight crow's feet"
    elif future_age < 60:
        age_features = "distinguished mature face, visible laugh lines, salt and pepper hair possible, wisdom in expression, slight forehead lines"
    elif future_age < 70:
        age_features = "elderly distinguished face, prominent wrinkles, grey or white hair, weathered dignified appearance"
    else:
        age_features = "elderly face, deep wrinkles, white or silver hair, aged dignified appearance, visible wisdom"
    
    # --- Fitness body descriptors ---
    fitness_map = {
        "Very Low": "slightly overweight build, round face",
        "Low": "average to slightly heavy build, soft features",
        "Average": "average build, normal physique",
        "Fit": "lean fit build, defined features, healthy complexion",
        "Very Fit": "athletic lean build, toned muscles visible, sharp jawline",
        "Muscular": "muscular athletic build, very defined features, strong jawline, visible muscle definition"
    }
    fitness_desc = fitness_map.get(fitness, "average build")
    
    # --- Lifestyle impact ---
    lifestyle_map = {
        "Sedentary": "indoor complexion, slightly pale, relaxed posture",
        "Normal": "healthy natural complexion, relaxed confidence",
        "Active": "healthy sun-kissed complexion, energetic posture, vibrant",
        "Athletic": "tanned healthy skin, athletic posture, dynamic energy",
        "Professional Athlete": "deeply tanned athletic skin, peak physical condition, powerful posture, competition-ready"
    }
    lifestyle_desc = lifestyle_map.get(lifestyle, "healthy complexion")
    
    # --- Hair ---
    hair_map = {
        "Short": "short neat hair",
        "Medium": "medium-length styled hair",
        "Long": "long flowing hair",
        "Curly": "curly textured hair",
        "Wavy": "wavy natural hair",
        "Buzz Cut": "buzz cut very short hair",
        "Fade": "modern fade haircut",
        "Professional": "professional neatly styled hair, side part",
        "Messy": "messy tousled hair, natural bedhead style"
    }
    hair_desc = hair_map.get(hair, hair)
    
    # Add greying for older ages
    if future_age >= 45 and future_age < 55:
        hair_desc += ", slight grey streaks"
    elif future_age >= 55 and future_age < 65:
        hair_desc += ", predominantly grey"
    elif future_age >= 65:
        hair_desc += ", white or silver"
    
    # --- Clothing ---
    clothing_map = {
        "Casual": "wearing casual modern clothing, t-shirt or casual shirt",
        "Business": "wearing sharp business suit, professional attire, tie",
        "Streetwear": "wearing trendy streetwear, hoodie, sneakers aesthetic",
        "Luxury": "wearing luxury designer clothing, premium fabrics, elegant",
        "Sport": "wearing athletic sportswear, performance clothing",
        "Formal": "wearing formal elegant attire, black tie outfit",
        "Minimalist": "wearing minimalist clean clothing, neutral tones, simple elegant",
        "Old Money": "wearing classic preppy old money style, polo, blazer, refined"
    }
    clothing_desc = clothing_map.get(clothing, "wearing casual clothing")
    
    # --- Facial hair ---
    facial_hair_map = {
        "None": "clean shaven",
        "Light Stubble": "light stubble, 3-day beard",
        "Beard": "well-groomed short beard",
        "Full Beard": "full thick beard, well maintained",
        "Mustache": "styled mustache"
    }
    facial_hair_desc = facial_hair_map.get(facial_hair, "clean shaven")
    
    # --- Environment ---
    env_map = {
        "Modern City": "modern city skyline background, urban setting, skyscrapers, golden hour lighting",
        "Office": "elegant modern office background, glass windows, professional setting",
        "Gym": "modern gym background, fitness equipment, motivational setting",
        "Luxury Interior": "luxury interior background, marble, elegant furniture, warm lighting",
        "Nature": "beautiful natural landscape background, mountains or forest, golden hour",
        "Studio": "professional photography studio, soft studio lighting, clean background"
    }
    env_desc = env_map.get(environment, "professional studio background")
    
    # --- Compose final prompt ---
    hair_color = params.get("hairColor", "Original")
    eye_color = params.get("eyeColor", "Original")
    skin_tone = params.get("skinTone", "Original")
    accessory = params.get("accessory", "None")
    hat = params.get("hat", "None")
    glasses = params.get("glasses", "None")
    
    fx_descriptions = []
    if hair_color != "Original":
        fx_descriptions.append(f"vibrant {hair_color} hair color")
    if eye_color != "Original":
        fx_descriptions.append(f"stunning {eye_color} eyes")
    if skin_tone != "Original":
        fx_descriptions.append(f"{skin_tone} glowing skin tone")
    if accessory == "Clown Nose":
        fx_descriptions.append("wearing a funny red clown nose 🔴")
    elif accessory != "None":
        fx_descriptions.append(f"wearing {accessory}")
    if hat != "None":
        fx_descriptions.append(f"wearing a stylish {hat}")
    if glasses != "None":
        fx_descriptions.append(f"wearing cool {glasses}")
        
    fx_text = ", ".join(fx_descriptions) if fx_descriptions else "stylized magic portrait"

    pos_parts = [
        f"Professional high-definition Magic Face FX portrait of a person,",
        f"featuring {fx_text},",
        f"lifestyle: {lifestyle}, fitness level: {fitness},",
        f"wearing {clothing} outfit, hairstyle: {hair}, facial hair: {facial_hair},",
        f"environment: {environment}, studio lighting, highly detailed face, 8k resolution, photorealistic"
    ]
    
    positive_prompt = (
        f"{', '.join(pos_parts)}, "
        f"sharp focus, natural skin texture, "
        f"detailed pores, realistic lighting, shallow depth of field, "
        f"professional DSLR photograph, magazine quality, hyper-detailed face, "
        f"preserving original facial structure and identity, "
        f"front-facing portrait, eye contact with camera"
    )
    
    negative_prompt = (
        "distorted face, extra fingers, deformed anatomy, duplicate person, "
        "blurry face, unrealistic skin, cartoon, anime, plastic skin, "
        "extreme facial changes, asymmetrical eyes, artifacts, low resolution, "
        "watermark, text, logo, signature, frame, border, "
        "disfigured, bad anatomy, bad proportions, extra limbs, "
        "cloned face, gross proportions, malformed limbs, missing arms, "
        "missing legs, extra arms, extra legs, fused fingers, "
        "too many fingers, long neck, mutation, mutated, "
        "ugly, disgusting, blurry, bad art, bad quality, "
        "3d render, cgi, painting, drawing, sketch, illustration"
    )
    
    return {
        "positive": positive_prompt,
        "negative": negative_prompt
    }


def build_future_profile(params: dict) -> dict:
    """Generate a fictional future profile based on selected parameters."""
    
    future_age = params.get("futureAge", 40)
    lifestyle = params.get("lifestyle", "Normal")
    fitness = params.get("fitness", "Average")
    clothing = params.get("clothing", "Casual")
    environment = params.get("environment", "Studio")
    
    # Lifestyle narrative
    lifestyle_narratives = {
        "Sedentary": "You lead a comfortable, relaxed lifestyle focused on intellectual pursuits and indoor hobbies. Your days are filled with creative projects and quiet contemplation.",
        "Normal": "You maintain a balanced lifestyle with a mix of work, leisure, and moderate activity. You've found harmony between professional ambitions and personal well-being.",
        "Active": "Your active lifestyle keeps you energetic and vibrant. Regular outdoor activities and social engagements define your routine, keeping both body and mind sharp.",
        "Athletic": "Your dedication to fitness has become a core part of your identity. Regular training sessions, competitive events, and a disciplined nutrition plan keep you in peak condition.",
        "Professional Athlete": "Years of elite training have sculpted your physique to peak human performance. Your discipline and dedication have made you a formidable competitor at the highest level."
    }
    
    # Appearance changes
    appearance_by_fitness = {
        "Very Low": "Your relaxed approach to fitness shows in a softer physique, but your face carries warmth and contentment.",
        "Low": "You maintain a comfortable build. Your appearance reflects a life lived with enjoyment of good food and relaxation.",
        "Average": "You maintain a typical, healthy appearance. Natural aging brings character to your features without dramatic changes.",
        "Fit": "Your commitment to staying fit shows — lean build, healthy complexion, and an energetic posture that defies your age.",
        "Very Fit": "Your dedication to fitness is unmistakable. Defined muscles, sharp features, and a youthful vitality make you look years younger.",
        "Muscular": "Your impressive muscular build commands attention. Years of dedicated training have sculpted a powerful, statuesque physique."
    }
    
    # Fashion
    fashion_by_style = {
        "Casual": "Your wardrobe is curated yet effortless — premium basics, comfortable fits, and subtle brand choices that speak to quiet confidence.",
        "Business": "Your professional wardrobe is impeccable — tailored suits, crisp shirts, and polished accessories project authority and success.",
        "Streetwear": "Your cutting-edge streetwear style turns heads — limited-edition sneakers, designer collaborations, and bold graphic pieces define your look.",
        "Luxury": "Your wardrobe reads like a designer catalog — premium fabrics, exclusive pieces, and accessories that whisper affluence.",
        "Sport": "Performance meets style in your wardrobe — high-tech athletic wear, premium sportswear brands, and gear that transitions from gym to street.",
        "Formal": "Your refined formal style is timeless — classic cuts, premium fabrics, and elegant accessories suitable for any prestigious occasion.",
        "Minimalist": "Your minimalist wardrobe is intentional — clean lines, neutral palettes, and quality-over-quantity pieces that define understated elegance.",
        "Old Money": "Your wardrobe embodies generational style — heritage brands, classic patterns, and timeless pieces that project established sophistication."
    }
    
    return {
        "age": future_age,
        "lifestyle": lifestyle,
        "style": clothing,
        "fitness": fitness,
        "lifestyle_narrative": lifestyle_narratives.get(lifestyle, lifestyle_narratives["Normal"]),
        "appearance_changes": appearance_by_fitness.get(fitness, appearance_by_fitness["Average"]),
        "fashion_style": fashion_by_style.get(clothing, fashion_by_style["Casual"]),
        "environment": environment,
        "disclaimer": "AI-generated fictional scenario — not a prediction."
    }
