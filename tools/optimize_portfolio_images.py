#!/usr/bin/env python3
"""Resize public portfolio JPEG/WebP assets to a 1600px long edge.

Keeps filenames, formats, aspect ratios, EXIF copyright metadata and ICC profiles.
PNG/SVG/ICO assets and animated WebP files are left untouched.
"""
from pathlib import Path
from PIL import Image, ImageOps
import json
import os

ROOT = Path("images")
MAX_EDGE = 1600
JPEG_QUALITY = 80
WEBP_QUALITY = 80
SUPPORTED = {".jpg", ".jpeg", ".webp"}

def format_mb(n):
    return round(n / (1024 * 1024), 2)

def optimize(path: Path):
    original_bytes = path.stat().st_size
    try:
        with Image.open(path) as source:
            if getattr(source, "n_frames", 1) > 1:
                return {"status": "skipped_animated", "bytes_before": original_bytes, "bytes_after": original_bytes}
            exif = source.getexif()
            if exif:
                # The pixels are physically orientation-corrected below.
                exif[274] = 1
                exif_bytes = exif.tobytes()
            else:
                exif_bytes = None
            icc = source.info.get("icc_profile")
            image = ImageOps.exif_transpose(source)
            width, height = image.size
            long_edge = max(width, height)
            if long_edge <= MAX_EDGE:
                return {"status": "already_within_limit", "bytes_before": original_bytes, "bytes_after": original_bytes}
            scale = MAX_EDGE / float(long_edge)
            new_size = (max(1, round(width * scale)), max(1, round(height * scale)))
            image = image.resize(new_size, Image.Resampling.LANCZOS)
            temp = path.with_name(path.stem + ".optimized" + path.suffix)

            if path.suffix.lower() in {".jpg", ".jpeg"}:
                if image.mode not in {"RGB", "L"}:
                    image = image.convert("RGB")
                save_args = {
                    "format": "JPEG",
                    "quality": JPEG_QUALITY,
                    "optimize": True,
                    "progressive": True,
                    "subsampling": 2,
                }
                if exif_bytes:
                    save_args["exif"] = exif_bytes
                if icc:
                    save_args["icc_profile"] = icc
                image.save(temp, **save_args)
            else:
                if image.mode not in {"RGB", "RGBA", "L", "LA"}:
                    image = image.convert("RGBA" if "transparency" in source.info else "RGB")
                save_args = {"format": "WEBP", "quality": WEBP_QUALITY, "method": 6}
                if exif_bytes:
                    save_args["exif"] = exif_bytes
                if icc:
                    save_args["icc_profile"] = icc
                image.save(temp, **save_args)

            os.replace(temp, path)
            return {
                "status": "resized",
                "width_before": width,
                "height_before": height,
                "width_after": new_size[0],
                "height_after": new_size[1],
                "bytes_before": original_bytes,
                "bytes_after": path.stat().st_size,
            }
    except Exception as exc:
        return {"status": "error", "error": str(exc), "bytes_before": original_bytes, "bytes_after": original_bytes}

def main():
    if not ROOT.exists():
        raise SystemExit("images/ folder not found")
    files = sorted(p for p in ROOT.rglob("*") if p.is_file() and p.suffix.lower() in SUPPORTED)
    total_before = sum(p.stat().st_size for p in files)
    results = []
    for path in files:
        result = optimize(path)
        result["path"] = str(path)
        results.append(result)

    resized = [r for r in results if r["status"] == "resized"]
    errors = [r for r in results if r["status"] == "error"]
    skipped_animated = [r for r in results if r["status"] == "skipped_animated"]
    total_after = sum(p.stat().st_size for p in files)

    oversized = []
    for path in files:
        try:
            with Image.open(path) as im:
                if max(im.size) > MAX_EDGE and getattr(im, "n_frames", 1) == 1:
                    oversized.append({"path": str(path), "size": im.size})
        except Exception as exc:
            errors.append({"path": str(path), "status": "verify_error", "error": str(exc)})

    report = {
        "files_scanned": len(files),
        "files_resized": len(resized),
        "already_within_limit": sum(r["status"] == "already_within_limit" for r in results),
        "animated_skipped": len(skipped_animated),
        "errors": errors,
        "oversized_remaining": oversized,
        "max_long_edge_px": MAX_EDGE,
        "jpeg_quality": JPEG_QUALITY,
        "webp_quality": WEBP_QUALITY,
        "total_before_mb": format_mb(total_before),
        "total_after_mb": format_mb(total_after),
        "reduction_percent": round((1 - total_after / total_before) * 100, 1) if total_before else 0,
    }
    print(json.dumps(report, indent=2))
    Path("image-optimization-report.json").write_text(json.dumps(report, indent=2) + "\n")
    if errors or oversized:
        raise SystemExit("Image optimization verification failed; review report before deployment.")

if __name__ == "__main__":
    main()
