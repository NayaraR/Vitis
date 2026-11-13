export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          accent_color: string | null
          brand_logo: string | null
          brand_primary: string | null
          brand_secondary: string | null
          default_review_days: number
          id: number
          learning_name: string
          popular_queries: string[]
          show_overdue: boolean
          support_channel: string | null
          support_hours: string | null
          support_portal_url: string | null
          support_show_external: boolean
          support_show_internal: boolean
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          brand_logo?: string | null
          brand_primary?: string | null
          brand_secondary?: string | null
          default_review_days?: number
          id?: number
          learning_name?: string
          popular_queries?: string[]
          show_overdue?: boolean
          support_channel?: string | null
          support_hours?: string | null
          support_portal_url?: string | null
          support_show_external?: boolean
          support_show_internal?: boolean
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          brand_logo?: string | null
          brand_primary?: string | null
          brand_secondary?: string | null
          default_review_days?: number
          id?: number
          learning_name?: string
          popular_queries?: string[]
          show_overdue?: boolean
          support_channel?: string | null
          support_hours?: string | null
          support_portal_url?: string | null
          support_show_external?: boolean
          support_show_internal?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      areas: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      article_attachments: {
        Row: {
          article_id: string
          caption: string | null
          created_at: string
          file_name: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          sort_order: number
          storage_path: string | null
          url: string | null
        }
        Insert: {
          article_id: string
          caption?: string | null
          created_at?: string
          file_name: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          sort_order?: number
          storage_path?: string | null
          url?: string | null
        }
        Update: {
          article_id?: string
          caption?: string | null
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          sort_order?: number
          storage_path?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_attachments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_drafts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          article_id: string
          attention: string | null
          audience: string[]
          body_extra: string | null
          category_id: string | null
          contact: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          cover_image: string | null
          cover_label: string | null
          cover_style: string
          created_at: string
          created_by: string | null
          event_at: string | null
          faq: Json
          id: string
          materials: string[]
          owner_area_id: string | null
          quick_answer: string | null
          return_comment: string | null
          search_synonyms: string[]
          slug: string
          status: string
          steps: Json
          submitted_at: string | null
          summary: string | null
          system_ids: string[]
          tag_names: string[]
          title: string
          updated_at: string
          updated_by: string | null
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          article_id: string
          attention?: string | null
          audience?: string[]
          body_extra?: string | null
          category_id?: string | null
          contact?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          cover_image?: string | null
          cover_label?: string | null
          cover_style?: string
          created_at?: string
          created_by?: string | null
          event_at?: string | null
          faq?: Json
          id?: string
          materials?: string[]
          owner_area_id?: string | null
          quick_answer?: string | null
          return_comment?: string | null
          search_synonyms?: string[]
          slug: string
          status?: string
          steps?: Json
          submitted_at?: string | null
          summary?: string | null
          system_ids?: string[]
          tag_names?: string[]
          title: string
          updated_at?: string
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          article_id?: string
          attention?: string | null
          audience?: string[]
          body_extra?: string | null
          category_id?: string | null
          contact?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          cover_image?: string | null
          cover_label?: string | null
          cover_style?: string
          created_at?: string
          created_by?: string | null
          event_at?: string | null
          faq?: Json
          id?: string
          materials?: string[]
          owner_area_id?: string | null
          quick_answer?: string | null
          return_comment?: string | null
          search_synonyms?: string[]
          slug?: string
          status?: string
          steps?: Json
          submitted_at?: string | null
          summary?: string | null
          system_ids?: string[]
          tag_names?: string[]
          title?: string
          updated_at?: string
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "article_drafts_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_favorites: {
        Row: {
          article_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          user_id?: string
        }
        Update: {
          article_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_favorites_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_reads: {
        Row: {
          article_id: string
          completed: boolean
          completed_at: string | null
          read_at: string
          user_id: string
        }
        Insert: {
          article_id: string
          completed?: boolean
          completed_at?: string | null
          read_at?: string
          user_id?: string
        }
        Update: {
          article_id?: string
          completed?: boolean
          completed_at?: string | null
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_reads_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_systems: {
        Row: {
          article_id: string
          system_id: string
        }
        Insert: {
          article_id: string
          system_id: string
        }
        Update: {
          article_id?: string
          system_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_systems_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_systems_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      article_tags: {
        Row: {
          article_id: string
          tag_id: string
        }
        Insert: {
          article_id: string
          tag_id: string
        }
        Update: {
          article_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_tags_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      article_versions: {
        Row: {
          approved_by: string | null
          article_id: string
          change_summary: string | null
          id: string
          kind: string
          published_at: string
          published_by: string | null
          snapshot: Json
          version_label: string
        }
        Insert: {
          approved_by?: string | null
          article_id: string
          change_summary?: string | null
          id?: string
          kind?: string
          published_at?: string
          published_by?: string | null
          snapshot: Json
          version_label: string
        }
        Update: {
          approved_by?: string | null
          article_id?: string
          change_summary?: string | null
          id?: string
          kind?: string
          published_at?: string
          published_by?: string | null
          snapshot?: Json
          version_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_versions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          approved_by: string | null
          attention: string | null
          audience: string[]
          body_extra: string | null
          category_id: string | null
          change_summary: string | null
          contact: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          cover_image: string | null
          cover_label: string | null
          cover_style: string
          created_at: string
          created_by: string | null
          estimated_minutes: number
          event_at: string | null
          faq: Json
          featured: boolean
          id: string
          is_example: boolean
          materials: string[]
          next_review_at: string | null
          owner_area_id: string | null
          owner_user_id: string | null
          published_at: string | null
          quick_answer: string | null
          reviewed_at: string | null
          reviewer_user_id: string | null
          search_synonyms: string[]
          search_vector: unknown
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["article_status"]
          steps: Json
          summary: string | null
          title: string
          updated_at: string
          updated_by: string | null
          version_label: string | null
          view_count: number
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          approved_by?: string | null
          attention?: string | null
          audience?: string[]
          body_extra?: string | null
          category_id?: string | null
          change_summary?: string | null
          contact?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          cover_image?: string | null
          cover_label?: string | null
          cover_style?: string
          created_at?: string
          created_by?: string | null
          estimated_minutes?: number
          event_at?: string | null
          faq?: Json
          featured?: boolean
          id?: string
          is_example?: boolean
          materials?: string[]
          next_review_at?: string | null
          owner_area_id?: string | null
          owner_user_id?: string | null
          published_at?: string | null
          quick_answer?: string | null
          reviewed_at?: string | null
          reviewer_user_id?: string | null
          search_synonyms?: string[]
          search_vector?: unknown
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["article_status"]
          steps?: Json
          summary?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
          version_label?: string | null
          view_count?: number
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          approved_by?: string | null
          attention?: string | null
          audience?: string[]
          body_extra?: string | null
          category_id?: string | null
          change_summary?: string | null
          contact?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          cover_image?: string | null
          cover_label?: string | null
          cover_style?: string
          created_at?: string
          created_by?: string | null
          estimated_minutes?: number
          event_at?: string | null
          faq?: Json
          featured?: boolean
          id?: string
          is_example?: boolean
          materials?: string[]
          next_review_at?: string | null
          owner_area_id?: string | null
          owner_user_id?: string | null
          published_at?: string | null
          quick_answer?: string | null
          reviewed_at?: string | null
          reviewer_user_id?: string | null
          search_synonyms?: string[]
          search_vector?: unknown
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["article_status"]
          steps?: Json
          summary?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          version_label?: string | null
          view_count?: number
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_owner_area_id_fkey"
            columns: ["owner_area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          code: string
          collection_id: string
          full_name: string | null
          id: string
          issued_at: string
          minutes: number
          path_title: string
          user_id: string
        }
        Insert: {
          code: string
          collection_id: string
          full_name?: string | null
          id?: string
          issued_at?: string
          minutes?: number
          path_title: string
          user_id?: string
        }
        Update: {
          code?: string
          collection_id?: string
          full_name?: string | null
          id?: string
          issued_at?: string
          minutes?: number
          path_title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_items: {
        Row: {
          article_id: string
          collection_id: string
          sort_order: number
        }
        Insert: {
          article_id: string
          collection_id: string
          sort_order?: number
        }
        Update: {
          article_id?: string
          collection_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          active: boolean
          audience: string[]
          category_id: string | null
          content_type: Database["public"]["Enums"]["content_type"] | null
          cover_image: string | null
          cover_style: string
          created_at: string
          description: string | null
          icon: string
          id: string
          kind: Database["public"]["Enums"]["collection_kind"]
          level: string
          slug: string
          sort_order: number
          status: string
          system_id: string | null
          title: string
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          active?: boolean
          audience?: string[]
          category_id?: string | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          cover_image?: string | null
          cover_style?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          kind?: Database["public"]["Enums"]["collection_kind"]
          level?: string
          slug: string
          sort_order?: number
          status?: string
          system_id?: string | null
          title: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          active?: boolean
          audience?: string[]
          category_id?: string | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          cover_image?: string | null
          cover_style?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          kind?: Database["public"]["Enums"]["collection_kind"]
          level?: string
          slug?: string
          sort_order?: number
          status?: string
          system_id?: string | null
          title?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "collections_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          article_id: string
          comment: string | null
          created_at: string
          id: string
          is_helpful: boolean | null
          issue_type: string | null
          status: string
          user_id: string
        }
        Insert: {
          article_id: string
          comment?: string | null
          created_at?: string
          id?: string
          is_helpful?: boolean | null
          issue_type?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          article_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          is_helpful?: boolean | null
          issue_type?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_domains: {
        Row: {
          domain: string
        }
        Insert: {
          domain: string
        }
        Update: {
          domain?: string
        }
        Relationships: []
      }
      org_invites: {
        Row: {
          created_at: string
          created_by: string | null
          email: string | null
          expires_at: string
          id: string
          max_uses: number
          organization_id: string
          token: string
          uses: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          max_uses?: number
          organization_id: string
          token?: string
          uses?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          max_uses?: number
          organization_id?: string
          token?: string
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "org_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          active: boolean
          created_at: string
          id: string
          kind: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          kind?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          kind?: string
          name?: string
        }
        Relationships: []
      }
      path_assignments: {
        Row: {
          assigned_by: string | null
          collection_id: string
          created_at: string
          due_date: string | null
          id: string
          organization_id: string
          user_id: string | null
        }
        Insert: {
          assigned_by?: string | null
          collection_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          organization_id: string
          user_id?: string | null
        }
        Update: {
          assigned_by?: string | null
          collection_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          organization_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "path_assignments_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "path_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          area_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          organization_id: string | null
          privacy_accepted_at: string | null
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          active?: boolean
          area_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          organization_id?: string | null
          privacy_accepted_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          active?: boolean
          area_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          organization_id?: string | null
          privacy_accepted_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          created_at: string
          id: string
          passed: boolean
          quiz_id: string
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          passed: boolean
          quiz_id: string
          score: number
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_index: number
          id: string
          options: Json
          prompt: string
          quiz_id: string
          sort_order: number
        }
        Insert: {
          correct_index?: number
          id?: string
          options?: Json
          prompt: string
          quiz_id: string
          sort_order?: number
        }
        Update: {
          correct_index?: number
          id?: string
          options?: Json
          prompt?: string
          quiz_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          active: boolean
          collection_id: string
          created_at: string
          id: string
          pass_score: number
        }
        Insert: {
          active?: boolean
          collection_id: string
          created_at?: string
          id?: string
          pass_score?: number
        }
        Update: {
          active?: boolean
          collection_id?: string
          created_at?: string
          id?: string
          pass_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: true
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      support_requests: {
        Row: {
          context: Json
          created_at: string
          description: string | null
          external_key: string | null
          id: string
          status: string
          user_id: string
        }
        Insert: {
          context?: Json
          created_at?: string
          description?: string | null
          external_key?: string | null
          id?: string
          status?: string
          user_id?: string
        }
        Update: {
          context?: Json
          created_at?: string
          description?: string | null
          external_key?: string | null
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      systems: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          icon: string
          id: string
          logo_url: string | null
          name: string
          owner_area_id: string | null
          slug: string
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_area_id?: string | null
          slug: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_area_id?: string | null
          slug?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "systems_owner_area_id_fkey"
            columns: ["owner_area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _draft_from_payload: {
        Args: {
          d: Database["public"]["Tables"]["article_drafts"]["Row"]
          p: Json
        }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          article_id: string
          attention: string | null
          audience: string[]
          body_extra: string | null
          category_id: string | null
          contact: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          cover_image: string | null
          cover_label: string | null
          cover_style: string
          created_at: string
          created_by: string | null
          event_at: string | null
          faq: Json
          id: string
          materials: string[]
          owner_area_id: string | null
          quick_answer: string | null
          return_comment: string | null
          search_synonyms: string[]
          slug: string
          status: string
          steps: Json
          submitted_at: string | null
          summary: string | null
          system_ids: string[]
          tag_names: string[]
          title: string
          updated_at: string
          updated_by: string | null
          visibility: Database["public"]["Enums"]["visibility"]
        }
        SetofOptions: {
          from: "*"
          to: "article_drafts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      _search: {
        Args: {
          p_audience: string
          p_category: string
          p_include_archived: boolean
          p_limit: number
          p_system: string
          p_type: string
          p_updated_since: string
          v_tsq: unknown
        }
        Returns: {
          category_name: string
          content_type: Database["public"]["Enums"]["content_type"]
          id: string
          is_example: boolean
          next_review_at: string
          published_at: string
          rank: number
          reviewed_at: string
          slug: string
          status: Database["public"]["Enums"]["article_status"]
          summary: string
          title: string
          version_label: string
          visibility: Database["public"]["Enums"]["visibility"]
        }[]
      }
      _sync_unpublished: {
        Args: {
          _article: string
          _status: Database["public"]["Enums"]["article_status"]
        }
        Returns: undefined
      }
      approve_draft: { Args: { p_draft: string }; Returns: undefined }
      archive_article: { Args: { p_article: string }; Returns: undefined }
      can_manage_area: { Args: { _area: string }; Returns: boolean }
      can_read_article: { Args: { _id: string }; Returns: boolean }
      can_see_visibility: {
        Args: { _v: Database["public"]["Enums"]["visibility"] }
        Returns: boolean
      }
      confirm_review: {
        Args: { p_article: string; p_next_review: string }
        Returns: undefined
      }
      dashboard_stats: { Args: never; Returns: Json }
      discard_draft: { Args: { p_draft: string }; Returns: undefined }
      f_unaccent: { Args: { "": string }; Returns: string }
      get_brand: { Args: never; Returns: Json }
      get_internal_domains: { Args: never; Returns: string[] }
      get_quiz: { Args: { p_collection: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_view: { Args: { p_article: string }; Returns: undefined }
      is_active_user: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_curator: { Args: never; Returns: boolean }
      is_editor: { Args: never; Returns: boolean }
      is_internal_email: { Args: { _email: string }; Returns: boolean }
      is_internal_user: { Args: never; Returns: boolean }
      is_team_manager: { Args: never; Returns: boolean }
      issue_certificate: {
        Args: { p_collection: string }
        Returns: {
          code: string
          collection_id: string
          full_name: string | null
          id: string
          issued_at: string
          minutes: number
          path_title: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "certificates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      manages_user: { Args: { _u: string }; Returns: boolean }
      my_area: { Args: never; Returns: string }
      my_org: { Args: never; Returns: string }
      publish_draft: {
        Args: {
          p_change_summary: string
          p_draft: string
          p_next_review: string
          p_version: string
        }
        Returns: undefined
      }
      redeem_invite: { Args: { p_token: string }; Returns: string }
      remove_example_data: { Args: never; Returns: number }
      restore_article: { Args: { p_article: string }; Returns: undefined }
      return_draft: {
        Args: { p_comment: string; p_draft: string }
        Returns: undefined
      }
      save_draft: { Args: { p: Json; p_article: string }; Returns: string }
      search_articles: {
        Args: {
          p_audience?: string
          p_category?: string
          p_include_archived?: boolean
          p_limit?: number
          p_system?: string
          p_type?: string
          p_updated_since?: string
          q?: string
        }
        Returns: {
          category_name: string
          content_type: Database["public"]["Enums"]["content_type"]
          id: string
          is_example: boolean
          next_review_at: string
          published_at: string
          rank: number
          reviewed_at: string
          slug: string
          status: Database["public"]["Enums"]["article_status"]
          summary: string
          title: string
          version_label: string
          visibility: Database["public"]["Enums"]["visibility"]
        }[]
      }
      submit_draft: { Args: { p_draft: string }; Returns: undefined }
      submit_quiz: { Args: { p_answers: Json; p_quiz: string }; Returns: Json }
      try_uuid: { Args: { _t: string }; Returns: string }
      verify_certificate: { Args: { p_code: string }; Returns: Json }
    }
    Enums: {
      app_role:
        | "reader"
        | "external_reader"
        | "author"
        | "reviewer"
        | "curator"
        | "admin"
        | "team_manager"
      article_status:
        | "draft"
        | "in_review"
        | "approved"
        | "published"
        | "archived"
      collection_kind: "onboarding" | "guides" | "custom"
      content_type:
        | "procedure"
        | "manual"
        | "checklist"
        | "template"
        | "quick_guide"
        | "video"
        | "announcement"
        | "other"
        | "faq"
      user_type: "internal" | "external"
      visibility: "internal" | "external" | "all"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "reader",
        "external_reader",
        "author",
        "reviewer",
        "curator",
        "admin",
        "team_manager",
      ],
      article_status: [
        "draft",
        "in_review",
        "approved",
        "published",
        "archived",
      ],
      collection_kind: ["onboarding", "guides", "custom"],
      content_type: [
        "procedure",
        "manual",
        "checklist",
        "template",
        "quick_guide",
        "video",
        "announcement",
        "other",
        "faq",
      ],
      user_type: ["internal", "external"],
      visibility: ["internal", "external", "all"],
    },
  },
} as const
