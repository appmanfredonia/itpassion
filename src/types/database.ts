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
      blocked_users: {
        Row: {
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          blocker_id?: string;
          blocked_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_id_fkey";
            columns: ["blocked_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blocked_users_blocker_id_fkey";
            columns: ["blocker_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      conversation_participants: {
        Row: {
          conversation_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          conversation_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          conversation_id?: string;
          user_id?: string;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: {
          id: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follows_following_id_fkey";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      likes: {
        Row: {
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      local_tribe_memberships: {
        Row: {
          tribe_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          tribe_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          tribe_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "local_tribe_memberships_tribe_id_fkey";
            columns: ["tribe_id"];
            isOneToOne: false;
            referencedRelation: "local_tribes";
            referencedColumns: ["id"];
          },
        ];
      };
      local_tribes: {
        Row: {
          id: string;
          passion_slug: string;
          province: string;
          province_key: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          passion_slug: string;
          province: string;
          province_key: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          passion_slug?: string;
          province?: string;
          province_key?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "local_tribes_passion_slug_fkey";
            columns: ["passion_slug"];
            isOneToOne: false;
            referencedRelation: "passions";
            referencedColumns: ["slug"];
          },
        ];
      };
      passions: {
        Row: {
          slug: string;
          name: string;
          created_at: string;
        };
        Insert: {
          slug: string;
          name: string;
          created_at?: string;
        };
        Update: {
          slug?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      post_media: {
        Row: {
          id: string;
          post_id: string;
          media_url: string;
          media_kind: "image" | "video";
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          media_url: string;
          media_kind: "image" | "video";
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          media_url?: string;
          media_kind?: "image" | "video";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          passion_slug: string;
          content_type: "text" | "image" | "video";
          text_content: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          passion_slug: string;
          content_type: "text" | "image" | "video";
          text_content?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          passion_slug?: string;
          content_type?: "text" | "image" | "video";
          text_content?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_passion_slug_fkey";
            columns: ["passion_slug"];
            isOneToOne: false;
            referencedRelation: "passions";
            referencedColumns: ["slug"];
          },
        ];
      };
      privacy_settings: {
        Row: {
          user_id: string;
          is_profile_private: boolean;
          who_can_message: "everyone" | "followers" | "nobody";
          show_online_status: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          is_profile_private?: boolean;
          who_can_message?: "everyone" | "followers" | "nobody";
          show_online_status?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          is_profile_private?: boolean;
          who_can_message?: "everyone" | "followers" | "nobody";
          show_online_status?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "privacy_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_posts: {
        Row: {
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      tribe_rituals: {
        Row: {
          id: string;
          tribe_id: string;
          creator_id: string;
          title: string;
          description: string | null;
          city: string | null;
          scheduled_for: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tribe_id: string;
          creator_id: string;
          title: string;
          description?: string | null;
          city?: string | null;
          scheduled_for: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tribe_id?: string;
          creator_id?: string;
          title?: string;
          description?: string | null;
          city?: string | null;
          scheduled_for?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tribe_rituals_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tribe_rituals_tribe_id_fkey";
            columns: ["tribe_id"];
            isOneToOne: false;
            referencedRelation: "local_tribes";
            referencedColumns: ["id"];
          },
        ];
      };
      user_passions: {
        Row: {
          user_id: string;
          passion_slug: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          passion_slug: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          passion_slug?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_passions_passion_slug_fkey";
            columns: ["passion_slug"];
            isOneToOne: false;
            referencedRelation: "passions";
            referencedColumns: ["slug"];
          },
        ];
      };
      users: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          bio: string | null;
          avatar_url: string | null;
          city: string | null;
          province: string | null;
          region: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          bio?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          province?: string | null;
          region?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          province?: string | null;
          region?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      are_users_blocked: {
        Args: {
          a: string;
          b: string;
        };
        Returns: boolean;
      };
      is_conversation_participant: {
        Args: {
          p_conversation_id: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      sync_user_local_tribes: {
        Args: {
          p_user_id: string;
        };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
