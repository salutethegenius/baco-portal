-- BACO Database Seed Data
-- Export Date: January 2026
-- Use this file to seed your local PostgreSQL database

-- First, ensure the tables exist by running: npm run db:push

-- =====================================
-- USERS TABLE
-- =====================================
-- Note: Password hashes are scrypt format - you may want to reset these locally
INSERT INTO users (id, email, password, first_name, last_name, profile_image_url, phone, address, membership_type, membership_status, join_date, next_payment_date, annual_fee, is_admin, stripe_customer_id, stripe_subscription_id, created_at, updated_at, position, company, business_address, home_address, date_of_birth, place_of_birth, nationality, bahamas_resident, years_in_bahamas, qualification, institution, graduation_year, current_employer, years_experience, is_existing_member, membership_number)
VALUES
('9ecab156-ee27-485d-9edc-eed217bb803d', 'admin@baco.com', 'bc4400d1702c5bf11e6581a0a11720358c411991b11399f478c3098e91c26a40b8d8a477325709bdca830d9f2265bba03e741c2fa05dcea895995d88d0656b0f.8c548777ed96041a7312aca4b744bc30', 'Admin', 'User', NULL, NULL, NULL, 'professional', 'pending', '2025-08-11 13:52:41.232179', NULL, 350.00, true, NULL, NULL, '2025-08-11 13:52:41.232179', '2025-08-11 13:52:41.232179', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL),
('1abf3812-850c-498d-9c06-3283d3d0b9a2', 'nyrandra@hotmail.com', 'a10d8d2600253058c52c2a81d0df7e5acda763c26947bcadaa2b31be3aa13f66cfd73d3ca6ac1f68c9ac495170b8f662a6ad2014d1d5c2a3c7cd2dbbb4d7fd95.6794f116126bcc87257c57d7dc1f587b', 'Nyrandra', 'Romer', NULL, NULL, NULL, 'professional', 'pending', '2025-09-26 16:59:01.312931', NULL, 350.00, false, NULL, NULL, '2025-09-26 16:59:01.312931', '2025-09-26 16:59:01.312931', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL),
('31a112c5-7c55-4842-96a4-66a395a85903', 'bacobahamas@gmail.com', 'a128bde095da4cbb6872f58b3e9208b8507f08fea936854da2a7808c669af25710a83550a714303dc63b4889d1416e3a0d1602771b55f853c2bf1754ea970e90.bcd887ca6eac903adfb3c721940c8c94', 'Marquita', 'Cooper', NULL, NULL, NULL, 'professional', 'pending', '2025-10-29 15:13:35.890049', NULL, 350.00, true, NULL, NULL, '2025-10-29 15:13:35.890049', '2025-10-29 15:13:56.415', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL),
('348b6910-73d2-467d-a45c-76e5fdae2837', 'Kavaughnya.Cunningham@capitalunionbank.com', '2b411daeab38d99322ccdb9da6f3d1a2a4b116b1f96a57b3bd5080f60d73dd1592d472cd4b5f34f5edf99f98499b274a1838336a20ff87e322f3605f6f4f6b7a.a66e1560e84a9b4285bd52b383e35fde', 'Kavaughnya', 'Cunningham', NULL, NULL, NULL, 'professional', 'pending', '2025-11-03 16:15:21.620399', NULL, 350.00, false, NULL, NULL, '2025-11-03 16:15:21.620399', '2025-11-03 16:15:21.620399', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL),
('c05ca913-018e-4cf5-87e1-e5b1a5a6a3e9', 'anquiel.hanna@gmail.com', '0b91caf28458f99382cd2f681f20caf8d0e19b96e9ac67be7d77ef42a53cefaab4281666a1f3a1c9c51a37b61ecefb2d5cadcbd4a7a6c543950c442f27ff4c20.8a91e0e0feb52ad8fe0ed434b26fe092', 'Anquiel', 'Hanna', NULL, NULL, NULL, 'professional', 'pending', '2025-11-07 15:04:54.526806', NULL, 350.00, false, NULL, NULL, '2025-11-07 15:04:54.526806', '2025-11-07 15:04:54.526806', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL)
ON CONFLICT (id) DO NOTHING;

-- =====================================
-- EVENTS TABLE
-- =====================================
INSERT INTO events (id, title, description, start_date, end_date, location, price, max_attendees, current_attendees, status, created_by, created_at, updated_at, slug, is_public, member_price, non_member_price, registration_closed)
VALUES
('76d5100c-826a-4ebd-8324-0ad60bad2e4b', 'BACO Annual Convention 2025', 'Annual convention for all BACO members & non members.', '2025-11-13 13:00:00', '2025-11-14 22:00:00', 'BAHAMA CONVENTION CENTER', 500.00, 500, 0, 'upcoming', '9ecab156-ee27-485d-9edc-eed217bb803d', '2025-08-12 19:00:29.506406', '2025-08-12 21:06:31.467', 'baco-annual-meeting-2025', true, NULL, NULL, false),
('baco-conference-2025', 'BACO Conference 2025 – Celebrating 25 Years of Compliance', 'Rooted in Integrity, Growing with Purpose', '2025-11-13 18:00:00', '2025-11-15 03:00:00', 'Bahamar Convention Center, Nassau, Bahamas', 500.00, 500, 184, 'upcoming', '9ecab156-ee27-485d-9edc-eed217bb803d', '2025-08-13 17:32:29.709049', '2025-11-10 12:53:06.468', 'baco-conference-2025', true, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;

-- =====================================
-- EVENT REGISTRATIONS (Sample - First 50 registrations)
-- =====================================
-- Note: Full export would include all 184 registrations
-- These are real registrations from the BACO Conference 2025

INSERT INTO event_registrations (id, event_id, user_id, registration_date, payment_status, payment_amount, stripe_payment_intent_id, created_at, first_name, last_name, email, position, phone_number, notes, registration_type, payment_method, company_name, membership_type, is_paid, payment_method_tracking, cros, admin_notes)
VALUES
('e17aad77-0200-49f7-a173-c37e975d0240', 'baco-conference-2025', NULL, '2025-08-14 12:09:32.245713', 'pending', 650.00, NULL, '2025-08-14 12:09:32.245713', 'Natasha', 'M Dean', 'ndean@privatetrustco.com', 'Head of Risk & Compliance , MLRO', '242-397-8019', NULL, 'member_two_day', 'bank_transfer', NULL, NULL, false, NULL, NULL, NULL),
('7b9e1e0d-4df6-457f-bf14-c8f2c54981f1', 'baco-conference-2025', NULL, '2025-08-14 12:29:05.363091', 'pending', 650.00, NULL, '2025-08-14 12:29:05.363091', 'Marquita', 'Cooper', 'marquitacooper07@gmail.com', NULL, '533-4241', NULL, 'member_two_day', 'bank_transfer', NULL, NULL, false, NULL, NULL, NULL),
('1f7ec04d-6099-4097-9868-f142d36e6ae2', 'baco-conference-2025', NULL, '2025-08-14 12:42:28.842473', 'pending', 650.00, NULL, '2025-08-14 12:42:28.842473', 'Debra', 'Neymour', 'dneymour@outlook.com', 'CCO', '2423768055', NULL, 'member_two_day', 'paylanes', NULL, NULL, false, NULL, NULL, NULL),
('fa0088bf-9bf5-4a4c-8c70-5ebfd7277e4d', 'baco-conference-2025', NULL, '2025-08-14 13:08:52.502178', 'pending', 650.00, NULL, '2025-08-14 13:08:52.502178', 'SALLY', 'PATTON', 's.patton@dartley.com.bs', 'Compliance Officer/MLRO', '2424298131', '2 day Early Bird Rate Member', 'member_two_day', 'bank_transfer', NULL, NULL, false, NULL, NULL, NULL),
('09d7dff6-ad9a-4bbd-ae5c-c1ecea2a154d', 'baco-conference-2025', NULL, '2025-08-14 13:26:38.533305', 'pending', 650.00, NULL, '2025-08-14 13:26:38.533305', 'Rosemary', 'Barrett', 'rbpraise@hotmail.com', 'Compliance', '12424679236', 'Early bird.', 'member_two_day', 'paylanes', NULL, NULL, false, NULL, NULL, NULL),
('81d77b45-da30-4664-8669-05f30e6f1b64', 'baco-conference-2025', NULL, '2025-08-26 12:59:15.662902', 'pending', 650.00, NULL, '2025-08-26 12:59:15.662902', 'Calvin', 'E Rolle', 'cer@lighthouse-am.com', 'Compliance Officer/MLRO', '2424250878', NULL, 'member_two_day', 'bank_transfer', NULL, NULL, false, NULL, NULL, NULL),
('264c3c5e-b773-4080-8aef-4cb19fb8837f', 'baco-conference-2025', NULL, '2025-09-02 17:43:45.152716', 'pending', 650.00, NULL, '2025-09-02 17:43:45.152716', 'Mario', 'Smith', 'mario.smith@rbc.com', 'Chief Compliance Officer', '603-3747', NULL, 'member_two_day', 'paylanes', NULL, NULL, false, NULL, NULL, NULL),
('5fafa9b3-81aa-430f-91ef-fada9af1eaca', 'baco-conference-2025', NULL, '2025-09-04 01:46:49.559589', 'pending', 650.00, NULL, '2025-09-04 01:46:49.559589', 'Venetia', 'MAURA', 'v.maura@lombardodier.com', 'Compliance Officer &.MLRO', '2425253832', NULL, 'member_two_day', 'bank_transfer', NULL, NULL, false, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- =====================================
-- Note: documents, messages, and payments tables are currently empty
-- =====================================

-- To reset passwords for local testing, you can update users:
-- UPDATE users SET password = '<new_scrypt_hash>' WHERE email = 'admin@baco.com';
-- Or implement a password reset endpoint in your local development
