// Application projection of the four approved tables/RPCs. No remote introspection.
// Direct table writes are deliberately unavailable to the application DAL.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
type Stamped = { id: string; created_at: string; updated_at: string };
export type WorkspaceRow = Stamped & { owner_user_id: string; name: string; status: "active" | "deleting" | "deleted"; revision: number; bootstrap_key: string; request_hash: string };
export type MembershipRow = Stamped & { workspace_id: string; user_id: string; role: "owner" | "member"; status: "active" | "revoked" };
export type BrandRow = Stamped & { workspace_id: string; name: string; website_url: string | null; current_revision_id: string | null; archived_at: string | null; revision: number };
export type BrandRevisionRow = Stamped & { workspace_id: string; brand_id: string; revision_number: number; profile_document: Json; approval_status: "draft" | "approved" | "rejected"; approved_by: string | null; approved_at: string | null; created_by: string };
type ReadTable<Row> = { Row: Row; Insert: never; Update: never; Relationships: [] };
export type Database = { public: {
  Tables: { workspaces: ReadTable<WorkspaceRow>; memberships: ReadTable<MembershipRow>; brands: ReadTable<BrandRow>; brand_revisions: ReadTable<BrandRevisionRow> };
  Views: { [_ in never]: never };
  Functions: {
    bootstrap_workspace: { Args: { p_name: string; p_bootstrap_key: string }; Returns: string };
    create_brand: { Args: { p_workspace_id: string; p_name: string; p_website_url?: string | null }; Returns: string };
    save_brand_profile: { Args: { p_brand_id: string; p_expected_revision: number; p_profile_document: Json }; Returns: string };
    approve_brand_profile: { Args: { p_brand_id: string; p_revision_id: string; p_expected_revision: number }; Returns: string };
  };
  Enums: { [_ in never]: never }; CompositeTypes: { [_ in never]: never };
} };
