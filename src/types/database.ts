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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: number
          image_url: string | null
          is_active: boolean
          name: string
          parent_id: number | null
          position: number
          route_segment: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          id?: never
          image_url?: string | null
          is_active?: boolean
          name: string
          parent_id?: number | null
          position?: number
          route_segment?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          id?: never
          image_url?: string | null
          is_active?: boolean
          name?: string
          parent_id?: number | null
          position?: number
          route_segment?: string | null
          slug?: string
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
      delivery_areas: {
        Row: {
          city: string
          delivery_fee_paise: number
          id: number
          is_serviceable: boolean
          pincode: string
          supports_same_day: boolean
        }
        Insert: {
          city: string
          delivery_fee_paise?: number
          id?: never
          is_serviceable?: boolean
          pincode: string
          supports_same_day?: boolean
        }
        Update: {
          city?: string
          delivery_fee_paise?: number
          id?: never
          is_serviceable?: boolean
          pincode?: string
          supports_same_day?: boolean
        }
        Relationships: []
      }
      delivery_slots: {
        Row: {
          end_time: string
          id: number
          is_active: boolean
          label: string
          position: number
          start_time: string
          surcharge_paise: number
        }
        Insert: {
          end_time: string
          id?: never
          is_active?: boolean
          label: string
          position?: number
          start_time: string
          surcharge_paise?: number
        }
        Update: {
          end_time?: string
          id?: never
          is_active?: boolean
          label?: string
          position?: number
          start_time?: string
          surcharge_paise?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          cake_message: string | null
          id: number
          image_url: string | null
          order_id: number
          photo_url: string | null
          product_id: number | null
          product_name: string
          quantity: number
          unit_price_paise: number
          variant_id: number | null
          weight_label: string | null
        }
        Insert: {
          cake_message?: string | null
          id?: never
          image_url?: string | null
          order_id: number
          photo_url?: string | null
          product_id?: number | null
          product_name: string
          quantity: number
          unit_price_paise: number
          variant_id?: number | null
          weight_label?: string | null
        }
        Update: {
          cake_message?: string | null
          id?: never
          image_url?: string | null
          order_id?: number
          photo_url?: string | null
          product_id?: number | null
          product_name?: string
          quantity?: number
          unit_price_paise?: number
          variant_id?: number | null
          weight_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          created_at: string
          delivery_date: string
          delivery_fee_paise: number
          delivery_instructions: string | null
          delivery_slot_id: number | null
          discount_paise: number
          id: number
          order_number: string
          payment_method: string
          payment_status: string
          pincode: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          recipient_name: string
          recipient_phone: string
          status: string
          subtotal_paise: number
          total_paise: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          created_at?: string
          delivery_date: string
          delivery_fee_paise?: number
          delivery_instructions?: string | null
          delivery_slot_id?: number | null
          discount_paise?: number
          id?: never
          order_number?: string
          payment_method?: string
          payment_status?: string
          pincode: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          recipient_name: string
          recipient_phone: string
          status?: string
          subtotal_paise: number
          total_paise: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          created_at?: string
          delivery_date?: string
          delivery_fee_paise?: number
          delivery_instructions?: string | null
          delivery_slot_id?: number | null
          discount_paise?: number
          id?: never
          order_number?: string
          payment_method?: string
          payment_status?: string
          pincode?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          recipient_name?: string
          recipient_phone?: string
          status?: string
          subtotal_paise?: number
          total_paise?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_slot_id_fkey"
            columns: ["delivery_slot_id"]
            isOneToOne: false
            referencedRelation: "delivery_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt: string | null
          id: number
          position: number
          product_id: number
          url: string
        }
        Insert: {
          alt?: string | null
          id?: never
          position?: number
          product_id: number
          url: string
        }
        Update: {
          alt?: string | null
          id?: never
          position?: number
          product_id?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          id: number
          is_active: boolean
          position: number
          price_paise: number
          product_id: number
          serving_label: string | null
          sku: string | null
          stock: number | null
          weight_label: string
        }
        Insert: {
          id?: never
          is_active?: boolean
          position?: number
          price_paise: number
          product_id: number
          serving_label?: string | null
          sku?: string | null
          stock?: number | null
          weight_label: string
        }
        Update: {
          id?: never
          is_active?: boolean
          position?: number
          price_paise?: number
          product_id?: number
          serving_label?: string | null
          sku?: string | null
          stock?: number | null
          weight_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price_paise: number
          category_id: number | null
          chef_word: string | null
          created_at: string
          description: string | null
          flavour: string | null
          id: number
          is_active: boolean
          is_bestseller: boolean
          is_eggless: boolean
          name: string
          price_note: string | null
          rating: number | null
          review_count: number
          search_vector: unknown
          sku: string
          slug: string
          tag: string | null
          updated_at: string
        }
        Insert: {
          base_price_paise: number
          category_id?: number | null
          chef_word?: string | null
          created_at?: string
          description?: string | null
          flavour?: string | null
          id?: never
          is_active?: boolean
          is_bestseller?: boolean
          is_eggless?: boolean
          name: string
          price_note?: string | null
          rating?: number | null
          review_count?: number
          search_vector?: unknown
          sku: string
          slug: string
          tag?: string | null
          updated_at?: string
        }
        Update: {
          base_price_paise?: number
          category_id?: number | null
          chef_word?: string | null
          created_at?: string
          description?: string | null
          flavour?: string | null
          id?: never
          is_active?: boolean
          is_bestseller?: boolean
          is_eggless?: boolean
          name?: string
          price_note?: string | null
          rating?: number | null
          review_count?: number
          search_vector?: unknown
          sku?: string
          slug?: string
          tag?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string
          id: number
          product_id: number
          rating: number
          title: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: never
          product_id: number
          rating: number
          title?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: never
          product_id?: number
          rating?: number
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          created_at: string
          product_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          product_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          product_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      next_order_number: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
