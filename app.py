from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from PIL import Image
from io import BytesIO

import torch
import torch.nn as nn
from torchvision import models, transforms


# =========================================================
# CONFIG
# =========================================================

MODEL_PATH = "skinscan_resnet18.pth"

device = torch.device("cpu")


# =========================================================
# LOAD CHECKPOINT
# =========================================================

print("Loading checkpoint...")

checkpoint = torch.load(
    MODEL_PATH,
    map_location=device
)

print("Checkpoint loaded!")

print("Checkpoint keys:")
print(checkpoint.keys())


# =========================================================
# READ MODEL INFORMATION FROM CHECKPOINT
# =========================================================

CLASS_NAMES = checkpoint["class_names"]

IMAGE_SIZE = checkpoint.get("image_size", 224)

MEAN = checkpoint.get(
    "mean",
    [0.485, 0.456, 0.406]
)

STD = checkpoint.get(
    "std",
    [0.229, 0.224, 0.225]
)

print("Class names:", CLASS_NAMES)
print("Image size:", IMAGE_SIZE)
print("Mean:", MEAN)
print("Std:", STD)


# =========================================================
# CREATE RESNET18
# =========================================================

print("Creating ResNet18...")

model = models.resnet18(weights=None)

model.fc = nn.Linear(
    model.fc.in_features,
    len(CLASS_NAMES)
)


# =========================================================
# LOAD MODEL STATE
# =========================================================

model.load_state_dict(
    checkpoint["model_state_dict"]
)

model.to(device)
model.eval()

print("Model loaded successfully!")


# =========================================================
# IMAGE TRANSFORM
# =========================================================

transform = transforms.Compose([
    transforms.Resize(
        (IMAGE_SIZE, IMAGE_SIZE)
    ),

    transforms.ToTensor(),

    transforms.Normalize(
        mean=MEAN,
        std=STD
    )
])


# =========================================================
# FASTAPI
# =========================================================

app = FastAPI(
    title="SkinScan AI API",
    description="Skin lesion classification API using ResNet18",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "status": "online",
        "service": "SkinScan AI API",
        "model": "ResNet18",
        "classes": CLASS_NAMES
    }


# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
def health():

    return {
        "status": "healthy",
        "model_loaded": True,
        "model": "ResNet18",
        "classes": CLASS_NAMES
    }


# =========================================================
# PREDICT
# =========================================================

@app.post("/predict")
async def predict(
    file: UploadFile = File(...)
):

    allowed_types = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp"
    ]

    if file.content_type not in allowed_types:

        raise HTTPException(
            status_code=400,
            detail="กรุณาอัปโหลดไฟล์ JPG, PNG หรือ WEBP"
        )

    try:

        # ---------------------------------------------
        # READ IMAGE
        # ---------------------------------------------

        contents = await file.read()

        image = Image.open(
            BytesIO(contents)
        ).convert("RGB")


        # ---------------------------------------------
        # PREPROCESS
        # ---------------------------------------------

        input_tensor = transform(image)

        input_tensor = input_tensor.unsqueeze(0)

        input_tensor = input_tensor.to(device)


        # ---------------------------------------------
        # MODEL INFERENCE
        # ---------------------------------------------

        with torch.no_grad():

            outputs = model(input_tensor)

            probabilities = torch.softmax(
                outputs,
                dim=1
            )[0]


        # ---------------------------------------------
        # GET PREDICTION
        # ---------------------------------------------

        confidence, predicted_index = torch.max(
            probabilities,
            dim=0
        )

        predicted_index = predicted_index.item()

        confidence = confidence.item()

        prediction = CLASS_NAMES[predicted_index]


        # ---------------------------------------------
        # ALL SCORES
        # ---------------------------------------------

        scores = {}

        for i, class_name in enumerate(CLASS_NAMES):

            scores[class_name] = round(
                probabilities[i].item(),
                6
            )


        # ---------------------------------------------
        # RISK LEVEL
        # ---------------------------------------------

        if prediction.lower() == "melanoma":

            risk_level = "Urgent"

        else:

            risk_level = "Low"


        # ---------------------------------------------
        # RESPONSE
        # ---------------------------------------------

        return {

            "prediction": prediction,

            "confidence": round(
                confidence,
                6
            ),

            "risk_level": risk_level,

            "scores": scores
        }


    except Exception as e:

        print(
            "Prediction error:",
            str(e)
        )

        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถวิเคราะห์รูปภาพได้: {str(e)}"
        )