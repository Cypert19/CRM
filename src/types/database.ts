export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          default_currency: string;
          default_timezone: string;
          fiscal_year_start_month: number;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          default_currency?: string;
          default_timezone?: string;
          fiscal_year_start_month?: number;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          default_currency?: string;
          default_timezone?: string;
          fiscal_year_start_month?: number;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: "Admin" | "Manager" | "Member";
          status: "Active" | "Invited" | "Deactivated";
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: "Admin" | "Manager" | "Member";
          status?: "Active" | "Invited" | "Deactivated";
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: "Admin" | "Manager" | "Member";
          status?: "Active" | "Invited" | "Deactivated";
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspace_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      pipelines: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          description: string | null;
          is_default: boolean;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          description?: string | null;
          is_default?: boolean;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          description?: string | null;
          is_default?: boolean;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pipelines_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      pipeline_stages: {
        Row: {
          id: string;
          workspace_id: string;
          pipeline_id: string;
          name: string;
          color: string;
          display_order: number;
          default_probability: number;
          is_won: boolean;
          is_lost: boolean;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          pipeline_id: string;
          name: string;
          color?: string;
          display_order?: number;
          default_probability?: number;
          is_won?: boolean;
          is_lost?: boolean;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          pipeline_id?: string;
          name?: string;
          color?: string;
          display_order?: number;
          default_probability?: number;
          is_won?: boolean;
          is_lost?: boolean;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey";
            columns: ["pipeline_id"];
            isOneToOne: false;
            referencedRelation: "pipelines";
            referencedColumns: ["id"];
          },
        ];
      };
      deals: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          value: number;
          currency: string;
          stage_id: string;
          pipeline_id: string;
          contact_id: string | null;
          company_id: string | null;
          owner_id: string;
          expected_close_date: string | null;
          probability: number | null;
          priority: "Low" | "Medium" | "High" | "Critical" | null;
          source: "Inbound" | "Outbound" | "Referral" | "Partner" | "Event" | "Website" | "Other" | "LinkedIn" | "Cold Outreach" | "Conference" | null;
          tags: string[];
          description: string | null;
          lost_reason: string | null;
          win_reason: string | null;
          payment_type: "one_time" | "retainer" | null;
          payment_frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "annually" | null;
          scope: string | null;
          services_description: string | null;
          adoption_capacity: string | null;
          next_step: string | null;
          competitor: string | null;
          deal_industry: "technology" | "healthcare" | "finance" | "manufacturing" | "retail" | "education" | "consulting" | "real_estate" | "other" | null;
          company_size: "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+" | null;
          closed_at: string | null;
          custom_fields: Json;
          deleted_at: string | null;
          search_vector: unknown | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          title: string;
          value?: number;
          currency?: string;
          stage_id: string;
          pipeline_id: string;
          contact_id?: string | null;
          company_id?: string | null;
          owner_id: string;
          expected_close_date?: string | null;
          probability?: number | null;
          priority?: "Low" | "Medium" | "High" | "Critical" | null;
          source?: "Inbound" | "Outbound" | "Referral" | "Partner" | "Event" | "Website" | "Other" | "LinkedIn" | "Cold Outreach" | "Conference" | null;
          tags?: string[];
          description?: string | null;
          lost_reason?: string | null;
          win_reason?: string | null;
          payment_type?: "one_time" | "retainer" | null;
          payment_frequency?: "weekly" | "biweekly" | "monthly" | "quarterly" | "annually" | null;
          scope?: string | null;
          services_description?: string | null;
          adoption_capacity?: string | null;
          next_step?: string | null;
          competitor?: string | null;
          deal_industry?: "technology" | "healthcare" | "finance" | "manufacturing" | "retail" | "education" | "consulting" | "real_estate" | "other" | null;
          company_size?: "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+" | null;
          closed_at?: string | null;
          custom_fields?: Json;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          title?: string;
          value?: number;
          currency?: string;
          stage_id?: string;
          pipeline_id?: string;
          contact_id?: string | null;
          company_id?: string | null;
          owner_id?: string;
          expected_close_date?: string | null;
          probability?: number | null;
          priority?: "Low" | "Medium" | "High" | "Critical" | null;
          source?: "Inbound" | "Outbound" | "Referral" | "Partner" | "Event" | "Website" | "Other" | "LinkedIn" | "Cold Outreach" | "Conference" | null;
          tags?: string[];
          description?: string | null;
          lost_reason?: string | null;
          win_reason?: string | null;
          payment_type?: "one_time" | "retainer" | null;
          payment_frequency?: "weekly" | "biweekly" | "monthly" | "quarterly" | "annually" | null;
          scope?: string | null;
          services_description?: string | null;
          adoption_capacity?: string | null;
          next_step?: string | null;
          competitor?: string | null;
          deal_industry?: "technology" | "healthcare" | "finance" | "manufacturing" | "retail" | "education" | "consulting" | "real_estate" | "other" | null;
          company_size?: "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+" | null;
          closed_at?: string | null;
          custom_fields?: Json;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deals_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "pipeline_stages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_pipeline_id_fkey";
            columns: ["pipeline_id"];
            isOneToOne: false;
            referencedRelation: "pipelines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      contacts: {
        Row: {
          id: string;
          workspace_id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          job_title: string | null;
          company_id: string | null;
          owner_id: string | null;
          lifecycle_stage: "Lead" | "Marketing Qualified" | "Sales Qualified" | "Opportunity" | "Customer" | "Evangelist" | "Other" | null;
          source: "Inbound" | "Outbound" | "Referral" | "Partner" | "Event" | "Website" | "Other" | null;
          address: Json | null;
          social_profiles: Json;
          tags: string[];
          last_contacted_at: string | null;
          custom_fields: Json;
          avatar_url: string | null;
          deleted_at: string | null;
          search_vector: unknown | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          job_title?: string | null;
          company_id?: string | null;
          owner_id?: string | null;
          lifecycle_stage?: "Lead" | "Marketing Qualified" | "Sales Qualified" | "Opportunity" | "Customer" | "Evangelist" | "Other" | null;
          source?: "Inbound" | "Outbound" | "Referral" | "Partner" | "Event" | "Website" | "Other" | null;
          address?: Json | null;
          social_profiles?: Json;
          tags?: string[];
          last_contacted_at?: string | null;
          custom_fields?: Json;
          avatar_url?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          job_title?: string | null;
          company_id?: string | null;
          owner_id?: string | null;
          lifecycle_stage?: "Lead" | "Marketing Qualified" | "Sales Qualified" | "Opportunity" | "Customer" | "Evangelist" | "Other" | null;
          source?: "Inbound" | "Outbound" | "Referral" | "Partner" | "Event" | "Website" | "Other" | null;
          address?: Json | null;
          social_profiles?: Json;
          tags?: string[];
          last_contacted_at?: string | null;
          custom_fields?: Json;
          avatar_url?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contacts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contacts_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      companies: {
        Row: {
          id: string;
          workspace_id: string;
          company_name: string;
          domain: string | null;
          industry: string | null;
          employee_count_range: string | null;
          annual_revenue_range: string | null;
          address: Json | null;
          phone: string | null;
          website: string | null;
          description: string | null;
          owner_id: string | null;
          tags: string[];
          custom_fields: Json;
          deleted_at: string | null;
          search_vector: unknown | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          company_name: string;
          domain?: string | null;
          industry?: string | null;
          employee_count_range?: string | null;
          annual_revenue_range?: string | null;
          address?: Json | null;
          phone?: string | null;
          website?: string | null;
          description?: string | null;
          owner_id?: string | null;
          tags?: string[];
          custom_fields?: Json;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          company_name?: string;
          domain?: string | null;
          industry?: string | null;
          employee_count_range?: string | null;
          annual_revenue_range?: string | null;
          address?: Json | null;
          phone?: string | null;
          website?: string | null;
          description?: string | null;
          owner_id?: string | null;
          tags?: string[];
          custom_fields?: Json;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "companies_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "companies_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      deal_contacts: {
        Row: {
          id: string;
          workspace_id: string;
          deal_id: string;
          contact_id: string;
          role: "Decision Maker" | "Champion" | "Influencer" | "Blocker" | "End User" | null;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          deal_id: string;
          contact_id: string;
          role?: "Decision Maker" | "Champion" | "Influencer" | "Blocker" | "End User" | null;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          deal_id?: string;
          contact_id?: string;
          role?: "Decision Maker" | "Champion" | "Influencer" | "Blocker" | "End User" | null;
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deal_contacts_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_contacts_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_contacts_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      deal_events: {
        Row: {
          id: string;
          workspace_id: string;
          deal_id: string;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string | null;
          event_type: "meeting" | "call" | "demo" | "follow_up" | "deadline" | "other";
          location: string | null;
          attendees: Json;
          creator_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          deal_id: string;
          title: string;
          description?: string | null;
          start_time: string;
          end_time?: string | null;
          event_type?: "meeting" | "call" | "demo" | "follow_up" | "deadline" | "other";
          location?: string | null;
          attendees?: Json;
          creator_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          deal_id?: string;
          title?: string;
          description?: string | null;
          start_time?: string;
          end_time?: string | null;
          event_type?: "meeting" | "call" | "demo" | "follow_up" | "deadline" | "other";
          location?: string | null;
          attendees?: Json;
          creator_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deal_events_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_events_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_events_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          id: string;
          workspace_id: string;
          title: string | null;
          content: Json;
          plain_text: string;
          author_id: string;
          deal_id: string | null;
          contact_id: string | null;
          company_id: string | null;
          is_pinned: boolean;
          ai_summary: string | null;
          ai_action_items: Json;
          tags: string[];
          search_vector: unknown | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          title?: string | null;
          content?: Json;
          plain_text?: string;
          author_id: string;
          deal_id?: string | null;
          contact_id?: string | null;
          company_id?: string | null;
          is_pinned?: boolean;
          ai_summary?: string | null;
          ai_action_items?: Json;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          title?: string | null;
          content?: Json;
          plain_text?: string;
          author_id?: string;
          deal_id?: string | null;
          contact_id?: string | null;
          company_id?: string | null;
          is_pinned?: boolean;
          ai_summary?: string | null;
          ai_action_items?: Json;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          status: "To Do" | "In Progress" | "Done" | "Cancelled";
          priority: "Low" | "Medium" | "High" | "Urgent";
          due_date: string | null;
          due_time: string | null;
          assignee_id: string | null;
          creator_id: string;
          deal_id: string | null;
          contact_id: string | null;
          task_type: "Call" | "Email" | "Meeting" | "Follow-Up" | "Demo" | "Proposal" | "Other" | null;
          reminder_at: string | null;
          completed_at: string | null;
          notes: string | null;
          start_date: string | null;
          end_date: string | null;
          estimated_minutes: number | null;
          actual_minutes: number | null;
          focus_started_at: string | null;
          category: "deal" | "personal" | "workshop" | "other" | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          title: string;
          status?: "To Do" | "In Progress" | "Done" | "Cancelled";
          priority?: "Low" | "Medium" | "High" | "Urgent";
          due_date?: string | null;
          due_time?: string | null;
          assignee_id?: string | null;
          creator_id: string;
          deal_id?: string | null;
          contact_id?: string | null;
          task_type?: "Call" | "Email" | "Meeting" | "Follow-Up" | "Demo" | "Proposal" | "Other" | null;
          reminder_at?: string | null;
          completed_at?: string | null;
          notes?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          estimated_minutes?: number | null;
          actual_minutes?: number | null;
          focus_started_at?: string | null;
          category?: "deal" | "personal" | "workshop" | "other" | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          title?: string;
          status?: "To Do" | "In Progress" | "Done" | "Cancelled";
          priority?: "Low" | "Medium" | "High" | "Urgent";
          due_date?: string | null;
          due_time?: string | null;
          assignee_id?: string | null;
          creator_id?: string;
          deal_id?: string | null;
          contact_id?: string | null;
          task_type?: "Call" | "Email" | "Meeting" | "Follow-Up" | "Demo" | "Proposal" | "Other" | null;
          reminder_at?: string | null;
          completed_at?: string | null;
          notes?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          estimated_minutes?: number | null;
          actual_minutes?: number | null;
          focus_started_at?: string | null;
          category?: "deal" | "personal" | "workshop" | "other" | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey";
            columns: ["assignee_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      files: {
        Row: {
          id: string;
          workspace_id: string;
          original_filename: string;
          storage_path: string;
          mime_type: string;
          file_size_bytes: number;
          uploaded_by: string;
          deal_id: string | null;
          contact_id: string | null;
          company_id: string | null;
          description: string | null;
          tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          original_filename: string;
          storage_path: string;
          mime_type: string;
          file_size_bytes: number;
          uploaded_by: string;
          deal_id?: string | null;
          contact_id?: string | null;
          company_id?: string | null;
          description?: string | null;
          tags?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          original_filename?: string;
          storage_path?: string;
          mime_type?: string;
          file_size_bytes?: number;
          uploaded_by?: string;
          deal_id?: string | null;
          contact_id?: string | null;
          company_id?: string | null;
          description?: string | null;
          tags?: string[];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "files_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "files_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "files_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "files_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "files_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      activities: {
        Row: {
          id: string;
          workspace_id: string;
          activity_type: "deal_created" | "deal_updated" | "deal_stage_changed" | "deal_won" | "deal_lost" | "contact_created" | "contact_updated" | "company_created" | "company_updated" | "note_created" | "task_created" | "task_completed" | "file_uploaded" | "file_deleted" | "email_logged" | "call_logged" | "meeting_logged";
          actor_id: string;
          entity_type: string;
          entity_id: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          activity_type: "deal_created" | "deal_updated" | "deal_stage_changed" | "deal_won" | "deal_lost" | "contact_created" | "contact_updated" | "company_created" | "company_updated" | "note_created" | "task_created" | "task_completed" | "file_uploaded" | "file_deleted" | "email_logged" | "call_logged" | "meeting_logged";
          actor_id: string;
          entity_type: string;
          entity_id: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          activity_type?: "deal_created" | "deal_updated" | "deal_stage_changed" | "deal_won" | "deal_lost" | "contact_created" | "contact_updated" | "company_created" | "company_updated" | "note_created" | "task_created" | "task_completed" | "file_uploaded" | "file_deleted" | "email_logged" | "call_logged" | "meeting_logged";
          actor_id?: string;
          entity_type?: string;
          entity_id?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activities_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      custom_field_definitions: {
        Row: {
          id: string;
          workspace_id: string;
          entity_type: "Deal" | "Contact" | "Company";
          field_name: string;
          field_key: string;
          field_type: "Text" | "Long Text" | "Number" | "Currency" | "Date" | "DateTime" | "Single Select" | "Multi Select" | "Checkbox" | "URL" | "Email" | "Phone" | "User" | "Rating";
          is_required: boolean;
          default_value: Json | null;
          options: Json;
          display_order: number;
          pipeline_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          entity_type: "Deal" | "Contact" | "Company";
          field_name: string;
          field_key: string;
          field_type: "Text" | "Long Text" | "Number" | "Currency" | "Date" | "DateTime" | "Single Select" | "Multi Select" | "Checkbox" | "URL" | "Email" | "Phone" | "User" | "Rating";
          is_required?: boolean;
          default_value?: Json | null;
          options?: Json;
          display_order?: number;
          pipeline_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          entity_type?: "Deal" | "Contact" | "Company";
          field_name?: string;
          field_key?: string;
          field_type?: "Text" | "Long Text" | "Number" | "Currency" | "Date" | "DateTime" | "Single Select" | "Multi Select" | "Checkbox" | "URL" | "Email" | "Phone" | "User" | "Rating";
          is_required?: boolean;
          default_value?: Json | null;
          options?: Json;
          display_order?: number;
          pipeline_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "custom_field_definitions_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "custom_field_definitions_pipeline_id_fkey";
            columns: ["pipeline_id"];
            isOneToOne: false;
            referencedRelation: "pipelines";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_preferences: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          deal_assigned: "realtime" | "daily" | "weekly" | "off";
          stage_changed: "realtime" | "daily" | "weekly" | "off";
          task_assigned: "realtime" | "daily" | "weekly" | "off";
          task_due_soon: "realtime" | "daily" | "weekly" | "off";
          task_overdue: "realtime" | "daily" | "weekly" | "off";
          mention_in_note: "realtime" | "daily" | "weekly" | "off";
          new_note_on_deal: "realtime" | "daily" | "weekly" | "off";
          ai_insight: "realtime" | "daily" | "weekly" | "off";
          weekly_summary: "realtime" | "daily" | "weekly" | "off";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          deal_assigned?: "realtime" | "daily" | "weekly" | "off";
          stage_changed?: "realtime" | "daily" | "weekly" | "off";
          task_assigned?: "realtime" | "daily" | "weekly" | "off";
          task_due_soon?: "realtime" | "daily" | "weekly" | "off";
          task_overdue?: "realtime" | "daily" | "weekly" | "off";
          mention_in_note?: "realtime" | "daily" | "weekly" | "off";
          new_note_on_deal?: "realtime" | "daily" | "weekly" | "off";
          ai_insight?: "realtime" | "daily" | "weekly" | "off";
          weekly_summary?: "realtime" | "daily" | "weekly" | "off";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          deal_assigned?: "realtime" | "daily" | "weekly" | "off";
          stage_changed?: "realtime" | "daily" | "weekly" | "off";
          task_assigned?: "realtime" | "daily" | "weekly" | "off";
          task_due_soon?: "realtime" | "daily" | "weekly" | "off";
          task_overdue?: "realtime" | "daily" | "weekly" | "off";
          mention_in_note?: "realtime" | "daily" | "weekly" | "off";
          new_note_on_deal?: "realtime" | "daily" | "weekly" | "off";
          ai_insight?: "realtime" | "daily" | "weekly" | "off";
          weekly_summary?: "realtime" | "daily" | "weekly" | "off";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_preferences_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notification_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      user_role: "Admin" | "Manager" | "Member";
      member_status: "Active" | "Invited" | "Deactivated";
      deal_priority: "Low" | "Medium" | "High" | "Critical";
      deal_source: "Inbound" | "Outbound" | "Referral" | "Partner" | "Event" | "Website" | "Other" | "LinkedIn" | "Cold Outreach" | "Conference";
      lifecycle_stage: "Lead" | "Marketing Qualified" | "Sales Qualified" | "Opportunity" | "Customer" | "Evangelist" | "Other";
      contact_role: "Decision Maker" | "Champion" | "Influencer" | "Blocker" | "End User";
      task_status: "To Do" | "In Progress" | "Done" | "Cancelled";
      task_priority: "Low" | "Medium" | "High" | "Urgent";
      task_type: "Call" | "Email" | "Meeting" | "Follow-Up" | "Demo" | "Proposal" | "Other";
      activity_type: "deal_created" | "deal_updated" | "deal_stage_changed" | "deal_won" | "deal_lost" | "contact_created" | "contact_updated" | "company_created" | "company_updated" | "note_created" | "task_created" | "task_completed" | "file_uploaded" | "file_deleted" | "email_logged" | "call_logged" | "meeting_logged";
      custom_field_type: "Text" | "Long Text" | "Number" | "Currency" | "Date" | "DateTime" | "Single Select" | "Multi Select" | "Checkbox" | "URL" | "Email" | "Phone" | "User" | "Rating";
      custom_field_entity: "Deal" | "Contact" | "Company";
      notification_channel: "realtime" | "daily" | "weekly" | "off";
    };
    CompositeTypes: {};
  };
};

// Convenience type aliases
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
