# HoloForge - Quick Start Guide

Welcome to HoloForge! This guide will help you get up and running in minutes.

---

## 🎯 What You Get

A fully functional web app with:
- ✅ Beautiful futuristic UI with animations
- ✅ File upload with drag-and-drop
- ✅ 3D visualization with Three.js
- ✅ Laser simulation effects
- ✅ Three visualization modes
- ✅ Download 3D models (.glb)
- ✅ Database persistence (Supabase)
- ✅ Serverless backend (Edge Functions)

---

## 🚀 Running the App

### Option 1: Development Mode

```bash
npm install
npm run dev
```

The app will open at `http://localhost:5173`

### Option 2: Production Build

```bash
npm run build
npm run preview
```

---

## 🎮 Using HoloForge

### Step 1: Landing Page
- Click **"Start Creating"** to begin

### Step 2: Upload Image
- Drag and drop any JPG or PNG image
- Or click to browse files
- Preview your image
- Click **"Generate 3D Model"**

### Step 3: Processing
- Watch the animated loader
- Processing takes ~3 seconds (mock AI)

### Step 4: 3D Viewer
- **Rotate**: Click and drag
- **Zoom**: Scroll wheel
- **Pan**: Right-click and drag
- **Switch Modes**: Use the control panel at bottom
  - 🔷 Holographic (transparent cyan)
  - ⚡ Engraving (wireframe blue)
  - 🔥 Forge (hot metal orange)
- **Download**: Click the green download button
- **New Project**: Click "New Project" to start over

---

## 🎨 Visualization Modes Explained

### Holographic Mode
- Transparent, glowing effect
- Cyan color scheme
- Looks like a sci-fi hologram
- Best for: Demos and presentations

### Engraving Mode
- Wireframe mesh
- Blue tones
- Technical appearance
- Best for: Seeing structure details

### Forge Mode
- Solid with emissive glow
- Orange/red hot metal look
- Dramatic lighting
- Best for: Artistic renders

---

## 📁 Project Structure Quick Reference

```
src/
├── components/         # All UI components
├── lib/               # Database & API logic
└── App.tsx            # Main app file

supabase/
├── migrations/        # Database schema
└── functions/         # Edge Functions (API)
```

---

## 🔧 Key Technologies

- **React + TypeScript**: UI framework
- **Three.js**: 3D rendering
- **Framer Motion**: Smooth animations
- **Supabase**: Backend (database + storage + functions)
- **Tailwind CSS**: Styling

---

## 🐛 Troubleshooting

### App won't start
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### 3D model not loading
- Check browser console for errors
- Ensure internet connection (loads sample .glb from GitHub)
- Try a different browser (Chrome/Firefox recommended)

### Upload fails
- Check file size (keep under 5MB)
- Ensure file is JPG or PNG
- Check Supabase connection

---

## 🎓 What's Next?

### Current Implementation
- Uses **mock AI** (returns sample 3D model)
- Simulates processing with 3-second delay
- Demonstrates full UI/UX workflow

### Add Real AI (Optional)
See `AI_INTEGRATION_GUIDE.md` for:
- MiDaS depth estimation setup
- Point-E 3D generation
- Python FastAPI service
- Deployment options

### Customize
- Change colors in Tailwind config
- Modify laser simulation in `LaserSimulation.tsx`
- Add more visualization modes in `Scene3D.tsx`
- Enhance UI in component files

---

## 📚 Learn More

- **Full Details**: See `PROJECT_OVERVIEW.md`
- **AI Integration**: See `AI_INTEGRATION_GUIDE.md`
- **Three.js**: https://threejs.org/docs/
- **Supabase**: https://supabase.com/docs

---

## 💡 Tips

1. **Performance**: The 3D scene works best on devices with GPU
2. **Images**: Use images with clear depth (landscapes work well)
3. **Browser**: Chrome or Firefox recommended
4. **Resolution**: Keep uploaded images under 2000x2000px

---

## 🎬 Demo Flow

1. **Hero** → Animated landing page
2. **Upload** → Select your image
3. **Processing** → Watch AI simulation
4. **Viewer** → Interact with 3D model
5. **Download** → Get your .glb file

---

## 🤝 Support

If you run into issues:
1. Check the console for errors (F12)
2. Review `PROJECT_OVERVIEW.md`
3. Ensure all dependencies are installed
4. Try clearing browser cache

---

## ✨ Enjoy!

You now have a working 3D visualization app with a stunning UI. Perfect for:
- Portfolio projects
- Learning Three.js
- Demonstrating full-stack skills
- Creating 3D art

Have fun creating! 🚀
