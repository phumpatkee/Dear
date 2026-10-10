import onnxruntime as ort
import numpy as np
from PIL import Image
import sys


MODEL_PATH = r"C:\Users\user\Desktop\Skin-scan-app\skinscan_ai_fullset\model\skinscan_resnet18.onnx"


LABELS = [
    "benign",
    "melanoma",
    "nevus"
]


# =====================================================
# CHECK IMAGE ARGUMENT
# =====================================================

if len(sys.argv) < 2:
    print("กรุณาใส่ path ของรูป")
    print('ตัวอย่าง:')
    print(r'py test_onnx.py "C:\Users\user\Desktop\test.jpg"')
    sys.exit(1)


IMAGE_PATH = sys.argv[1]


# =====================================================
# LOAD ONNX
# =====================================================

print("Loading ONNX model...")

session = ort.InferenceSession(
    MODEL_PATH,
    providers=["CPUExecutionProvider"]
)

input_info = session.get_inputs()[0]
output_info = session.get_outputs()[0]

print("Input name :", input_info.name)
print("Input shape:", input_info.shape)
print("Output name:", output_info.name)
print("Output shape:", output_info.shape)


# =====================================================
# LOAD IMAGE
# =====================================================

print("Loading image...")

image = Image.open(
    IMAGE_PATH
).convert("RGB")


# =====================================================
# RESIZE
# =====================================================

image = image.resize(
    (224, 224)
)


# =====================================================
# TO NUMPY
# =====================================================

image = np.asarray(
    image,
    dtype=np.float32
)


# =====================================================
# NORMALIZE 0-1
# =====================================================

image = image / 255.0


# =====================================================
# IMAGENET NORMALIZATION
# =====================================================

mean = np.array(
    [0.485, 0.456, 0.406],
    dtype=np.float32
)

std = np.array(
    [0.229, 0.224, 0.225],
    dtype=np.float32
)

image = (
    image - mean
) / std


# =====================================================
# HWC -> CHW
# =====================================================

image = np.transpose(
    image,
    (2, 0, 1)
)


# =====================================================
# ADD BATCH
# =====================================================

image = np.expand_dims(
    image,
    axis=0
).astype(np.float32)


# =====================================================
# RUN MODEL
# =====================================================

print("Running inference...")

output = session.run(
    [output_info.name],
    {
        input_info.name: image
    }
)[0]


logits = output[0]


# =====================================================
# SOFTMAX
# =====================================================

exp_values = np.exp(
    logits - np.max(logits)
)

probabilities = (
    exp_values /
    np.sum(exp_values)
)


# =====================================================
# BEST CLASS
# =====================================================

best_index = int(
    np.argmax(probabilities)
)

confidence = float(
    probabilities[best_index]
)


# =====================================================
# RESULT
# =====================================================

print()
print("====================================")
print("AI RESULT")
print("====================================")

for i, label in enumerate(LABELS):
    print(
        f"{label}: "
        f"{probabilities[i] * 100:.2f}%"
    )

print("------------------------------------")

print(
    "Prediction:",
    LABELS[best_index]
)

print(
    "Confidence:",
    f"{confidence * 100:.2f}%"
)

print("====================================")