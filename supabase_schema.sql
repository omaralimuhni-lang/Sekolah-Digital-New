-- Supabase PostgreSQL Schema for Sekolah Digital

-- 1. Users Table (Core app users, links to auth.users if using Supabase Auth later)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(50) NOT NULL, -- admin, siswa, guru, tendik, ortu, mitra
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Siswa (Students)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    nisn VARCHAR(50) UNIQUE,
    nis VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    kelas VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Guru (Teachers)
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    nip VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tenaga Pendidik (Staff)
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    nip VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    position VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Orang Tua (Parents)
CREATE TABLE IF NOT EXISTS public.parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Mitra (Partners)
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    partner_type VARCHAR(100), -- Kantin, Koperasi, Penerbit, dll
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Absensi (Attendance)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL, -- Hadir, Sakit, Izin, Alpa
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Bank Soal & Tugas (Assignments)
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    kelas VARCHAR(50),
    subject VARCHAR(100),
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Penilaian & Raport (Grades)
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    score DECIMAL(5,2),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Keuangan & Pembayaran (Payments)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    payment_type VARCHAR(100), -- SPP, Uang Gedung, Seragam
    status VARCHAR(20) DEFAULT 'pending', -- pending, success, failed
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create default policies (Can be adjusted based on exact security needs)
CREATE POLICY "Allow read access for all authenticated users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow read access for all authenticated users" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow read access for all authenticated users" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "Allow read access for all authenticated users" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Allow read access for all authenticated users" ON public.parents FOR SELECT USING (true);
CREATE POLICY "Allow read access for all authenticated users" ON public.partners FOR SELECT USING (true);
CREATE POLICY "Allow read access for all authenticated users" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Allow read access for all authenticated users" ON public.assignments FOR SELECT USING (true);
CREATE POLICY "Allow read access for all authenticated users" ON public.grades FOR SELECT USING (true);
CREATE POLICY "Allow read access for all authenticated users" ON public.payments FOR SELECT USING (true);
