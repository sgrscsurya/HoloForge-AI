import { supabase } from './supabase';

export async function uploadImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error } = await supabase.storage
    .from('images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function uploadModel(blob: Blob, projectId: string): Promise<string> {
  const fileName = `${projectId}.glb`;
  const filePath = `${fileName}`;

  const { error } = await supabase.storage
    .from('models')
    .upload(filePath, blob, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'model/gltf-binary',
    });

  if (error) {
    throw new Error(`Failed to upload model: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('models')
    .getPublicUrl(filePath);

  return publicUrl;
}

export function getPublicUrl(bucket: string, path: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return publicUrl;
}
