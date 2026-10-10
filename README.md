# SkinScan — AI-assisted Skin Lesion Screening 🔍

**SkinScan** คือแอปพลิเคชันบนสมาร์ทโฟนที่พัฒนาขึ้นเพื่อเป็นเครื่องมือช่วยคัดกรองความผิดปกติของรอยโรคบนผิวหนังเบื้องต้น โดยใช้เทคโนโลยีปัญญาประดิษฐ์ (AI) ในการวิเคราะห์ภาพถ่าย เพื่อประเมินระดับความเสี่ยงและใช้เป็นข้อมูลประกอบการตัดสินใจในการเข้าพบแพทย์

---

## สมาชิกในกลุ่มและบทบาทหน้าที่
- นาย ภูมิพัฒน์ กีรติเกรียงไกร
6704035612106 ผู้ใช้งานตัวอย่างและรับผิดชอบการพัฒนา Backend , เชื่อมต่อ API และ System Integration
- น.ส. นิภาวรรณ มาดล 6704035612017 ผู้แนะนำแอปและรับผิดชอบการฝึกสอนโมเดล AI และ System Integration 
- น.ส.สิริสารามา พุดนอก 6704035616152
นำเสนอระบบและรับผิดชอบการออกแบบ UI/UX
- น.ส.ชนกานต์ ประสงค์ทรัพย์ 6704035617132 นำเสนอสถาปัตยกรรม และรับผิดชอบการรวบรวมข้อมูลและทดสอบระบบ

---

## ปัญหาและแรงจูงใจ (Motivation)
ปัญหามะเร็งผิวหนังและโรคผิวหนังมีแนวโน้มเพิ่มขึ้นอย่างต่อเนื่อง รอยโรคในระยะเริ่มต้นมักมีขนาดเล็กหรือมีการเปลี่ยนแปลงที่สังเกตได้ยาก ทำให้ผู้ป่วยอาจมองข้ามและไม่ไปพบแพทย์ SkinScan จึงถูกพัฒนาขึ้นเพื่อเป็นเครื่องมือช่วยคัดกรองและติดตามการเปลี่ยนแปลงของรอยโรคเบื้องต้น เพื่อให้ผู้ใช้ตระหนักถึงความผิดปกติและเข้ารับการประเมินจากแพทย์ได้อย่างทันท่วงที

---

## ฟีเจอร์หลักและฟีเจอร์ขั้นสูง (Features)
**ฟีเจอร์หลัก (Main Features):**
1. **สแกนตรวจโรค (AI Lesion Screening):** รับข้อมูลภาพถ่ายจากผู้ใช้เพื่อส่งไปให้ AI วิเคราะห์ และแสดงผลลัพธ์การจัดระดับความเสี่ยง (Triage-style workflow)
2. **ประวัติการตรวจโรค (Dashboard/History):** บันทึกและแสดงประวัติรอยโรคของผู้ใช้ (Patient/session history) เพื่อให้สามารถติดตามผลย้อนหลังได้
3. **คลังความรู้ (Knowledge Hub):** ให้ข้อมูลเกี่ยวกับโรคผิวหนังและอาการเบื้องต้นเพื่อความเข้าใจที่ถูกต้อง
4. **โปรไฟล์ (Profile):** จัดการข้อมูลส่วนตัวและแสดงหน้า Consent/privacy notice ก่อนเริ่มใช้งาน

**ฟีเจอร์ขั้นสูง (Advanced Feature):**
- **การวิเคราะห์ภาพด้วย AI เชิงลึก (Advanced AI Lesion Analysis & Explainability):** ระบบใช้โมเดล Deep Learning ที่ผ่านการฝึกสอน (Train) ด้วยชุดข้อมูลภาพทางการแพทย์เฉพาะทาง (เช่น HAM10000) ผ่าน Google Colab โดยเมื่อวิเคราะห์ภาพเสร็จสิ้น ระบบจะไม่เพียงแค่บอกผลลัพธ์ แต่จะแสดงค่าความมั่นใจของโมเดล (Confidence Score / Probability) พร้อมระบบอธิบายผลเบื้องต้น (Basic Explainability) เช่น การไฮไลต์พื้นที่ (Highlighted region) บริเวณที่พบความผิดปกติบนภาพถ่าย เพื่อให้ผู้ใช้เข้าใจเหตุผลของการประเมินได้ชัดเจนยิ่งขึ้น
---

## แผนภาพสถาปัตยกรรมของระบบ (System Architecture)
([<img width="925" height="474" alt="Diagram" src="https://github.com/user-attachments/assets/c8ec35b3-b9ad-45ee-8e5d-fca9fc3e7fb2" />
])
*ระบบประกอบด้วย Frontend ที่พัฒนาด้วย React Native เชื่อมต่อผ่าน REST API ไปยัง Backend Server และ AI Inference Server ที่ใช้ประมวลผลภาพถ่ายด้วยโมเดล Deep Learning ที่อยู่บน Cloud เพื่อลดภาระการทำงานของสมาร์ทโฟน

---

## ขั้นตอนการติดตั้ง (Installation)
1. ติดตั้ง Node.js และ Git ลงในเครื่องคอมพิวเตอร์
2. โคลน (Clone) Repository ของโปรเจกต์นี้:
   ```bash
   git clone [https://github.com/phumpatkee/Dear.git]
3.เข้าไปในโฟลเดอร์โปรเจกต์และติดตั้ง Dependencies:
cd skin-scan-app
npm install

---

## วิธีรันแอป (How to Run)
รันคำสั่งด้านล่างใน Terminal เพื่อเปิดใช้งานแอปพลิเคชันผ่าน Expo:

npx expo start

สามารถทดสอบการใช้งานได้โดยการสแกน QR Code ผ่านแอปพลิเคชัน Expo Go บนสมาร์ทโฟน

---

## การตั้งค่า API / ฐานข้อมูล / AI / เซนเซอร์
1. API (REST API Integration): ใช้สื่อสารข้อมูลข้ามระบบเพื่อรับส่งภาพถ่ายระหว่างแอปพลิเคชันและโมเดล AI บนเซิร์ฟเวอร์  
2. AI (Inference Server): โมเดล AI ถูกฝึกสอนด้วยชุดข้อมูลรอยโรค (HAM10000) ผ่าน Google Colab แปลงไฟล์เป็นรูปแบบที่เหมาะสม (.tflite / Hugging Face API) และทำงานบน Cloud เพื่อประมวลผลภาพ  
 3.ฐานข้อมูล (Data and Storage): ใช้โครงสร้าง Structured data schema เก็บข้อมูลพร้อม Timestamp และ Metadata โดยผสมผสาน Local persistent storage และ Cloud database 

---

## ภาพหน้าจอ (Screenshots)
<img width="868" height="1886" alt="Login" src="https://github.com/user-attachments/assets/2603b2db-feec-4092-b781-02b00603f701" />
<img width="868" height="1886" alt="Register" src="https://github.com/user-attachments/assets/424b01a2-60f1-4c0a-946c-439efabba102" />
<img width="868" height="1886" alt="Scan" src="https://github.com/user-attachments/assets/04f9559b-a580-45e6-a88e-7822cb62ce37" />
<img width="868" height="1886" alt="Scan result (2)" src="https://github.com/user-attachments/assets/92886bdc-d82c-47b2-8a63-c29ad31cb98b" />
<img width="868" height="1886" alt="Scan result" src="https://github.com/user-attachments/assets/60e97f6f-e907-4045-be8a-0f46655d42ee" />
<img width="868" height="1886" alt="image" src="https://github.com/user-attachments/assets/8570859f-da81-4140-a8af-aeb1ecac52a3" />
<img width="868" height="1886" alt="image" src="https://github.com/user-attachments/assets/b156e86c-8440-4c00-8e83-9e4f456ba958" />
<img width="868" height="1886" alt="image" src="https://github.com/user-attachments/assets/ade44e80-1a94-44c7-a4e4-2557d1aa4066" />
<img width="868" height="1886" alt="image" src="https://github.com/user-attachments/assets/97f280ae-48f6-460b-9ae9-01a994a5f64c" />
<img width="868" height="1886" alt="image" src="https://github.com/user-attachments/assets/a8a5d00d-4ff2-440c-b39f-f2db1a6251c1" />
<img width="868" height="1886" alt="image" src="https://github.com/user-attachments/assets/282c3be1-86bb-42a9-b72f-49b9ae712cc6" />
<img width="868" height="1886" alt="image" src="https://github.com/user-attachments/assets/041694c8-6db4-4cd3-b85a-fe66b7924806" />
<img width="868" height="1886" alt="image" src="https://github.com/user-attachments/assets/1627f9ea-c943-41c5-a8ae-404e768ebc10" />
<img width="868" height="1886" alt="image" src="https://github.com/user-attachments/assets/c5d5df4c-ef96-4423-84d1-fe9f7b0f5db2" />














---

## ลิงก์วิดีโอสาธิต (Live Demo Video)
https://drive.google.com/file/d/1arQTpvmEFjtun3i2FxliU7xqp8y7kQoI/view?usp=sharing

---

## ข้อจำกัด (Limitations)
 1.การแสดงผลและการวิเคราะห์ภาพถ่ายที่มีความละเอียดสูงอาจมีความล่าช้า ขึ้นอยู่กับความเร็วของอินเทอร์เน็ตขณะเรียกใช้ AI Inference API  
 2.สภาพแวดล้อมขณะถ่ายภาพ เช่น แสงสว่างที่ไม่เหมาะสม หรือเงาตกกระทบ อาจส่งผลให้ AI วิเคราะห์ผลคลาดเคลื่อนได้ 

---

##แนวทางการพัฒนาต่อในอนาคต (Future Work)
 1.ปรับปรุงชุดข้อมูลที่ใช้ฝึกสอนโมเดล (Dataset) ให้มีความหลากหลายมากขึ้น เพื่อเพิ่มความแม่นยำในการระบุประเภทของรอยโรค
 2.พัฒนาระบบเชื่อมต่อกับคลินิกหรือสถานพยาบาลปฐมภูมิ เพื่อใช้เป็นเครื่องมือคัดกรองเบื้องต้นก่อนส่งต่อผู้ป่วย 

---

##คำชี้แจงการใช้งานอย่างรับผิดชอบ (Medical Disclaimer)
คำเตือน: แอปพลิเคชัน SkinScan ไม่ใช่อุปกรณ์วินิจฉัยหรือรักษาทางการแพทย์ (Not a Medical Device)
แอปพลิเคชันนี้จัดทำขึ้นเป็น Prototype เพื่อการศึกษา โดยทำหน้าที่เป็นเพียง "เครื่องมือช่วยคัดกรองเบื้องต้น" ผลลัพธ์จากการวิเคราะห์ด้วย AI ไม่สามารถใช้ทดแทนการวินิจฉัยจากแพทย์ผู้เชี่ยวชาญได้ หากพบความผิดปกติของรอยโรคหรือมีความกังวล โปรดเข้าปรึกษาแพทย์โดยตรง
