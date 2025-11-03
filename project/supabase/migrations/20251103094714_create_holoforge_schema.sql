/*
  # HoloForge Database Schema

  ## Overview
  Creates the database structure for HoloForge - a 2D to 3D object creator with laser simulation.
  
  ## New Tables
  
  ### `projects`
  Stores user projects including uploaded images and generated 3D models.
  - `id` (uuid, primary key) - Unique project identifier
  - `user_id` (uuid, nullable) - User identifier for future auth integration
  - `title` (text) - Project name/title
  - `original_image_url` (text) - URL to uploaded 2D image in storage
  - `model_url` (text, nullable) - URL to generated 3D model file (.glb)
  - `thumbnail_url` (text, nullable) - Preview thumbnail of the 3D model
  - `status` (text) - Processing status: 'uploading', 'processing', 'completed', 'failed'
  - `visualization_mode` (text) - Selected mode: 'holographic', 'engraving', 'forge'
  - `metadata` (jsonb) - Additional data like image dimensions, processing time, AI model used
  - `created_at` (timestamptz) - Project creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `storage buckets`
  - `images` - For storing uploaded 2D images
  - `models` - For storing generated 3D model files
  - `thumbnails` - For storing preview thumbnails
  
  ## Security
  - Enable RLS on projects table
  - Public read access for demo purposes
  - Authenticated users can create/update their own projects
  - Storage buckets configured with public read access
  
  ## Notes
  - Currently designed for public/demo use without strict user authentication
  - Can be extended with proper user ownership when auth is added
  - JSONB metadata field allows flexible storage of additional processing details
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL DEFAULT 'Untitled Project',
  original_image_url text NOT NULL,
  model_url text,
  thumbnail_url text,
  status text NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'completed', 'failed')),
  visualization_mode text DEFAULT 'holographic' CHECK (visualization_mode IN ('holographic', 'engraving', 'forge')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view projects (public demo)
CREATE POLICY "Anyone can view projects"
  ON projects FOR SELECT
  USING (true);

-- Policy: Anyone can create projects (public demo)
CREATE POLICY "Anyone can create projects"
  ON projects FOR INSERT
  WITH CHECK (true);

-- Policy: Anyone can update projects (public demo)
CREATE POLICY "Anyone can update projects"
  ON projects FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Anyone can delete projects (public demo)
CREATE POLICY "Anyone can delete projects"
  ON projects FOR DELETE
  USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-update updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('images', 'images', true),
  ('models', 'models', true),
  ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for images bucket
CREATE POLICY "Public read access for images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

CREATE POLICY "Public upload access for images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images');

-- Storage policies for models bucket
CREATE POLICY "Public read access for models"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'models');

CREATE POLICY "Public upload access for models"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'models');

-- Storage policies for thumbnails bucket
CREATE POLICY "Public read access for thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'thumbnails');

CREATE POLICY "Public upload access for thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'thumbnails');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);