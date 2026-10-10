from pathlib import Path
import shutil
import pandas as pd
from sklearn.model_selection import train_test_split

# ============================================================
# HAM10000 -> 3 classes for this student prototype
# mel -> melanoma
# nv  -> nevus
# everything else -> benign
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent
META_CSV = BASE_DIR / "HAM10000_metadata.csv"
IMAGE_DIRS = [
    BASE_DIR / "HAM10000_images_part_1",
    BASE_DIR / "HAM10000_images_part_2",
]
OUT_DIR = BASE_DIR / "dataset"
SEED = 42

LABEL_MAP = {
    "mel": "melanoma",
    "nv": "nevus",
    "akiec": "benign",
    "bcc": "benign",
    "bkl": "benign",
    "df": "benign",
    "vasc": "benign",
}


def find_image(image_id: str):
    filename = f"{image_id}.jpg"
    for folder in IMAGE_DIRS:
        path = folder / filename
        if path.exists():
            return path
    return None


def main():
    if not META_CSV.exists():
        raise FileNotFoundError(f"ไม่พบ {META_CSV}")

    df = pd.read_csv(META_CSV)
    required = {"image_id", "dx"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"CSV ขาด column: {sorted(missing)}")

    df["label"] = df["dx"].map(LABEL_MAP)
    df = df.dropna(subset=["label"]).copy()

    paths = []
    missing_images = []
    for image_id in df["image_id"]:
        path = find_image(image_id)
        paths.append(path)
        if path is None:
            missing_images.append(image_id)

    if missing_images:
        print(f"Warning: ไม่พบรูป {len(missing_images)} รูป; จะข้าม")

    df["path"] = paths
    df = df.dropna(subset=["path"]).reset_index(drop=True)

    # 70/15/15 stratified split
    train_df, temp_df = train_test_split(
        df,
        test_size=0.30,
        random_state=SEED,
        stratify=df["label"],
    )
    val_df, test_df = train_test_split(
        temp_df,
        test_size=0.50,
        random_state=SEED,
        stratify=temp_df["label"],
    )

    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)

    for split_name, split_df in [
        ("train", train_df),
        ("validation", val_df),
        ("test", test_df),
    ]:
        for label in ["benign", "melanoma", "nevus"]:
            (OUT_DIR / split_name / label).mkdir(parents=True, exist_ok=True)

        for _, row in split_df.iterrows():
            src = Path(row["path"])
            dst = OUT_DIR / split_name / row["label"] / src.name
            shutil.copy2(src, dst)

        print(f"{split_name}: {len(split_df)} images")
        print(split_df["label"].value_counts().sort_index())

    print("\nเสร็จแล้ว -> dataset/")


if __name__ == "__main__":
    main()
