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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
          reason: string | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          reason?: string | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          reason?: string | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string | null
          bank_account: string | null
          bank_branch: string | null
          bank_name: string | null
          bank_swift: string | null
          company_name: string
          currency: string
          email: string | null
          id: number
          kra_pin: string | null
          logo_url: string | null
          low_stock_threshold: number
          mpesa_account: string | null
          mpesa_paybill: string | null
          mpesa_till: string | null
          payment_voucher_dual_auth_threshold: number
          phone: string | null
          vat_rate: number
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          bank_swift?: string | null
          company_name?: string
          currency?: string
          email?: string | null
          id?: number
          kra_pin?: string | null
          logo_url?: string | null
          low_stock_threshold?: number
          mpesa_account?: string | null
          mpesa_paybill?: string | null
          mpesa_till?: string | null
          payment_voucher_dual_auth_threshold?: number
          phone?: string | null
          vat_rate?: number
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          bank_swift?: string | null
          company_name?: string
          currency?: string
          email?: string | null
          id?: number
          kra_pin?: string | null
          logo_url?: string | null
          low_stock_threshold?: number
          mpesa_account?: string | null
          mpesa_paybill?: string | null
          mpesa_till?: string | null
          payment_voucher_dual_auth_threshold?: number
          phone?: string | null
          vat_rate?: number
        }
        Relationships: []
      }
      correction_requests: {
        Row: {
          approved_by: string | null
          created_at: string
          decided_at: string | null
          doc_id: string
          doc_type: string
          id: string
          reason: string
          requested_by: string | null
          status: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          decided_at?: string | null
          doc_id: string
          doc_type: string
          id?: string
          reason: string
          requested_by?: string | null
          status?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          decided_at?: string | null
          doc_id?: string
          doc_type?: string
          id?: string
          reason?: string
          requested_by?: string | null
          status?: string
        }
        Relationships: []
      }
      credit_notes: {
        Row: {
          amount: number
          approved_by: string | null
          cn_no: string
          created_at: string | null
          id: string
          invoice_id: string
          reason: string | null
        }
        Insert: {
          amount?: number
          approved_by?: string | null
          cn_no: string
          created_at?: string | null
          id?: string
          invoice_id: string
          reason?: string | null
        }
        Update: {
          amount?: number
          approved_by?: string | null
          cn_no?: string
          created_at?: string | null
          id?: string
          invoice_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_lpos: {
        Row: {
          clpo_no: string
          created_at: string | null
          customer_id: string
          customer_lpo_no: string
          id: string
          notes: string | null
        }
        Insert: {
          clpo_no: string
          created_at?: string | null
          customer_id: string
          customer_lpo_no: string
          id?: string
          notes?: string | null
        }
        Update: {
          clpo_no?: string
          created_at?: string | null
          customer_id?: string
          customer_lpo_no?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_lpos_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string | null
          credit_limit: number | null
          email: string | null
          id: string
          kra_pin: string | null
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          credit_limit?: number | null
          email?: string | null
          id?: string
          kra_pin?: string | null
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          credit_limit?: number | null
          email?: string | null
          id?: string
          kra_pin?: string | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      debit_notes: {
        Row: {
          amount: number
          created_at: string | null
          dn_no: string
          id: string
          return_id: string | null
          supplier_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          dn_no: string
          id?: string
          return_id?: string | null
          supplier_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          dn_no?: string
          id?: string
          return_id?: string | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "debit_notes_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "return_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debit_notes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_notes: {
        Row: {
          created_at: string | null
          customer_signature: string | null
          delivery_address: string | null
          dn_no: string
          driver_name: string | null
          id: string
          signed: boolean
          signed_at: string | null
          so_id: string
          vehicle_reg: string | null
        }
        Insert: {
          created_at?: string | null
          customer_signature?: string | null
          delivery_address?: string | null
          dn_no: string
          driver_name?: string | null
          id?: string
          signed?: boolean
          signed_at?: string | null
          so_id: string
          vehicle_reg?: string | null
        }
        Update: {
          created_at?: string | null
          customer_signature?: string | null
          delivery_address?: string | null
          dn_no?: string
          driver_name?: string | null
          id?: string
          signed?: boolean
          signed_at?: string | null
          so_id?: string
          vehicle_reg?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_notes_so_id_fkey"
            columns: ["so_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      doc_counters: {
        Row: {
          doc_type: string
          last_no: number
          prefix: string
        }
        Insert: {
          doc_type: string
          last_no?: number
          prefix?: string
        }
        Update: {
          doc_type?: string
          last_no?: number
          prefix?: string
        }
        Relationships: []
      }
      document_attachments: {
        Row: {
          created_at: string
          doc_id: string
          doc_type: string
          file_path: string
          id: string
          label: string | null
          mime_type: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          doc_id: string
          doc_type: string
          file_path: string
          id?: string
          label?: string | null
          mime_type?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          doc_id?: string
          doc_type?: string
          file_path?: string
          id?: string
          label?: string | null
          mime_type?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      grn_items: {
        Row: {
          batch: string | null
          condition: string | null
          expiry: string | null
          grn_id: string
          id: string
          lpo_item_id: string | null
          lpo_qty: number | null
          product_id: string | null
          received_qty: number | null
        }
        Insert: {
          batch?: string | null
          condition?: string | null
          expiry?: string | null
          grn_id: string
          id?: string
          lpo_item_id?: string | null
          lpo_qty?: number | null
          product_id?: string | null
          received_qty?: number | null
        }
        Update: {
          batch?: string | null
          condition?: string | null
          expiry?: string | null
          grn_id?: string
          id?: string
          lpo_item_id?: string | null
          lpo_qty?: number | null
          product_id?: string | null
          received_qty?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grn_items_grn_id_fkey"
            columns: ["grn_id"]
            isOneToOne: false
            referencedRelation: "grns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grn_items_lpo_item_id_fkey"
            columns: ["lpo_item_id"]
            isOneToOne: false
            referencedRelation: "lpo_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grn_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      grns: {
        Row: {
          created_at: string | null
          grn_no: string
          id: string
          lpo_id: string
          received_by: string | null
          sdn_id: string | null
          status: Database["public"]["Enums"]["doc_status"]
          supervisor_signature: string | null
        }
        Insert: {
          created_at?: string | null
          grn_no: string
          id?: string
          lpo_id: string
          received_by?: string | null
          sdn_id?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          supervisor_signature?: string | null
        }
        Update: {
          created_at?: string | null
          grn_no?: string
          id?: string
          lpo_id?: string
          received_by?: string | null
          sdn_id?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          supervisor_signature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grns_lpo_id_fkey"
            columns: ["lpo_id"]
            isOneToOne: false
            referencedRelation: "lpos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grns_sdn_id_fkey"
            columns: ["sdn_id"]
            isOneToOne: false
            referencedRelation: "supplier_delivery_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          description: string | null
          id: string
          invoice_id: string
          product_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          description?: string | null
          id?: string
          invoice_id: string
          product_id?: string | null
          quantity: number
          unit_price: number
        }
        Update: {
          description?: string | null
          id?: string
          invoice_id?: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number | null
          buyer_kra_pin: string | null
          created_at: string | null
          customer_id: string
          customer_lpo_no: string | null
          dn_id: string | null
          due_date: string | null
          etr_ref: string | null
          id: string
          invoice_no: string
          is_tax_invoice: boolean
          seller_kra_pin: string | null
          so_id: string | null
          status: Database["public"]["Enums"]["doc_status"]
          subtotal: number | null
          total: number | null
          vat: number | null
        }
        Insert: {
          amount_paid?: number | null
          buyer_kra_pin?: string | null
          created_at?: string | null
          customer_id: string
          customer_lpo_no?: string | null
          dn_id?: string | null
          due_date?: string | null
          etr_ref?: string | null
          id?: string
          invoice_no: string
          is_tax_invoice?: boolean
          seller_kra_pin?: string | null
          so_id?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal?: number | null
          total?: number | null
          vat?: number | null
        }
        Update: {
          amount_paid?: number | null
          buyer_kra_pin?: string | null
          created_at?: string | null
          customer_id?: string
          customer_lpo_no?: string | null
          dn_id?: string | null
          due_date?: string | null
          etr_ref?: string | null
          id?: string
          invoice_no?: string
          is_tax_invoice?: boolean
          seller_kra_pin?: string | null
          so_id?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal?: number | null
          total?: number | null
          vat?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_dn_id_fkey"
            columns: ["dn_id"]
            isOneToOne: false
            referencedRelation: "delivery_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_so_id_fkey"
            columns: ["so_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      lpo_acknowledgements: {
        Row: {
          accepted: boolean | null
          confirmed_delivery: string | null
          created_at: string | null
          deviations: string | null
          id: string
          lpo_id: string
        }
        Insert: {
          accepted?: boolean | null
          confirmed_delivery?: string | null
          created_at?: string | null
          deviations?: string | null
          id?: string
          lpo_id: string
        }
        Update: {
          accepted?: boolean | null
          confirmed_delivery?: string | null
          created_at?: string | null
          deviations?: string | null
          id?: string
          lpo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lpo_acknowledgements_lpo_id_fkey"
            columns: ["lpo_id"]
            isOneToOne: false
            referencedRelation: "lpos"
            referencedColumns: ["id"]
          },
        ]
      }
      lpo_items: {
        Row: {
          description: string
          id: string
          lpo_id: string
          product_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          lpo_id: string
          product_id?: string | null
          quantity: number
          unit_price: number
        }
        Update: {
          description?: string
          id?: string
          lpo_id?: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "lpo_items_lpo_id_fkey"
            columns: ["lpo_id"]
            isOneToOne: false
            referencedRelation: "lpos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lpo_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      lpos: {
        Row: {
          created_at: string | null
          created_by: string | null
          delivery_date: string | null
          id: string
          kra_pin: string | null
          lpo_no: string
          payment_terms: string | null
          pr_id: string | null
          rfq_id: string | null
          signatory: string | null
          status: Database["public"]["Enums"]["doc_status"]
          subtotal: number | null
          supplier_id: string
          total: number | null
          vat: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          delivery_date?: string | null
          id?: string
          kra_pin?: string | null
          lpo_no: string
          payment_terms?: string | null
          pr_id?: string | null
          rfq_id?: string | null
          signatory?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal?: number | null
          supplier_id: string
          total?: number | null
          vat?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          delivery_date?: string | null
          id?: string
          kra_pin?: string | null
          lpo_no?: string
          payment_terms?: string | null
          pr_id?: string | null
          rfq_id?: string | null
          signatory?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal?: number | null
          supplier_id?: string
          total?: number | null
          vat?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lpos_pr_id_fkey"
            columns: ["pr_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lpos_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lpos_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      packing_notes: {
        Row: {
          cartons: number | null
          condition_check: string | null
          created_at: string | null
          id: string
          pn_no: string
          so_id: string
          weight: number | null
        }
        Insert: {
          cartons?: number | null
          condition_check?: string | null
          created_at?: string | null
          id?: string
          pn_no: string
          so_id: string
          weight?: number | null
        }
        Update: {
          cartons?: number | null
          condition_check?: string | null
          created_at?: string | null
          id?: string
          pn_no?: string
          so_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "packing_notes_so_id_fkey"
            columns: ["so_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_vouchers: {
        Row: {
          amount: number
          authorised_by: string | null
          created_at: string | null
          id: string
          method: string
          paid_at: string | null
          pv_no: string
          reference: string | null
          secondary_auth_by: string | null
          status: Database["public"]["Enums"]["doc_status"]
          supplier_invoice_id: string
        }
        Insert: {
          amount: number
          authorised_by?: string | null
          created_at?: string | null
          id?: string
          method?: string
          paid_at?: string | null
          pv_no: string
          reference?: string | null
          secondary_auth_by?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          supplier_invoice_id: string
        }
        Update: {
          amount?: number
          authorised_by?: string | null
          created_at?: string | null
          id?: string
          method?: string
          paid_at?: string | null
          pv_no?: string
          reference?: string | null
          secondary_auth_by?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          supplier_invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_vouchers_supplier_invoice_id_fkey"
            columns: ["supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      picking_lists: {
        Row: {
          created_at: string | null
          id: string
          picker: string | null
          pl_no: string
          so_id: string
          status: Database["public"]["Enums"]["doc_status"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          picker?: string | null
          pl_no: string
          so_id: string
          status?: Database["public"]["Enums"]["doc_status"]
        }
        Update: {
          created_at?: string | null
          id?: string
          picker?: string | null
          pl_no?: string
          so_id?: string
          status?: Database["public"]["Enums"]["doc_status"]
        }
        Relationships: [
          {
            foreignKeyName: "picking_lists_so_id_fkey"
            columns: ["so_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sale_items: {
        Row: {
          description: string | null
          id: string
          line_total: number
          product_id: string | null
          quantity: number
          sale_id: string
          unit_price: number
        }
        Insert: {
          description?: string | null
          id?: string
          line_total: number
          product_id?: string | null
          quantity: number
          sale_id: string
          unit_price: number
        }
        Update: {
          description?: string | null
          id?: string
          line_total?: number
          product_id?: string | null
          quantity?: number
          sale_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "pos_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sales: {
        Row: {
          buyer_kra_pin: string | null
          cash_received: number | null
          cashier: string | null
          change_due: number | null
          created_at: string | null
          customer_id: string | null
          discount: number | null
          id: string
          is_tax_invoice: boolean
          mpesa_code: string | null
          payment_method: string
          sale_no: string
          status: string
          subtotal: number | null
          total: number | null
          vat: number | null
        }
        Insert: {
          buyer_kra_pin?: string | null
          cash_received?: number | null
          cashier?: string | null
          change_due?: number | null
          created_at?: string | null
          customer_id?: string | null
          discount?: number | null
          id?: string
          is_tax_invoice?: boolean
          mpesa_code?: string | null
          payment_method?: string
          sale_no: string
          status?: string
          subtotal?: number | null
          total?: number | null
          vat?: number | null
        }
        Update: {
          buyer_kra_pin?: string | null
          cash_received?: number | null
          cashier?: string | null
          change_due?: number | null
          created_at?: string | null
          customer_id?: string | null
          discount?: number | null
          id?: string
          is_tax_invoice?: boolean
          mpesa_code?: string | null
          payment_method?: string
          sale_no?: string
          status?: string
          subtotal?: number | null
          total?: number | null
          vat?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      pr_items: {
        Row: {
          description: string
          id: string
          pr_id: string
          quantity: number
          unit: string | null
        }
        Insert: {
          description: string
          id?: string
          pr_id: string
          quantity: number
          unit?: string | null
        }
        Update: {
          description?: string
          id?: string
          pr_id?: string
          quantity?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pr_items_pr_id_fkey"
            columns: ["pr_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          category_id: string | null
          cost_price: number
          created_at: string | null
          id: string
          is_active: boolean
          name: string
          reorder_level: number
          selling_price: number
          sku: string
          stock_qty: number
          unit: string | null
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          reorder_level?: number
          selling_price?: number
          sku: string
          stock_qty?: number
          unit?: string | null
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          reorder_level?: number
          selling_price?: number
          sku?: string
          stock_qty?: number
          unit?: string | null
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
          approval_pin_hash: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          pin_attempts: number
          pin_locked_until: string | null
        }
        Insert: {
          approval_pin_hash?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          pin_attempts?: number
          pin_locked_until?: string | null
        }
        Update: {
          approval_pin_hash?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          pin_attempts?: number
          pin_locked_until?: string | null
        }
        Relationships: []
      }
      purchase_requisitions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          budget_code: string | null
          created_at: string | null
          created_by: string | null
          department: string | null
          id: string
          pr_no: string
          reason: string | null
          status: Database["public"]["Enums"]["doc_status"]
          urgency: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          budget_code?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          id?: string
          pr_no: string
          reason?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          urgency?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          budget_code?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          id?: string
          pr_no?: string
          reason?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          urgency?: string | null
        }
        Relationships: []
      }
      quotation_items: {
        Row: {
          description: string | null
          id: string
          product_id: string | null
          quantity: number
          quotation_id: string
          unit_price: number
        }
        Insert: {
          description?: string | null
          id?: string
          product_id?: string | null
          quantity: number
          quotation_id: string
          unit_price: number
        }
        Update: {
          description?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          quotation_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          created_at: string | null
          customer_id: string
          discount: number | null
          id: string
          payment_terms: string | null
          quote_no: string
          status: Database["public"]["Enums"]["doc_status"]
          subtotal: number | null
          total: number | null
          validity: string | null
          vat: number | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          discount?: number | null
          id?: string
          payment_terms?: string | null
          quote_no: string
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal?: number | null
          total?: number | null
          validity?: string | null
          vat?: number | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          discount?: number | null
          id?: string
          payment_terms?: string | null
          quote_no?: string
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal?: number | null
          total?: number | null
          validity?: string | null
          vat?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          amount: number
          created_at: string | null
          customer_id: string | null
          id: string
          invoice_id: string | null
          method: string
          mpesa_code: string | null
          receipt_no: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          customer_id?: string | null
          id?: string
          invoice_id?: string | null
          method?: string
          mpesa_code?: string | null
          receipt_no: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_id?: string | null
          id?: string
          invoice_id?: string | null
          method?: string
          mpesa_code?: string | null
          receipt_no?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      remittance_advice: {
        Row: {
          created_at: string | null
          id: string
          payment_voucher_id: string
          ra_no: string
          reference: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_voucher_id: string
          ra_no: string
          reference?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_voucher_id?: string
          ra_no?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "remittance_advice_payment_voucher_id_fkey"
            columns: ["payment_voucher_id"]
            isOneToOne: false
            referencedRelation: "payment_vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      return_notes: {
        Row: {
          created_at: string | null
          grn_id: string | null
          id: string
          reason: string | null
          rtn_no: string
        }
        Insert: {
          created_at?: string | null
          grn_id?: string | null
          id?: string
          reason?: string | null
          rtn_no: string
        }
        Update: {
          created_at?: string | null
          grn_id?: string | null
          id?: string
          reason?: string | null
          rtn_no?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_notes_grn_id_fkey"
            columns: ["grn_id"]
            isOneToOne: false
            referencedRelation: "grns"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_suppliers: {
        Row: {
          id: string
          rfq_id: string
          supplier_id: string
        }
        Insert: {
          id?: string
          rfq_id: string
          supplier_id: string
        }
        Update: {
          id?: string
          rfq_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_suppliers_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      rfqs: {
        Row: {
          created_at: string | null
          id: string
          payment_terms: string | null
          pr_id: string | null
          required_delivery: string | null
          rfq_no: string
          status: Database["public"]["Enums"]["doc_status"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_terms?: string | null
          pr_id?: string | null
          required_delivery?: string | null
          rfq_no: string
          status?: Database["public"]["Enums"]["doc_status"]
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_terms?: string | null
          pr_id?: string | null
          required_delivery?: string | null
          rfq_no?: string
          status?: Database["public"]["Enums"]["doc_status"]
        }
        Relationships: [
          {
            foreignKeyName: "rfqs_pr_id_fkey"
            columns: ["pr_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          created_at: string | null
          customer_id: string
          customer_lpo_id: string | null
          customer_lpo_no: string | null
          id: string
          quote_id: string | null
          so_no: string
          status: Database["public"]["Enums"]["doc_status"]
          subtotal: number | null
          total: number | null
          vat: number | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          customer_lpo_id?: string | null
          customer_lpo_no?: string | null
          id?: string
          quote_id?: string | null
          so_no: string
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal?: number | null
          total?: number | null
          vat?: number | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          customer_lpo_id?: string | null
          customer_lpo_no?: string | null
          id?: string
          quote_id?: string | null
          so_no?: string
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal?: number | null
          total?: number | null
          vat?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_customer_lpo_id_fkey"
            columns: ["customer_lpo_id"]
            isOneToOne: false
            referencedRelation: "customer_lpos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      so_items: {
        Row: {
          description: string | null
          id: string
          product_id: string | null
          quantity: number
          so_id: string
          unit_price: number
        }
        Insert: {
          description?: string | null
          id?: string
          product_id?: string | null
          quantity: number
          so_id: string
          unit_price: number
        }
        Update: {
          description?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          so_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "so_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_items_so_id_fkey"
            columns: ["so_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string | null
          id: string
          movement_type: string
          notes: string | null
          product_id: string
          qty_change: number
          ref_doc_id: string | null
          ref_doc_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          product_id: string
          qty_change: number
          ref_doc_id?: string | null
          ref_doc_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          product_id?: string
          qty_change?: number
          ref_doc_id?: string | null
          ref_doc_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_delivery_notes: {
        Row: {
          driver_name: string | null
          id: string
          lpo_id: string
          received_at: string | null
          sdn_no: string
          vehicle_reg: string | null
        }
        Insert: {
          driver_name?: string | null
          id?: string
          lpo_id: string
          received_at?: string | null
          sdn_no: string
          vehicle_reg?: string | null
        }
        Update: {
          driver_name?: string | null
          id?: string
          lpo_id?: string
          received_at?: string | null
          sdn_no?: string
          vehicle_reg?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_delivery_notes_lpo_id_fkey"
            columns: ["lpo_id"]
            isOneToOne: false
            referencedRelation: "lpos"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_invoices: {
        Row: {
          amount: number
          created_at: string | null
          grn_id: string | null
          id: string
          invoice_no: string
          lpo_id: string
          match_status: string
          notes: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          grn_id?: string | null
          id?: string
          invoice_no: string
          lpo_id: string
          match_status?: string
          notes?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          grn_id?: string | null
          id?: string
          invoice_no?: string
          lpo_id?: string
          match_status?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoices_grn_id_fkey"
            columns: ["grn_id"]
            isOneToOne: false
            referencedRelation: "grns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoices_lpo_id_fkey"
            columns: ["lpo_id"]
            isOneToOne: false
            referencedRelation: "lpos"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_quotes: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          rfq_id: string
          selected: boolean | null
          supplier_id: string
          total: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          rfq_id: string
          selected?: boolean | null
          supplier_id: string
          total?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          rfq_id?: string
          selected?: boolean | null
          supplier_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_quotes_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_quotes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          kra_pin: string | null
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          kra_pin?: string | null
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          kra_pin?: string | null
          name?: string
          phone?: string | null
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
      adjust_stock: {
        Args: {
          _product_id: string
          _qty_change: number
          _ref_doc_id: string
          _ref_doc_type: string
          _type: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      next_doc_no: { Args: { _doc_type: string }; Returns: string }
      set_my_pin: { Args: { _pin: string }; Returns: undefined }
      verify_my_pin: { Args: { _pin: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "cashier" | "storekeeper" | "buyer"
      doc_status:
        | "draft"
        | "pending"
        | "approved"
        | "rejected"
        | "blocked"
        | "partial"
        | "completed"
        | "paid"
        | "void"
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
    Enums: {
      app_role: ["admin", "cashier", "storekeeper", "buyer"],
      doc_status: [
        "draft",
        "pending",
        "approved",
        "rejected",
        "blocked",
        "partial",
        "completed",
        "paid",
        "void",
      ],
    },
  },
} as const
