# HoloForge AI Integration Guide

## Overview

HoloForge is currently configured with a **mock 3D generation** system that demonstrates the full UI workflow. To integrate real AI-powered 2D to 3D conversion, follow this guide to set up a Python microservice with depth estimation models.

---

## Architecture

```
┌─────────────────┐
│  React Frontend │ (uploads image)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Supabase Edge   │ (receives request, calls Python service)
│    Function     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Python Service  │ (MiDaS/Point-E model)
│   (FastAPI)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Returns .glb   │ (3D model file)
│   to Supabase   │
└─────────────────┘
```

---

## Option 1: Using MiDaS (Depth Estimation)

MiDaS creates a depth map from 2D images, which can be converted to 3D geometry.

### Setup Python Service

1. **Create a new directory for the Python service:**

```bash
mkdir python-service
cd python-service
```

2. **Create `requirements.txt`:**

```txt
fastapi==0.104.1
uvicorn==0.24.0
torch==2.1.0
torchvision==0.16.0
timm==0.9.10
opencv-python==4.8.1
pillow==10.1.0
numpy==1.24.3
trimesh==4.0.5
```

3. **Create `main.py`:**

```python
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import torch
import cv2
import numpy as np
from PIL import Image
import trimesh
import io
import tempfile
import os

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
midas = torch.hub.load("intel-isl/MiDaS", model_type)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
midas.to(device)
midas.eval()

midas_transforms = torch.hub.load("intel-isl/MiDaS", "transforms")
transform = midas_transforms.dpt_transform

def depth_to_mesh(depth_map, image, max_depth=10.0):
    """Convert depth map to 3D mesh."""
    h, w = depth_map.shape

    # Normalize depth
    depth_normalized = (depth_map - depth_map.min()) / (depth_map.max() - depth_map.min())
    depth_normalized = depth_normalized * max_depth

    # Create vertex grid
    x = np.linspace(0, w-1, w)
    y = np.linspace(0, h-1, h)
    x, y = np.meshgrid(x, y)

    # Scale to reasonable dimensions
    x = (x - w/2) / w * 2
    y = (y - h/2) / h * 2
    z = depth_normalized

    # Create vertices
    vertices = np.stack([x, z, -y], axis=-1).reshape(-1, 3)

    # Create faces (triangles)
    faces = []
    for i in range(h-1):
        for j in range(w-1):
            idx = i * w + j
            # Two triangles per quad
            faces.append([idx, idx+w, idx+1])
            faces.append([idx+1, idx+w, idx+w+1])

    faces = np.array(faces)

    # Create mesh
    mesh = trimesh.Trimesh(vertices=vertices, faces=faces)

    return mesh

@app.post("/generate-3d")
async def generate_3d(file: UploadFile = File(...)):
    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')

        # Prepare image for MiDaS
        input_batch = transform(np.array(image)).to(device)

        # Generate depth map
        with torch.no_grad():
            prediction = midas(input_batch)
            prediction = torch.nn.functional.interpolate(
                prediction.unsqueeze(1),
                size=image.size[::-1],
                mode="bicubic",
                align_corners=False,
            ).squeeze()

        depth_map = prediction.cpu().numpy()

        # Convert to mesh
        mesh = depth_to_mesh(depth_map, np.array(image))

        # Export as GLB
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.glb')
        mesh.export(temp_file.name, file_type='glb')
        temp_file.close()

        return FileResponse(
            temp_file.name,
            media_type='model/gltf-binary',
            filename='model.glb',
            background=lambda: os.unlink(temp_file.name)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

4. **Run the service:**

```bash
pip install -r requirements.txt
python main.py
```

---

## Option 2: Using Point-E (OpenAI's Text/Image to 3D)

Point-E generates 3D point clouds from images or text.

### Setup

1. **Install dependencies:**

```bash
pip install point-e torch pillow trimesh
```

2. **Create `point_e_service.py`:**

```python
from fastapi import FastAPI, File, UploadFile
from point_e.diffusion.configs import DIFFUSION_CONFIGS, diffusion_from_config
from point_e.diffusion.sampler import PointCloudSampler
from point_e.models.download import load_checkpoint
from point_e.models.configs import MODEL_CONFIGS, model_from_config
from PIL import Image
import torch
import trimesh
import io

app = FastAPI()

# Load models
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

base_name = 'base40M'
base_model = model_from_config(MODEL_CONFIGS[base_name], device)
base_model.eval()
base_diffusion = diffusion_from_config(DIFFUSION_CONFIGS[base_name])

@app.post("/generate-3d")
async def generate_3d(file: UploadFile = File(...)):
    # Load image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))

    # Generate point cloud
    sampler = PointCloudSampler(
        device=device,
        models=[base_model],
        diffusions=[base_diffusion],
    )

    samples = sampler.sample_batch_progressive(
        batch_size=1,
        model_kwargs=dict(images=[image]),
    )

    # Convert to mesh using marching cubes or ball pivoting
    # ... (implementation depends on your needs)

    return {"status": "complete"}
```

---

## Updating the Edge Function

Once your Python service is running, update the Supabase Edge Function:

```typescript
// supabase/functions/generate-3d-model/index.ts

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { projectId, imageUrl } = await req.json();

    // Download image from Supabase Storage
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();

    // Call Python service
    const formData = new FormData();
    formData.append('file', imageBlob);

    const pythonServiceUrl = Deno.env.get('PYTHON_SERVICE_URL') || 'http://localhost:8000';
    const response = await fetch(`${pythonServiceUrl}/generate-3d`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to generate 3D model');
    }

    const modelBlob = await response.blob();

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('models')
      .upload(`${projectId}.glb`, modelBlob, {
        contentType: 'model/gltf-binary',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('models')
      .getPublicUrl(`${projectId}.glb`);

    return new Response(
      JSON.stringify({
        success: true,
        modelUrl: publicUrl,
        metadata: { processingTime: Date.now() },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
```

---

## Deployment Options

### Option 1: Deploy Python Service to Render/Railway/Fly.io

1. Create a `Dockerfile`:

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

2. Deploy to your chosen platform
3. Update Edge Function with the deployed URL

### Option 2: Use Hugging Face Inference API

Instead of hosting your own service, use Hugging Face's API:

```typescript
const response = await fetch(
  'https://api-inference.huggingface.co/models/Intel/dpt-large',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_API_KEY}`,
    },
    body: imageBlob,
  }
);
```

---

## Testing

1. Start your Python service
2. Test the endpoint:

```bash
curl -X POST -F "file=@test-image.jpg" http://localhost:8000/generate-3d --output model.glb
```

3. Upload an image in HoloForge and watch the magic happen!

---

## Performance Optimization

- Use GPU for faster inference
- Implement caching for repeated requests
- Add queue system for handling multiple requests
- Use WebSockets for real-time progress updates

---

## Troubleshooting

**Issue**: Out of memory errors
**Solution**: Reduce image resolution before processing

**Issue**: Slow generation times
**Solution**: Use a smaller model or GPU acceleration

**Issue**: Poor 3D quality
**Solution**: Adjust depth map parameters or try different models

---

## Future Enhancements

- Add support for multiple AI models (user selectable)
- Implement texture mapping from original image
- Add post-processing effects (smoothing, hole filling)
- Support for video input (generate 3D from video frames)
- Real-time preview during generation

---

For questions or issues, please refer to the main README or create an issue on GitHub.
