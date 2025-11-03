# main.py — corrected MiDaS service (final interpolation fix)
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import torch
import numpy as np
from PIL import Image
import trimesh
import io
import tempfile
import os
import sys
import logging

logging.basicConfig(stream=sys.stdout, level=logging.INFO)
logger = logging.getLogger("holoforge-midas")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load MiDaS model
model_type = "DPT_Large"
logger.info("Loading MiDaS model. This may take a while...")
midas = torch.hub.load("intel-isl/MiDaS", model_type)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
midas.to(device)
midas.eval()
midas_transforms = torch.hub.load("intel-isl/MiDaS", "transforms")
transform = midas_transforms.dpt_transform  # returns a tensor (C,H,W)


def depth_to_mesh(depth_map, image_array, max_depth=2.0, downscale=1):
    if downscale > 1:
        depth_map = depth_map[::downscale, ::downscale]
        image_array = image_array[::downscale, ::downscale]

    h, w = depth_map.shape
    depth_min, depth_max = np.nanmin(depth_map), np.nanmax(depth_map)
    if np.isclose(depth_max, depth_min):
        depth_map = depth_map + np.linspace(0, 1e-6, num=h).reshape(h, 1)
        depth_min, depth_max = np.nanmin(depth_map), np.nanmax(depth_map)

    depth_normalized = (depth_map - depth_min) / (depth_max - depth_min)
    depth_normalized *= max_depth

    xs, ys = np.linspace(0, w-1, w), np.linspace(0, h-1, h)
    xv, yv = np.meshgrid(xs, ys)
    x_norm = (xv - w/2) / max(w, h)
    y_norm = (yv - h/2) / max(w, h)
    z = depth_normalized

    vertices = np.stack([x_norm, z, -y_norm], axis=-1).reshape(-1, 3)

    faces = []
    for i in range(h-1):
        for j in range(w-1):
            idx = i * w + j
            a, b, c, d = idx, idx + w, idx + 1, idx + w + 1
            faces.append([a, b, c])
            faces.append([c, b, d])
    faces = np.array(faces, dtype=np.int64)

    mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=True)
    mesh.remove_duplicate_faces()
    mesh.remove_degenerate_faces()
    mesh.remove_unreferenced_vertices()
    logger.info(f"Mesh created: vertices={len(mesh.vertices)}, faces={len(mesh.faces)}")
    return mesh


@app.post("/generate-3d")
async def generate_3d(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        img_arr = np.array(image)

        # --- Transform handling ---
        try:
            transformed = transform(np.array(image))
        except Exception:
            logger.exception("Transform failed on direct call; retrying...")
            transformed = transform(img_arr)

        if isinstance(transformed, dict):
            t = transformed.get("image") or list(transformed.values())[0]
        else:
            t = transformed

        if isinstance(t, np.ndarray):
            t = torch.from_numpy(t)
        if isinstance(t, Image.Image):
            t = torch.tensor(np.array(t)).permute(2, 0, 1).float() / 255.0
        if not torch.is_tensor(t):
            raise RuntimeError(f"Transform returned unsupported type: {type(t)}")

        input_tensor = t.unsqueeze(0).to(device) if t.ndim == 3 else t.to(device)
        logger.info(f"Prepared input tensor shape: {tuple(input_tensor.shape)}")
        # --- End transform handling ---

        with torch.no_grad():
            pred = midas(input_tensor)

            # 🔧 Fix: ensure shape (1,1,H,W)
            if pred.ndim == 3:
                pred = pred.unsqueeze(1)

            pred = torch.nn.functional.interpolate(
                pred,
                size=(image.size[1], image.size[0]),  # (H, W)
                mode="bicubic",
                align_corners=False,
            )

            depth_map = pred[0, 0].cpu().numpy()
            depth_map = np.squeeze(depth_map)

        if np.isnan(depth_map).any():
            raise RuntimeError("Depth map invalid (NaNs).")

        downscale = 2 if max(image.size) > 1024 else 1
        mesh = depth_to_mesh(depth_map, img_arr, max_depth=2.0, downscale=downscale)

        if len(mesh.vertices) == 0 or len(mesh.faces) == 0:
            tmp_depth = tempfile.NamedTemporaryFile(delete=False, suffix='.npy')
            np.save(tmp_depth.name, depth_map)
            tmp_depth.close()
            raise RuntimeError(f"Empty mesh generated. Saved depth map to {tmp_depth.name}")

        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".glb")
        mesh.export(temp_file.name, file_type="glb")
        temp_file.close()
        logger.info(f"Exported GLB to {temp_file.name} (size={os.path.getsize(temp_file.name)} bytes)")

        return FileResponse(
            temp_file.name,
            media_type="model/gltf-binary",
            filename="model.glb",
            background=lambda: os.unlink(temp_file.name)
        )

    except Exception as e:
        logger.exception("Error in generate_3d")
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/health")
async def health():
    return {"status": "healthy"}
