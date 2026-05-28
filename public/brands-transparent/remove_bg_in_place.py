from PIL import Image
import numpy as np
from pathlib import Path
import shutil

folder = Path.cwd()
backup_folder = folder / "_backup_original_logos"
backup_folder.mkdir(exist_ok=True)

supported = [".png", ".jpg", ".jpeg", ".webp"]

def remove_background_in_place(path, tolerance=46, softness=28):
    img = Image.open(path).convert("RGBA")
    arr = np.array(img).astype(np.float32)

    rgb = arr[:, :, :3]
    alpha = arr[:, :, 3]

    h, w = rgb.shape[:2]

    # Estimate background from image edges
    edge_size = max(3, min(10, h // 10, w // 10))

    top = rgb[:edge_size, :, :]
    bottom = rgb[h-edge_size:h, :, :]
    left = rgb[:, :edge_size, :]
    right = rgb[:, w-edge_size:w, :]

    edge_pixels = np.concatenate([
        top.reshape(-1, 3),
        bottom.reshape(-1, 3),
        left.reshape(-1, 3),
        right.reshape(-1, 3),
    ], axis=0)

    bg = np.median(edge_pixels, axis=0)

    distance = np.linalg.norm(rgb - bg, axis=2)

    max_channel = rgb.max(axis=2)
    min_channel = rgb.min(axis=2)
    saturation = max_channel - min_channel

    # Remove white / light gray background
    light_gray_bg = (max_channel > 170) & (saturation < 55)

    # Remove pixels close to the detected edge background
    close_bg = distance < tolerance

    remove_mask = light_gray_bg | close_bg

    # Soft edge instead of hard cut
    soft = np.clip((tolerance + softness - distance) / softness, 0, 1)
    soft = np.maximum(soft, remove_mask.astype(np.float32))

    new_alpha = alpha * (1 - soft)

    # Protect dark logo parts
    dark_logo = max_channel < 125
    new_alpha[dark_logo] = alpha[dark_logo]

    arr[:, :, 3] = np.clip(new_alpha, 0, 255)

    result = Image.fromarray(arr.astype(np.uint8), "RGBA")

    # Always save as PNG format but keep the same filename.
    # If the file is .jpg, it will still be saved with .jpg extension problem.
    # So only overwrite PNG/WebP safely.
    result.save(path)

files = [
    f for f in folder.iterdir()
    if f.is_file()
    and f.suffix.lower() in supported
    and f.name != "remove_bg_in_place.py"
]

if not files:
    print("No logo image files found in this folder.")
    raise SystemExit

print(f"Working folder: {folder}")
print(f"Found {len(files)} image files.")

for file in files:
    backup_file = backup_folder / file.name

    if not backup_file.exists():
        shutil.copy2(file, backup_file)

    try:
        # If JPG/JPEG, convert to PNG with same base name
        if file.suffix.lower() in [".jpg", ".jpeg", ".webp"]:
            png_file = folder / f"{file.stem}.png"
            remove_background_in_place(file)
            Image.open(file).convert("RGBA").save(png_file, "PNG")
            print(f"Converted and cleaned: {file.name} -> {png_file.name}")
        else:
            remove_background_in_place(file)
            print(f"Cleaned: {file.name}")

    except Exception as e:
        print(f"Failed: {file.name} | {e}")

print("")
print("Done.")
print(f"Original backups saved in: {backup_folder}")
