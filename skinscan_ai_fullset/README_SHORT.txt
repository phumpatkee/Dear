ลำดับทำงาน:

1. วาง HAM10000_metadata.csv + HAM10000_images_part_1 + HAM10000_images_part_2 ไว้ root
2. pip install -r training/requirements.txt
3. python training/prepare_dataset.py
4. python training/train.py
5. เอา model/skinscan_resnet18.pth ไปไว้ใน Hugging Face Space พร้อม api/app.py, api/Dockerfile, api/requirements.txt
6. เปลี่ยน API_URL ใน App.tsx เป็น https://ชื่อ-space.hf.space/predict
7. แทน uploadAndAnalyze ตาม App_AI_changes.txt
8. npx expo start
