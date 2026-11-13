-- =====================================================================================
-- FULL COMPREHENSIVE SCHOOL DIGITAL DATABASE SCHEMA (POSTGRESQL)
-- =====================================================================================

-- 1. USERS & AUTHENTICATION
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(50) NOT NULL, -- admin, siswa, guru, tendik, ortu, mitra
    username VARCHAR(100) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash TEXT,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. SCHOOL SETTINGS
CREATE TABLE IF NOT EXISTS public.school_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    academic_year VARCHAR(50),
    semester VARCHAR(20),
    meta_settings JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. MASTER DATA: SISWA (STUDENTS)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    nisn VARCHAR(50) UNIQUE,
    nis VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    kelas VARCHAR(50) NOT NULL,
    gender VARCHAR(20),
    birth_place VARCHAR(100),
    birth_date DATE,
    address TEXT,
    parent_phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Aktif',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. MASTER DATA: GURU (TEACHERS)
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    nip VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    gender VARCHAR(20),
    subject_specialty VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. MASTER DATA: TENAGA KEPENDIDIKAN (STAFF)
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    nip VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    position VARCHAR(100),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. MASTER DATA: ORANG TUA (PARENTS)
CREATE TABLE IF NOT EXISTS public.parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    job VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. MASTER DATA: MITRA (PARTNERS - KANTIN/TOKO)
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    partner_type VARCHAR(100), -- Kantin, Koperasi, Penerbit, dll
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. ABSENSI (ATTENDANCE)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Bisa siswa, guru, atau tendik
    role VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    time_in TIME,
    time_out TIME,
    status VARCHAR(50) NOT NULL, -- Hadir, Sakit, Izin, Alpa
    location TEXT,
    photo_proof TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. JADWAL PELAJARAN (SCHEDULES)
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kelas VARCHAR(50) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. PEMBELAJARAN (PR & TUGAS)
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    kelas VARCHAR(50),
    subject VARCHAR(100),
    assignment_type VARCHAR(50), -- PR, Tugas, Ujian
    due_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. PENGUMPULAN TUGAS (SUBMISSIONS)
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    submission_text TEXT,
    attachment_url TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    score DECIMAL(5,2),
    teacher_feedback TEXT,
    status VARCHAR(50) DEFAULT 'Submitted'
);

-- 12. PENILAIAN RAPORT (GRADES)
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    academic_year VARCHAR(50) NOT NULL,
    knowledge_score DECIMAL(5,2),
    skill_score DECIMAL(5,2),
    attitude_score VARCHAR(5), -- A, B, C, D
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. KEUANGAN & PEMBAYARAN SPP (FINANCE)
CREATE TABLE IF NOT EXISTS public.finance_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_type VARCHAR(50) NOT NULL, -- Pemasukan, Pengeluaran, Pembayaran Siswa
    category VARCHAR(100),
    amount DECIMAL(15,2) NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE, -- Only if related to student
    description TEXT,
    transaction_date DATE NOT NULL,
    payment_method VARCHAR(50),
    recorded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. DIGITAL WALLET (E-MONEY KANTIN/KOPERASI)
CREATE TABLE IF NOT EXISTS public.digital_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    balance DECIMAL(15,2) DEFAULT 0.00,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES public.digital_wallets(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL, -- TopUp, Payment
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. KANTIN & KOPERASI TOKO (PRODUCTS & ORDERS)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
    total_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Processing, Ready, Completed, Canceled
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. PENGUMUMAN (ANNOUNCEMENTS)
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_role VARCHAR(50), -- All, Siswa, Guru, dll
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. ARSIP SURAT (DOCUMENT ARCHIVES)
CREATE TABLE IF NOT EXISTS public.document_archives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(100), -- Surat Masuk, Surat Keluar, SK
    document_number VARCHAR(100),
    file_url TEXT,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. SARANA PRASARANA (FACILITIES INVENTORY)
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    quantity INT DEFAULT 0,
    condition VARCHAR(50), -- Baik, Rusak Ringan, Rusak Berat
    room_location VARCHAR(100),
    last_checked DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. SURVEI & POLING (POLLS)
CREATE TABLE IF NOT EXISTS public.polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_role VARCHAR(50),
    end_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20. CATATAN KALENDER (CALENDAR NOTES)
CREATE TABLE IF NOT EXISTS public.calendar_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_date DATE NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) FOR ALL TABLES
-- =====================================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_notes ENABLE ROW LEVEL SECURITY;

-- DEFAULT POLICIES (Can be modified based on specific security requirements)
CREATE POLICY "Allow read access for all" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.school_settings FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.parents FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.partners FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.schedules FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.assignments FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.assignment_submissions FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.grades FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.finance_transactions FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.digital_wallets FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.wallet_transactions FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.document_archives FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.polls FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.calendar_notes FOR SELECT USING (true);
