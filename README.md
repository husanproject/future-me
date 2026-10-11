# 🏪 O‘z Do‘konim — AI Smart POS & Supermarket Boshqaruv Tizimi

Ushbu tizim O‘zbekiston chakana savdosi uchun maxsus ishlab chiqilgan, zamonaviy **AI Smart POS**, **FEFO yaroqlilik muddati nazorati**, **Kassir smenalari**, **Chek va qaytarishlar**, **Mijozlar sadoqat dasturi** va to‘liq **PostgreSQL SQL** ma'lumotlar bazasiga ega platformadir.

---

## 🚀 1-USUL: Eng oson va tezkor usul — Docker Compose orqali (Tavsiya etiladi)

Agar kompyuteringizda **Docker Desktop** o‘rnatilgan bo‘lsa, butun tizimni (Frontend + Backend + PostgreSQL + Redis + Nginx) 1 ta buyruq bilan yoqishingiz mumkin:

```bash
# 1. Zip faylni ochgan papkangizga kiring
cd oz-dokonim

# 2. Barcha konteynerlarni ishga tushiring
docker-compose up --build
```

Bir necha daqiqada barcha xizmatlar tayyor bo‘ladi:
- 🌐 **Frontend (Veb-interfeys va POS):** `http://localhost:3000`
- ⚙️ **Backend API va Swagger Docs:** `http://localhost:8000/api/v1/docs`
- 🐘 **PostgreSQL SQL Baza:** `localhost:5432` (baza: `oz_dokonim_db`, login: `postgres`, parol: `postgres_password_2026`)

---

## 💻 2-USUL: Qo‘lda (Manual) ishga tushirish

### A. Frontend (React + TypeScript + Vite) ni ishga tushirish

1. **Node.js (v18 yoki v20+)** o‘rnatilganligiga ishonch hosil qiling.
2. Terminalni oching va loyiha papkasida quyidagilarni bajaring:

```bash
# Kerakli kutubxonalarni o'rnatish
npm install

# Dasturni ishlab chiqish rejimida ishga tushirish
npm run dev
```

Brauzeringizda oching:
👉 **`http://localhost:3000`**

*(Frontend darhol to'liq mustaqil ishlaydi, barcha 24 ta modul, Kamera orqali shtrix-kod skaneri, Sensorli NumPad/qo‘lda kiritish, kassa, chek chop etish va FEFO hisob-kitoblari tayyor).*

---

### B. Backend (Python + FastAPI) ni ishga tushirish (Ixtiyoriy)

1. **Python 3.11+** o‘rnatilgan bo‘lishi lozim.
2. Yangi terminal ochib, quyidagilarni bajaring:

```bash
# Virtual muhit yaratish va faollashtirish
python -m venv venv

# Windows tizimida:
venv\Scripts\activate
# Linux / macOS tizimida:
source venv/bin/activate

# Kutubxonalarni o'rnatish
pip install -r backend/requirements.txt

# .env faylini tayyorlash
cp .env.example .env

# FastAPI serverni ishga tushirish
uvicorn backend.app.main:app --reload --port 8000
```

Backend API hujjati (Swagger):
👉 **`http://localhost:8000/api/v1/docs`**

---

## 🔑 Demo hisob ma'lumotlari (Kirish uchun loginlar)

Tizimda 7 xil RBAC (rollar asosida boshqaruv) mavjud. Yuqori o'ng burchakdagi foydalanuvchini almashtirish orqali yoki quyidagi loginlar bilan kirishingiz mumkin:

| Rol | Ism sharif | Login / Email | Parol | Ruxsatlar |
|---|---|---|---|---|
| 👑 **Super Admin** | Rustam Aliyev | `rustam@ozdokonim.uz` | `admin123` | Barcha 24 ta modulga 100% to'liq ruxsat |
| 🏬 **Do'kon Menejeri** | Dilnoza Umarova | `dilnoza@ozdokonim.uz` | `manager123` | Savdo, ombor, hisobotlar, narx o'zgartirish |
| 💳 **Kassir (POS)** | Jamshid Norov | `jamshid@ozdokonim.uz` | `kassir123` | Kassa (POS), chek chiqarish, to'lovlar, smena |
| 📦 **Ombor mudiri** | Bekzod Rahimov | `bekzod@ozdokonim.uz` | `ombor123` | Kirim, partiyalar (FEFO), inventarizatsiya |
| 🏷️ **Merchandiser** | Malika Karimova | `malika@ozdokonim.uz` | `merch123` | Yaroqlilik muddatlari, diskont, rastalar |
| 📊 **Bosh Auditor** | Jasur Ahmedov | `jasur@ozdokonim.uz` | `audit123` | Audit jurnali, kassa nazorati, tafovutlar |

---

## 🗄️ PostgreSQL SQL Fayllari Joylashuvi

Barcha SQL jadvallar, triggerlar va indekslar `backend/sql/` papkasida tayyor turibdi:
- `backend/sql/01_init_schema.sql` — RBAC, Foydalanuvchilar, Rollar, Huquqlar, Audit jurnali
- `backend/sql/02_products_inventory.sql` — Mahsulotlar, Shtrix-kodlar, Kategoriyalar, Qoldiqlar
- `backend/sql/03_batches_expiry_fefo.sql` — Partiyalar, Ta'minotchilar, FEFO yaroqlilik nazorati
- `backend/sql/04_pos_sales_receipts.sql` — Savdolar, Cheklar, Qaytarishlar (Returns)
- `backend/sql/05_customers_loyalty_promotions.sql` — Mijozlar, Bonus/Keshbek, Aksiyalar
- `backend/sql/06_ai_analytics_and_shifts.sql` — Kassir smenalari, Z-hisobot, AI prognozlar

Agar o'zingizning PostgreSQL serveringiz bo'lsa, ularni tartib bilan `psql` orqali ishga tushirishingiz mumkin.
