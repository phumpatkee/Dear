# SkinScan AI - Train -> API -> React Native

ชุดนี้ต่อให้ครบตั้งแต่ HAM10000 -> train.py -> FastAPI -> Hugging Face Space -> App.tsx

## 1) โครงสร้างโปรเจกต์

- `training/prepare_dataset.py` แบ่ง HAM10000 เป็น train/validation/test และรวมเป็น 3 class
- `training/train.py` train ResNet18 และสร้าง `model/skinscan_resnet18.pth`
- `api/app.py` โหลดโมเดลและเปิด `/predict`
- `App.tsx` ส่งรูปจาก Expo ไปยัง API

## 2) เตรียม HAM10000

วางไฟล์/โฟลเดอร์แบบนี้ที่ root:

```
HAM10000_metadata.csv
HAM10000_images_part_1/
HAM10000_images_part_2/
training/
App.tsx
```

จากนั้น:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r training/requirements.txt
python training/prepare_dataset.py
python training/train.py
```

ถ้า PowerShell block script:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
```

หรือไม่ต้อง activate:

```powershell
.\venv\Scripts\python.exe training/prepare_dataset.py
.\venv\Scripts\python.exe training/train.py
```

ผลลัพธ์:

```
model/skinscan_resnet18.pth
model/metrics.json
```

## 3) ทำ Hugging Face Space

สร้าง Space แบบ Docker แล้วเอาไฟล์ใน `api/` ไปไว้ใน root ของ Space:

```
app.py
Dockerfile
requirements.txt
skinscan_resnet18.pth
```

รอ build จน Space ขึ้น แล้วทดสอบ:

- `/` ต้องตอบว่า API is running
- `/health` ต้องตอบ `model_loaded: true`

Endpoint ที่ App ใช้คือ:

```
https://ชื่อ-space-ของมึง.hf.space/predict
```

## 4) ต่อ App.tsx

ใน `App.tsx` เปลี่ยน:

```tsx
const API_URL =
  'https://YOUR-SPACE-NAME.hf.space/predict';
```

เป็น URL จริง เช่น:

```tsx
const API_URL =
  'https://pk20-skinscan-ai.hf.space/predict';
```

จากนั้นรัน Expo ตามปกติ

```powershell
npx expo start
```

## 5) รูปแบบผลลัพธ์

API จะตอบประมาณนี้:

```json
{
  "prediction": "nevus",
  "confidence": 0.91,
  "risk_level": "Low",
  "scores": {
    "benign": 0.03,
    "melanoma": 0.06,
    "nevus": 0.91
  }
}
```

App จะแสดง `prediction`, `confidence` และ `risk_level` ให้อัตโนมัติ

## สำคัญ

นี่เป็น prototype สำหรับโปรเจกต์การศึกษา ไม่ใช่ระบบวินิจฉัยโรคทางคลินิก การรวม HAM10000 เป็น 3 class เป็นการลดรูปเพื่อทำต้นแบบ และ `risk_level` ใน API เป็นกฎของ UI ไม่ใช่คะแนนความเสี่ยงทางการแพทย์
