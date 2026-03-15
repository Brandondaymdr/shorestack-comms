-- ============================================
-- Shorestack Comms — Seed Data
-- ============================================
-- Run after creating your first user in Supabase Auth

-- Workspaces
insert into comms_workspaces (id, name, slug, entity_tag) values
  ('a1000000-0000-0000-0000-000000000001', 'Days Management LLC', 'days-management', 'Days Mgmt'),
  ('a1000000-0000-0000-0000-000000000002', 'Crowded Barrel Whiskey Co.', 'crowded-barrel', 'Crowded Barrel'),
  ('a1000000-0000-0000-0000-000000000003', 'Cheersworthy', 'cheersworthy', 'Cheersworthy');

-- Default channels per workspace
-- Days Management
insert into comms_channels (workspace_id, name, description) values
  ('a1000000-0000-0000-0000-000000000001', 'general', 'Company-wide announcements and conversations'),
  ('a1000000-0000-0000-0000-000000000001', 'accounting', 'Finance and bookkeeping discussions'),
  ('a1000000-0000-0000-0000-000000000001', 'operations', 'Day-to-day ops coordination');

-- Crowded Barrel
insert into comms_channels (workspace_id, name, description) values
  ('a1000000-0000-0000-0000-000000000002', 'general', 'All things Crowded Barrel'),
  ('a1000000-0000-0000-0000-000000000002', 'distillery-ops', 'Production schedules, mash bills, barrel tracking'),
  ('a1000000-0000-0000-0000-000000000002', 'tasting-room', 'Tasting room events and walk-in traffic'),
  ('a1000000-0000-0000-0000-000000000002', 'compliance', 'TTB filings, DSP-TX-20093 compliance');

-- Cheersworthy
insert into comms_channels (workspace_id, name, description) values
  ('a1000000-0000-0000-0000-000000000003', 'general', 'All things Cheersworthy'),
  ('a1000000-0000-0000-0000-000000000003', 'ecommerce', 'Shopify store, orders, fulfillment'),
  ('a1000000-0000-0000-0000-000000000003', 'marketing', 'Campaigns, social media, brand content');

-- ============================================
-- After creating your user in Supabase Auth,
-- run this to add yourself as admin:
-- ============================================
-- Replace YOUR_USER_ID with your actual Supabase Auth user ID
--
-- insert into comms_user_profiles (id, display_name) values
--   ('YOUR_USER_ID', 'Brandon');
--
-- insert into comms_workspace_members (workspace_id, user_id, role) values
--   ('a1000000-0000-0000-0000-000000000001', 'YOUR_USER_ID', 'admin'),
--   ('a1000000-0000-0000-0000-000000000002', 'YOUR_USER_ID', 'admin'),
--   ('a1000000-0000-0000-0000-000000000003', 'YOUR_USER_ID', 'admin');
