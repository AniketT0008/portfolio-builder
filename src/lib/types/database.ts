/**
 * Hand-authored Supabase database types that mirror
 * `supabase/migrations/0001_init.sql`.
 *
 * If you later run `supabase gen types typescript`, you can replace this file
 * with the generated output — the table shapes are kept compatible.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProjectStatus = "draft" | "analyzing" | "ready" | "error";

export type ProjectSource =
  | "manual"
  | "github_import"
  | "linkedin_import"
  | "custom";

export type CodeStudioStatus =
  | "uploaded"
  | "analyzing"
  | "refactored"
  | "published"
  | "error";

export type ArtifactType =
  | "github_repo"
  | "zip"
  | "image"
  | "video"
  | "pdf"
  | "document"
  | "cad"
  | "other";

export type GenerationType =
  | "resume_bullets"
  | "star_response"
  | "portfolio_page"
  | "readme"
  | "linkedin_post"
  | "presentation"
  | "tech_docs"
  | "cover_letter"
  | "scholarship_app"
  | "architecture_overview";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          github_username: string | null;
          linkedin_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          github_username?: string | null;
          linkedin_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          github_username?: string | null;
          linkedin_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          status: ProjectStatus;
          source: ProjectSource;
          source_url: string | null;
          extracted_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          status?: ProjectStatus;
          source?: ProjectSource;
          source_url?: string | null;
          extracted_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          status?: ProjectStatus;
          source?: ProjectSource;
          source_url?: string | null;
          extracted_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      artifacts: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          type: ArtifactType;
          file_path: string | null;
          github_url: string | null;
          original_filename: string | null;
          file_size_bytes: number | null;
          mime_type: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          type: ArtifactType;
          file_path?: string | null;
          github_url?: string | null;
          original_filename?: string | null;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          type?: ArtifactType;
          file_path?: string | null;
          github_url?: string | null;
          original_filename?: string | null;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      generations: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          type: GenerationType;
          content: Json;
          settings: Json | null;
          version: number;
          is_favorite: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          type: GenerationType;
          content: Json;
          settings?: Json | null;
          version?: number;
          is_favorite?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          type?: GenerationType;
          content?: Json;
          settings?: Json | null;
          version?: number;
          is_favorite?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      code_studio_sessions: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          name: string;
          status: CodeStudioStatus;
          source_files: Json;
          refactored_files: Json | null;
          readme_content: string | null;
          linkedin_post: string | null;
          github_repo_url: string | null;
          github_push_result: Json | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          name?: string;
          status?: CodeStudioStatus;
          source_files?: Json;
          refactored_files?: Json | null;
          readme_content?: string | null;
          linkedin_post?: string | null;
          github_repo_url?: string | null;
          github_push_result?: Json | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          name?: string;
          status?: CodeStudioStatus;
          source_files?: Json;
          refactored_files?: Json | null;
          readme_content?: string | null;
          linkedin_post?: string | null;
          github_repo_url?: string | null;
          github_push_result?: Json | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience row aliases ----------------------------------------------------
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Artifact = Database["public"]["Tables"]["artifacts"]["Row"];
export type Generation = Database["public"]["Tables"]["generations"]["Row"];
export type CodeStudioSession =
  Database["public"]["Tables"]["code_studio_sessions"]["Row"];

export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ArtifactInsert =
  Database["public"]["Tables"]["artifacts"]["Insert"];
export type GenerationInsert =
  Database["public"]["Tables"]["generations"]["Insert"];
