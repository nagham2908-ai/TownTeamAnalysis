// Hand-written to match supabase/migrations/0001_init.sql.
// Row shapes MUST be `type`, not `interface`, and Insert/Update need the
// `& Record<string, unknown>` index signature, or supabase-js 2.116's
// postgrest-js type inference collapses every query to `never`.
export type ResponseRow = {
  token: string;
  data: Record<string, unknown>;
  submitted: boolean;
  submission_ref: string | null;
  submitted_at: string | null;
  pdf_path: string | null;
  docx_path: string | null;
  email_sent: boolean;
  email_error: string | null;
  created_at: string;
  updated_at: string;
};

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row> & Record<string, unknown>;
  Update: Partial<Row> & Record<string, unknown>;
  Relationships: [];
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      responses: Table<ResponseRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
