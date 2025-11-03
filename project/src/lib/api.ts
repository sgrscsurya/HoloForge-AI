import { supabase, Project } from './supabase';

export async function createProject(data: {
  title: string;
  original_image_url: string;
  visualization_mode?: 'holographic' | 'engraving' | 'forge';
}): Promise<Project> {
  const { data: project, error } = await supabase
    .from('projects')
    .insert([data])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`);
  }

  return project;
}

export async function updateProject(
  id: string,
  updates: Partial<Project>
): Promise<Project> {
  const { data: project, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update project: ${error.message}`);
  }

  return project;
}

export async function getProject(id: string): Promise<Project | null> {
  const { data: project, error } = await supabase
    .from('projects')
    .select()
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get project: ${error.message}`);
  }

  return project;
}

export async function listProjects(): Promise<Project[]> {
  const { data: projects, error } = await supabase
    .from('projects')
    .select()
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(`Failed to list projects: ${error.message}`);
  }

  return projects || [];
}
