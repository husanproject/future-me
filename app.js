/**
 * FutureMe AI — Main Application Logic
 * ═══════════════════════════════════════
 */

// ── State ────────────────────────────────────────────────
const state = {
    currentSection: 'hero',
    currentStep: 0,
    uploadedFile: null,
    uploadedFileName: null,
    previewUrl: null,
    params: {
        currentAge: 25,
        futureAge: 40,
        lifestyle: 'Normal',
        fitness: 'Average',
        hair: 'Short',
        customHair: '',
        clothing: 'Casual',
        facialHair: 'None',
        environment: 'Studio',
        // FX Parameters
        hairColor: 'Original',
        eyeColor: 'Original',
        skinTone: 'Original',
        accessory: 'None',
        hat: 'None',
        glasses: 'None'
    },
    results: null,
    isDemo: true,
    aiProvider: 'demo'
};

// ── 1-Click FX Presets Handler ─────────────────────────────
function applyFxPreset(presetKey) {
    const presets = {
        clown: {
            accessory: 'Clown Nose',
            hat: 'Party Hat',
            hairColor: 'Red',
            eyeColor: 'Original',
            skinTone: 'Original',
            glasses: 'None'
        },
        cyberpunk: {
            hairColor: 'Neon Blue',
            eyeColor: 'Cyber Neon',
            skinTone: 'Cyber Neon',
            glasses: 'Cyber Goggles',
            accessory: 'None',
            hat: 'None'
        },
        king: {
            hat: 'Royal Crown',
            eyeColor: 'Sapphire Blue',
            skinTone: 'Golden Sun',
            hairColor: 'Blonde',
            accessory: 'None',
            glasses: 'None'
        },
        cowboy: {
            hat: 'Cowboy Hat',
            skinTone: 'Bronze Tan',
            glasses: 'Cool Sunglasses',
            accessory: 'None',
            hairColor: 'Original',
            eyeColor: 'Original'
        },
        angel: {
            accessory: 'Angel Halo',
            skinTone: 'Porcelain Pale',
            eyeColor: 'Sapphire Blue',
            hairColor: 'Blonde',
            hat: 'None',
            glasses: 'None'
        },
        devil: {
            accessory: 'Devil Horns',
            eyeColor: 'Ruby Red',
            hairColor: 'Red',
            skinTone: 'Original',
            hat: 'None',
            glasses: 'None'
        }
    };

    const targetPreset = presets[presetKey];
    if (!targetPreset) return;

    Object.assign(state.params, targetPreset);

    // Update UI selected cards
    for (const [param, val] of Object.entries(targetPreset)) {
        const cards = document.querySelectorAll(`.option-card[data-param="${param}"]`);
        cards.forEach(card => {
            if (card.getAttribute('data-value') === val) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }

    showToast(`Applied ${presetKey.toUpperCase()} Preset!`, 'success');
}

const steps = [
    { id: 'step-age', title: 'Age' },
    { id: 'step-lifestyle', title: 'Lifestyle' },
    { id: 'step-appearance', title: 'Appearance' },
    { id: 'step-environment', title: 'Environment' },
    { id: 'step-summary', title: 'Summary' }
];

// ── Initialization ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    // Fetch app status
    try {
        const res = await fetch('/api/status');
        const data = await res.json();
        state.isDemo = data.is_demo;
        state.aiProvider = data.ai_provider;
        updateDemoBadge();
    } catch (e) {
        console.error('Failed to get app status:', e);
    }

    // Setup sections
    setupNavigation();
    setupUpload();
    setupSteps();
    setupSliders();
    setupOptionCards();
    showSection('hero');
}

// ── Navigation ───────────────────────────────────────────
function setupNavigation() {
    document.querySelectorAll('[data-nav]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const target = el.dataset.nav;
            showSection(target);
        });
    });

    // Mobile nav toggle
    const toggle = document.getElementById('mobileNavToggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            document.getElementById('navLinks').classList.toggle('open');
        });
    }
}

function showSection(sectionId) {
    state.currentSection = sectionId;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const section = document.getElementById(sectionId);
    if (section) section.classList.add('active');

    // Update nav active states
    document.querySelectorAll('[data-nav]').forEach(el => {
        el.classList.toggle('active', el.dataset.nav === sectionId);
    });

    // Close mobile nav
    document.getElementById('navLinks')?.classList.remove('open');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Load history if navigating there
    if (sectionId === 'history') loadHistory();
}

function updateDemoBadge() {
    const badge = document.getElementById('demoBadge');
    if (badge) {
        badge.style.display = state.isDemo ? 'inline-flex' : 'none';
    }
}

// ── Upload ───────────────────────────────────────────────
function setupUpload() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    if (!dropZone || !fileInput) return;

    // Click to upload
    dropZone.addEventListener('click', () => fileInput.click());

    // Drag & Drop
    ['dragenter', 'dragover'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFile(files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });
}

async function handleFile(file) {
    // Validate type
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
        showToast('Please upload a JPG or PNG image.', 'error');
        return;
    }

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
        showToast('File is too large. Maximum size is 10MB.', 'error');
        return;
    }

    // Show preview locally
    state.previewUrl = URL.createObjectURL(file);
    const preview = document.getElementById('uploadPreview');
    const zone = document.getElementById('dropZone');
    const previewImg = document.getElementById('previewImage');

    previewImg.src = state.previewUrl;
    zone.style.display = 'none';
    preview.classList.add('active');

    // Upload to server
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();

        if (!res.ok) throw new Error(data.detail || 'Upload failed');

        state.uploadedFile = data.url;
        state.uploadedFileName = data.filename;
        showToast('Photo uploaded successfully!', 'success');
    } catch (err) {
        showToast(err.message, 'error');
        removePhoto();
    }
}

function removePhoto() {
    state.uploadedFile = null;
    state.uploadedFileName = null;
    state.previewUrl = null;

    const preview = document.getElementById('uploadPreview');
    const zone = document.getElementById('dropZone');

    preview.classList.remove('active');
    zone.style.display = '';

    document.getElementById('fileInput').value = '';
}

function proceedToParams() {
    if (!state.uploadedFile) {
        showToast('Please upload a photo first.', 'error');
        return;
    }
    showSection('params');
    goToStep(0);
}

// ── Multi-Step Parameters ────────────────────────────────
function setupSteps() {
    updateStepUI();
}

function goToStep(index) {
    if (index < 0 || index >= steps.length) return;
    state.currentStep = index;
    updateStepUI();
}

function nextStep() {
    if (state.currentStep < steps.length - 1) {
        goToStep(state.currentStep + 1);
    }
}

function prevStep() {
    if (state.currentStep > 0) {
        goToStep(state.currentStep - 1);
    }
}

function updateStepUI() {
    const step = state.currentStep;

    // Update dots
    document.querySelectorAll('.step-dot').forEach((dot, i) => {
        dot.classList.remove('active', 'completed');
        if (i === step) dot.classList.add('active');
        else if (i < step) dot.classList.add('completed');
    });

    // Update lines
    document.querySelectorAll('.step-line').forEach((line, i) => {
        line.classList.toggle('completed', i < step);
    });

    // Update panels
    document.querySelectorAll('.step-panel').forEach((panel, i) => {
        panel.classList.toggle('active', i === step);
    });

    // Update summary if on last step
    if (step === steps.length - 1) updateSummary();

    // Validate future age
    validateAges();
}

// ── Sliders ──────────────────────────────────────────────
function setupSliders() {
    const currentSlider = document.getElementById('currentAgeSlider');
    const futureSlider = document.getElementById('futureAgeSlider');

    if (currentSlider) {
        currentSlider.addEventListener('input', (e) => {
            state.params.currentAge = parseInt(e.target.value);
            document.getElementById('currentAgeDisplay').textContent = state.params.currentAge;
            validateAges();
        });
    }

    if (futureSlider) {
        futureSlider.addEventListener('input', (e) => {
            state.params.futureAge = parseInt(e.target.value);
            document.getElementById('futureAgeDisplay').textContent = state.params.futureAge;
            validateAges();
        });
    }
}

function validateAges() {
    const futureSlider = document.getElementById('futureAgeSlider');
    const warning = document.getElementById('ageWarning');
    if (!futureSlider || !warning) return;

    if (state.params.futureAge <= state.params.currentAge) {
        state.params.futureAge = state.params.currentAge + 1;
        futureSlider.value = state.params.futureAge;
        document.getElementById('futureAgeDisplay').textContent = state.params.futureAge;
        warning.style.display = 'block';
    } else {
        warning.style.display = 'none';
    }

    futureSlider.min = state.params.currentAge + 1;
}

// ── Option Cards ─────────────────────────────────────────
function setupOptionCards() {
    document.querySelectorAll('.option-card[data-param]').forEach(card => {
        card.addEventListener('click', () => {
            const param = card.dataset.param;
            const value = card.dataset.value;

            // Clear siblings
            card.closest('.option-grid').querySelectorAll('.option-card').forEach(c => {
                c.classList.remove('selected');
            });

            card.classList.add('selected');
            state.params[param] = value;

            // Show custom input for custom hair
            if (param === 'hair') {
                const customField = document.getElementById('customHairField');
                if (customField) {
                    customField.style.display = value === 'Custom' ? 'block' : 'none';
                }
            }
        });
    });

    // Custom hair input
    const customHairInput = document.getElementById('customHairInput');
    if (customHairInput) {
        customHairInput.addEventListener('input', (e) => {
            state.params.customHair = e.target.value;
        });
    }

    // Set initial selections
    setInitialSelections();
}

function setInitialSelections() {
    Object.entries(state.params).forEach(([key, val]) => {
        const card = document.querySelector(`.option-card[data-param="${key}"][data-value="${val}"]`);
        if (card) card.classList.add('selected');
    });
}

// ── Summary ──────────────────────────────────────────────
function updateSummary() {
    const p = state.params;
    const summaryEl = document.getElementById('summaryGrid');
    if (!summaryEl) return;

    summaryEl.innerHTML = `
        <div class="summary-item">
            <div class="label">Current Age</div>
            <div class="value">${p.currentAge}</div>
        </div>
        <div class="summary-item">
            <div class="label">Future Age</div>
            <div class="value">${p.futureAge}</div>
        </div>
        <div class="summary-item">
            <div class="label">Soch Rangi (Hair)</div>
            <div class="value">${p.hairColor}</div>
        </div>
        <div class="summary-item">
            <div class="label">Ko'zlar Rangi (Eyes)</div>
            <div class="value">${p.eyeColor}</div>
        </div>
        <div class="summary-item">
            <div class="label">Teri Glow (Skin Tone)</div>
            <div class="value">${p.skinTone}</div>
        </div>
        <div class="summary-item">
            <div class="label">Aksessuar (Accessory)</div>
            <div class="value">${p.accessory}</div>
        </div>
        <div class="summary-item">
            <div class="label">Shlyapa / Toj (Hat)</div>
            <div class="value">${p.hat}</div>
        </div>
        <div class="summary-item">
            <div class="label">Ko'zoynak (Glasses)</div>
            <div class="value">${p.glasses}</div>
        </div>
        <div class="summary-item">
            <div class="label">Fon (Environment)</div>
            <div class="value">${p.environment}</div>
        </div>
    `;
}


// ── Generation ───────────────────────────────────────────
async function startGeneration() {
    if (!state.uploadedFileName) {
        showToast('Please upload a photo first.', 'error');
        return;
    }

    // Show loading
    showLoading();

    const loadingMessages = state.isDemo
        ? [
            { text: 'Processing your photo...', sub: 'Demo mode — applying visual transformations', pct: 25 },
            { text: 'Applying age simulation...', sub: 'Creating stylized variations', pct: 50 },
            { text: 'Adding lifestyle effects...', sub: 'Adjusting appearance parameters', pct: 75 },
            { text: 'Finalizing demo results...', sub: 'Almost done!', pct: 95 }
        ]
        : [
            { text: 'Building your future...', sub: 'Preparing AI generation prompt', pct: 20 },
            { text: 'Analyzing appearance...', sub: 'Processing facial features', pct: 40 },
            { text: 'Applying lifestyle changes...', sub: 'Generating future variations', pct: 65 },
            { text: 'Creating your future portrait...', sub: 'Finalizing results', pct: 90 }
        ];

    // Animate loading messages
    for (let i = 0; i < loadingMessages.length; i++) {
        await sleep(1200);
        updateLoadingMessage(loadingMessages[i].text, loadingMessages[i].sub, loadingMessages[i].pct);
    }

    // Prepare params
    const params = { ...state.params };
    if (params.hair === 'Custom' && params.customHair) {
        params.hair = params.customHair;
    }

    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uploadedFile: state.uploadedFileName,
                params: params
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Generation failed');

        state.results = data;
        hideLoading();
        showSection('results');
        renderResults(data);
    } catch (err) {
        hideLoading();
        showToast(err.message, 'error');
    }
}

// ── Loading Screen ───────────────────────────────────────
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('active');
    updateLoadingMessage('Initializing...', 'Preparing your generation', 5);
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

function updateLoadingMessage(text, sub, pct) {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingSubtext').textContent = sub;
    document.getElementById('loadingBar').style.width = pct + '%';
}

// ── Results Rendering ────────────────────────────────────
function renderResults(data) {
    const grid = document.getElementById('resultsGrid');
    const params = data.params;
    const hairDisplay = params.hair === 'Custom' && params.customHair ? params.customHair : params.hair;

    // Demo indicator
    const demoNotice = data.is_demo
        ? `<div class="profile-disclaimer" style="margin-bottom:32px">
             ⚠️ <strong>Demo Mode</strong> — These are stylized photo transformations, not AI-generated portraits. 
             Configure an AI provider in .env for real generation.
           </div>`
        : '';

    let cardsHtml = '';
    data.generated_images.forEach((imgUrl, i) => {
        cardsHtml += `
            <div class="result-card scale-in" style="animation-delay: ${i * 0.1}s">
                <div class="card-image">
                    <img src="${imgUrl}" alt="Future variation ${i + 1}" loading="lazy">
                    <div class="card-overlay">
                        <div class="overlay-actions">
                            <button class="btn-icon" onclick="viewFullscreen('${imgUrl}')" title="Fullscreen">🔍</button>
                            <button class="btn-icon" onclick="downloadImage('${imgUrl}')" title="Download">💾</button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <span class="card-tag">Variation ${i + 1}</span>
                    ${data.is_demo ? '<span class="card-tag" style="background:rgba(245,158,11,0.12);color:var(--accent-orange);border-color:rgba(245,158,11,0.2)">Demo</span>' : ''}
                    <div class="card-title">Age ${params.futureAge}</div>
                    <div class="card-desc">${params.lifestyle} • ${params.fitness} • ${hairDisplay}</div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-sm btn-secondary" onclick="viewFullscreen('${imgUrl}')">🔍 View</button>
                    <button class="btn btn-sm btn-secondary" onclick="showCompare(${i})">⚖️ Compare</button>
                    <button class="btn btn-sm btn-secondary" onclick="downloadImage('${imgUrl}')">💾 Save</button>
                </div>
            </div>
        `;
    });

    grid.innerHTML = demoNotice + cardsHtml;

    // Render future profile
    renderFutureProfile(data.future_profile);

    // Render timeline
    renderTimeline(data);

    // Setup compare
    setupCompare(data);
}

// ── Before/After Compare ─────────────────────────────────
function setupCompare(data) {
    if (!data.generated_images || data.generated_images.length === 0) return;

    const container = document.getElementById('compareContainer');
    if (!container) return;

    const originalImg = document.getElementById('compareOriginal');
    const futureImg = document.getElementById('compareFuture');

    originalImg.src = state.uploadedFile;
    futureImg.src = data.generated_images[0];

    // Make slider interactive
    initCompareSlider();
}

function showCompare(imageIndex) {
    if (!state.results) return;

    const section = document.getElementById('compareSection');
    section.style.display = 'block';

    const futureImg = document.getElementById('compareFuture');
    futureImg.src = state.results.generated_images[imageIndex];

    const originalImg = document.getElementById('compareOriginal');
    originalImg.src = state.uploadedFile;

    section.scrollIntoView({ behavior: 'smooth' });
    initCompareSlider();
}

function initCompareSlider() {
    const container = document.getElementById('compareContainer');
    const overlay = document.getElementById('compareOverlay');
    const line = document.getElementById('compareSliderLine');
    const handle = document.getElementById('compareSliderHandle');

    if (!container || !overlay) return;

    let isDragging = false;

    function updateSlider(x) {
        const rect = container.getBoundingClientRect();
        let pos = ((x - rect.left) / rect.width) * 100;
        pos = Math.max(0, Math.min(100, pos));

        overlay.style.clipPath = `inset(0 ${100 - pos}% 0 0)`;
        line.style.left = pos + '%';
        handle.style.left = pos + '%';
    }

    // Set initial position
    updateSlider(container.getBoundingClientRect().left + container.getBoundingClientRect().width * 0.5);

    // Mouse events
    handle.addEventListener('mousedown', () => isDragging = true);
    container.addEventListener('mousedown', (e) => { isDragging = true; updateSlider(e.clientX); });
    document.addEventListener('mousemove', (e) => { if (isDragging) updateSlider(e.clientX); });
    document.addEventListener('mouseup', () => isDragging = false);

    // Touch events
    handle.addEventListener('touchstart', () => isDragging = true);
    container.addEventListener('touchstart', (e) => {
        isDragging = true;
        updateSlider(e.touches[0].clientX);
    });
    document.addEventListener('touchmove', (e) => {
        if (isDragging) updateSlider(e.touches[0].clientX);
    });
    document.addEventListener('touchend', () => isDragging = false);
}

// ── Timeline ─────────────────────────────────────────────
function renderTimeline(data) {
    const timeline = document.getElementById('timeline');
    if (!timeline) return;

    const currentAge = data.params.currentAge;
    const futureAge = data.params.futureAge;
    const currentYear = new Date().getFullYear();
    const totalDiff = futureAge - currentAge;

    const milestones = [];
    // Current
    milestones.push({ year: currentYear, age: currentAge, label: 'Today', isOriginal: true });

    // Intermediary points every 5 years
    for (let offset = 5; offset < totalDiff; offset += 5) {
        milestones.push({
            year: currentYear + offset,
            age: currentAge + offset,
            label: `Age ${currentAge + offset}`,
            isOriginal: false
        });
    }

    // Future
    milestones.push({
        year: currentYear + totalDiff,
        age: futureAge,
        label: `Age ${futureAge}`,
        isOriginal: false
    });

    let html = '';
    milestones.forEach((m, i) => {
        const imgSrc = m.isOriginal
            ? state.uploadedFile
            : (data.generated_images[Math.min(i - 1, data.generated_images.length - 1)] || data.generated_images[0]);

        html += `
            <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content glass-card">
                    <div class="timeline-year">${m.year}</div>
                    <div class="timeline-age">${m.label}</div>
                    <img src="${imgSrc}" alt="${m.label}" loading="lazy">
                </div>
            </div>
        `;
    });

    timeline.innerHTML = html;
}

// ── Future Profile ───────────────────────────────────────
function renderFutureProfile(profile) {
    const container = document.getElementById('futureProfile');
    if (!container || !profile) return;

    container.innerHTML = `
        <div class="profile-card">
            <h3>🔮 Future Profile</h3>
            <div class="profile-section">
                <div class="label">Age & Lifestyle</div>
                <div class="content">Age ${profile.age} — ${profile.lifestyle} lifestyle, ${profile.style} style</div>
            </div>
            <div class="profile-section">
                <div class="label">Possible Lifestyle</div>
                <div class="content">${profile.lifestyle_narrative}</div>
            </div>
            <div class="profile-section">
                <div class="label">Appearance Changes</div>
                <div class="content">${profile.appearance_changes}</div>
            </div>
            <div class="profile-section">
                <div class="label">Fashion Style</div>
                <div class="content">${profile.fashion_style}</div>
            </div>
            <div class="profile-disclaimer">
                ⚠️ ${profile.disclaimer}
            </div>
        </div>
    `;
}

// ── History ──────────────────────────────────────────────
async function loadHistory() {
    const container = document.getElementById('historyGrid');
    if (!container) return;

    try {
        const res = await fetch('/api/history');
        const data = await res.json();

        if (!data.history || data.history.length === 0) {
            container.innerHTML = `
                <div class="history-empty">
                    <div class="empty-icon">📁</div>
                    <h3>No History Yet</h3>
                    <p>Your generated results will appear here.</p>
                </div>
            `;
            return;
        }

        let html = '';
        data.history.forEach(gen => {
            const date = new Date(gen.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            const params = gen.params;
            const isDemo = gen.ai_provider === 'demo';

            html += `
                <div class="history-card" id="history-${gen.id}">
                    <div class="history-images">
                        <img src="${gen.original_url}" alt="Original" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/><text fill=%22%23666%22 x=%2250%22 y=%2255%22 text-anchor=%22middle%22 font-size=%2212%22>No img</text></svg>'">
                        ${gen.generated_urls[0] ? `<img src="${gen.generated_urls[0]}" alt="Generated" onerror="this.style.display='none'">` : ''}
                    </div>
                    <div class="history-info">
                        <div class="history-date">${date} ${isDemo ? '• Demo' : ''}</div>
                        <div class="history-params">
                            <span>Age ${params.currentAge} → ${params.futureAge}</span>
                            <span>${params.lifestyle}</span>
                            <span>${params.fitness}</span>
                            <span>${params.clothing}</span>
                        </div>
                        <button class="btn btn-sm btn-danger" style="margin-top:8px" onclick="deleteHistory(${gen.id})">🗑️ Delete</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (err) {
        showToast('Failed to load history', 'error');
    }
}

async function deleteHistory(id) {
    if (!confirm('Delete this generation? This cannot be undone.')) return;

    try {
        const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');

        const card = document.getElementById(`history-${id}`);
        if (card) {
            card.style.animation = 'fade-in 0.3s ease reverse';
            setTimeout(() => card.remove(), 300);
        }
        showToast('Deleted successfully', 'success');

        // Check if empty
        setTimeout(() => {
            const grid = document.getElementById('historyGrid');
            if (grid && grid.children.length === 0) loadHistory();
        }, 400);
    } catch (err) {
        showToast('Failed to delete', 'error');
    }
}

// ── Fullscreen Modal ─────────────────────────────────────
function viewFullscreen(imgUrl) {
    const modal = document.getElementById('fullscreenModal');
    const img = document.getElementById('fullscreenImage');
    img.src = imgUrl;
    modal.classList.add('active');
}

function closeFullscreen() {
    document.getElementById('fullscreenModal').classList.remove('active');
}

// Close on overlay click
document.addEventListener('click', (e) => {
    if (e.target.id === 'fullscreenModal') closeFullscreen();
});

// Close on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeFullscreen();
});

// ── Download ─────────────────────────────────────────────
function downloadImage(url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `futureme_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Download started!', 'success');
}

// ── Generate Again ───────────────────────────────────────
function generateAgain() {
    showSection('params');
    goToStep(0);
}

// ── Toast Notifications ──────────────────────────────────
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slide-in-right 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ── Utility ──────────────────────────────────────────────
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ── 6-Stage Age Progression Grid (18, 25, 30, 35, 40, 50 Yosh) ────
async function generateAgeGrid() {
    if (!state.uploadedFileName) {
        showToast('Please upload a photo first!', 'error');
        showSection('upload');
        return;
    }

    showLoading();
    updateLoadingMessage('Generating 6-Stage Age Grid...', 'Creating 18, 25, 30, 35, 40, 50 Yosh portraits', 40);

    const formData = new FormData();
    formData.append('image_filename', state.uploadedFileName);
    formData.append('lifestyle', state.params.lifestyle || 'Normal');
    formData.append('fitness', state.params.fitness || 'Average');
    formData.append('facial_hair', state.params.facialHair || 'Auto');

    try {
        const res = await fetch('/api/generate_grid', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        hideLoading();

        if (data.status === 'success' && data.grid) {
            const ageGridSection = document.getElementById('ageGridSection');
            const ageGridCards = document.getElementById('ageGridCards');

            if (ageGridSection && ageGridCards) {
                ageGridCards.innerHTML = data.grid.map(item => `
                    <div class="result-card glass-card" style="overflow:hidden">
                        <div class="card-image" style="position:relative">
                            <img src="${item.image_url}" alt="${item.age} yosh" style="width:100%;height:320px;object-fit:cover;display:block">
                            <div style="position:absolute;bottom:12px;right:12px;background:rgba(0,0,0,0.75);color:#f59e0b;font-weight:700;font-size:12px;padding:4px 10px;border-radius:12px;border:1px solid rgba(245,158,11,0.3)">
                                DEMO MODE
                            </div>
                        </div>
                        <div class="card-body" style="text-align:center">
                            <div style="font-size:22px;font-weight:800;color:white;font-family:'Space Grotesk',sans-serif">
                                ${item.age} yosh
                            </div>
                            <div style="font-size:13px;color:var(--text-secondary);margin-top:4px">
                                ${item.age <= 22 ? 'Youthful & Clean Shaven' : item.age <= 32 ? 'Defined Jaw & Faint Stubble' : item.age <= 42 ? 'Salt & Pepper Hair + Stubble' : 'Silver Grey Hair & Mature Character'}
                            </div>
                        </div>
                    </div>
                `).join('');

                ageGridSection.style.display = 'block';
                showSection('results');
                ageGridSection.scrollIntoView({ behavior: 'smooth' });
                showToast('6-Stage Age Grid Generated!', 'success');
            }
        } else {
            showToast('Failed to generate age grid', 'error');
        }
    } catch (err) {
        hideLoading();
        console.error('Grid generation error:', err);
        showToast('Server error generating age grid', 'error');
    }
}

