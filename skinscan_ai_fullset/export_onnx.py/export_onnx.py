import torch
import torch.nn as nn
from torchvision import models

# =====================================================
# CONFIG
# =====================================================

PTH_PATH = r"C:\Users\user\Desktop\Skin-scan-app\skinscan_ai_fullset\model\skinscan_resnet18.pth"

ONNX_PATH = r"C:\Users\user\Desktop\Skin-scan-app\skinscan_ai_fullset\model\skinscan_resnet18.onnx"

NUM_CLASSES = 3

CLASS_MAPPING = {
    0: "benign",
    1: "melanoma",
    2: "nevus",
}


# =====================================================
# CREATE RESNET18
# =====================================================

model = models.resnet18(
    weights=None
)

model.fc = nn.Linear(
    model.fc.in_features,
    NUM_CLASSES
)


# =====================================================
# LOAD CHECKPOINT
# =====================================================

print("Loading checkpoint...")

checkpoint = torch.load(
    PTH_PATH,
    map_location="cpu"
)


if isinstance(checkpoint, dict):

    if "state_dict" in checkpoint:
        state_dict = checkpoint["state_dict"]

    elif "model_state_dict" in checkpoint:
        state_dict = checkpoint["model_state_dict"]

    else:
        state_dict = checkpoint

else:
    raise RuntimeError(
        "Unsupported .pth format"
    )


# =====================================================
# REMOVE module. PREFIX
# =====================================================

clean_state_dict = {}

for key, value in state_dict.items():

    if key.startswith("module."):
        key = key[7:]

    clean_state_dict[key] = value


# =====================================================
# LOAD WEIGHTS
# =====================================================

model.load_state_dict(
    clean_state_dict,
    strict=True
)

model.eval()

print("Model loaded successfully")
print("Classes:", CLASS_MAPPING)


# =====================================================
# DUMMY INPUT
# =====================================================

dummy_input = torch.randn(
    1,
    3,
    224,
    224,
    dtype=torch.float32
)


# =====================================================
# EXPORT ONNX
# =====================================================

print("Exporting ONNX...")

torch.onnx.export(
    model,
    dummy_input,
    ONNX_PATH,
    input_names=["input"],
    output_names=["output"],
    opset_version=18,
    dynamo=True,
)

print()
print("======================================")
print("ONNX EXPORT SUCCESS")
print("======================================")
print("Saved:")
print(ONNX_PATH)
print()
print("Input:  [1, 3, 224, 224]")
print("Output: [1, 3]")
print("======================================")