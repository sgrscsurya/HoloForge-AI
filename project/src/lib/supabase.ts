import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Project {
  id: string;
  user_id?: string;
  title: string;
  original_image_url: string;
  model_url?: string;
  thumbnail_url?: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  visualization_mode: 'holographic' | 'engraving' | 'forge';
  metadata: {
    width?: number;
    height?: number;
    processing_time?: number;
    ai_model?: string;
  };
  created_at: string;
  updated_at: string;
}
