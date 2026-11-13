-- PENTING: Jalankan perintah SQL ini di SQL Editor Supabase Anda untuk mengaktifkan fitur Realtime.
-- Tanpa ini, sinkronisasi antar perangkat tidak akan berjalan secara instan (realtime).

-- 1. Tambahkan tabel app_state ke publikasi realtime Supabase
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE public.app_state;

-- Atau jika Anda ingin mengaktifkan realtime untuk seluruh tabel sekaligus (opsional):
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.users, public.students, public.teachers, public.staff, public.parents, public.partners, public.attendance, public.schedules, public.assignments, public.assignment_submissions, public.grades, public.finance_transactions, public.digital_wallets, public.wallet_transactions, public.products, public.orders, public.announcements, public.document_archives, public.inventory, public.polls, public.calendar_notes;
