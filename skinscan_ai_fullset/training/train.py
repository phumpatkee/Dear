from pathlib import Path
import copy
import json
import time

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms
from torchvision.models import ResNet18_Weights

# ============================================================
# Config
# ============================================================
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "dataset"
MODEL_DIR = BASE_DIR / "model"
MODEL_DIR.mkdir(exist_ok=True)

IMAGE_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 15
LEARNING_RATE = 1e-4
NUM_WORKERS = 0  # Windows-friendly
SEED = 42

CLASSES = ["benign", "melanoma", "nevus"]


def seed_everything(seed=42):
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


def main():
    seed_everything(SEED)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    if not (DATA_DIR / "train").exists():
        raise FileNotFoundError(
            "ไม่พบ dataset/train กรุณารัน training/prepare_dataset.py ก่อน"
        )

    train_tfms = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.10),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
    ])

    eval_tfms = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
    ])

    train_ds = datasets.ImageFolder(DATA_DIR / "train", transform=train_tfms)
    val_ds = datasets.ImageFolder(DATA_DIR / "validation", transform=eval_tfms)
    test_ds = datasets.ImageFolder(DATA_DIR / "test", transform=eval_tfms)

    print("Class mapping:", train_ds.class_to_idx)

    train_loader = DataLoader(
        train_ds, batch_size=BATCH_SIZE, shuffle=True,
        num_workers=NUM_WORKERS, pin_memory=torch.cuda.is_available()
    )
    val_loader = DataLoader(
        val_ds, batch_size=BATCH_SIZE, shuffle=False,
        num_workers=NUM_WORKERS, pin_memory=torch.cuda.is_available()
    )
    test_loader = DataLoader(
        test_ds, batch_size=BATCH_SIZE, shuffle=False,
        num_workers=NUM_WORKERS, pin_memory=torch.cuda.is_available()
    )

    # Pretrained ImageNet backbone + 3-class head.
    weights = ResNet18_Weights.DEFAULT
    model = models.resnet18(weights=weights)
    model.fc = nn.Linear(model.fc.in_features, len(CLASSES))
    model = model.to(device)

    # Class-weighted loss helps when the classes are imbalanced.
    counts = torch.bincount(torch.tensor(train_ds.targets), minlength=len(CLASSES)).float()
    class_weights = counts.sum() / (len(CLASSES) * counts.clamp_min(1))
    criterion = nn.CrossEntropyLoss(weight=class_weights.to(device))
    optimizer = torch.optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode="max", factor=0.5, patience=2
    )

    best_val_acc = -1.0
    best_state = None

    for epoch in range(EPOCHS):
        start = time.time()
        model.train()
        train_correct = 0
        train_total = 0
        train_loss_sum = 0.0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            logits = model(images)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()

            train_loss_sum += loss.item() * labels.size(0)
            train_correct += (logits.argmax(1) == labels).sum().item()
            train_total += labels.size(0)

        model.eval()
        val_correct = 0
        val_total = 0
        val_loss_sum = 0.0

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                logits = model(images)
                loss = criterion(logits, labels)
                val_loss_sum += loss.item() * labels.size(0)
                val_correct += (logits.argmax(1) == labels).sum().item()
                val_total += labels.size(0)

        train_acc = train_correct / max(train_total, 1)
        val_acc = val_correct / max(val_total, 1)
        scheduler.step(val_acc)

        print(
            f"Epoch {epoch+1:02d}/{EPOCHS} | "
            f"train_loss={train_loss_sum/train_total:.4f} "
            f"train_acc={train_acc:.4f} | "
            f"val_loss={val_loss_sum/val_total:.4f} "
            f"val_acc={val_acc:.4f} | "
            f"{time.time()-start:.1f}s"
        )

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_state = copy.deepcopy(model.state_dict())

    if best_state is None:
        raise RuntimeError("ไม่สามารถเก็บ best model ได้")

    model.load_state_dict(best_state)

    # Final test accuracy
    model.eval()
    test_correct = 0
    test_total = 0
    with torch.no_grad():
        for images, labels in test_loader:
            images, labels = images.to(device), labels.to(device)
            logits = model(images)
            test_correct += (logits.argmax(1) == labels).sum().item()
            test_total += labels.size(0)

    test_acc = test_correct / max(test_total, 1)
    print(f"Best validation accuracy: {best_val_acc:.4f}")
    print(f"Test accuracy: {test_acc:.4f}")

    checkpoint = {
        "model_state_dict": model.state_dict(),
        "class_names": CLASSES,
        "image_size": IMAGE_SIZE,
        "mean": [0.485, 0.456, 0.406],
        "std": [0.229, 0.224, 0.225],
    }

    model_path = MODEL_DIR / "skinscan_resnet18.pth"
    torch.save(checkpoint, model_path)

    with open(MODEL_DIR / "metrics.json", "w", encoding="utf-8") as f:
        json.dump(
            {
                "best_validation_accuracy": best_val_acc,
                "test_accuracy": test_acc,
                "classes": CLASSES,
            },
            f,
            ensure_ascii=False,
            indent=2,
        )

    print(f"Saved: {model_path}")


if __name__ == "__main__":
    main()
