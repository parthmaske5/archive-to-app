create type public.app_role as enum ('admin', 'student', 'teacher');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select, insert on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "Users can read their own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "Users can add student or teacher role to themselves" on public.user_roles for insert to authenticated
  with check (auth.uid() = user_id and role in ('student', 'teacher'));

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Users can read their own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create table public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  education_level text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.student_profiles to authenticated;
grant all on public.student_profiles to service_role;
alter table public.student_profiles enable row level security;
create policy "Students can read their own student profile" on public.student_profiles for select to authenticated using (auth.uid() = user_id);
create policy "Students can create their own student profile" on public.student_profiles for insert to authenticated with check (auth.uid() = user_id);
create policy "Students can update their own student profile" on public.student_profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.teacher_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  qualification text,
  subjects text[] not null default '{}',
  teaching_mode text,
  location text,
  fee_per_hour numeric,
  bio text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  tagline text,
  photo_url text,
  years_experience integer,
  levels text[] NOT NULL DEFAULT '{}',
  curricula text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  skills text[] NOT NULL DEFAULT '{}',
  qualifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  achievements jsonb NOT NULL DEFAULT '[]'::jsonb,
  availability jsonb NOT NULL DEFAULT '[]'::jsonb
);
grant select, insert, update on public.teacher_profiles to authenticated;
grant select on public.teacher_profiles to anon;
grant all on public.teacher_profiles to service_role;
alter table public.teacher_profiles enable row level security;
create policy "Teachers can read their own teacher profile" on public.teacher_profiles for select to authenticated using (auth.uid() = user_id);
create policy "Anyone can read approved complete teacher profiles" on public.teacher_profiles
  for select to anon, authenticated using (status = 'approved' and completed_at is not null);
create policy "Teachers can create their own teacher profile" on public.teacher_profiles for insert to authenticated with check (auth.uid() = user_id and status = 'pending');
create policy "Teachers can update their own teacher profile" on public.teacher_profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins can manage all teacher profiles" on public.teacher_profiles for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.guard_teacher_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'approved'
     AND NOT public.has_role(auth.uid(), 'admin') AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Only an administrator can approve a tutor listing';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status NOT IN ('pending','approved','rejected') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_teacher_status BEFORE UPDATE ON public.teacher_profiles FOR EACH ROW EXECUTE FUNCTION public.guard_teacher_status();

GRANT SELECT ON public.profiles TO anon;
CREATE POLICY "Anyone can read names of listed tutors" ON public.profiles
  FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.teacher_profiles t
    WHERE t.user_id = profiles.id AND t.status = 'approved' AND t.completed_at IS NOT NULL));

CREATE TABLE public.tutor_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_profile_id uuid NOT NULL REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
  student_user_id uuid,
  education_level text NOT NULL CHECK (char_length(education_level) BETWEEN 1 AND 60),
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 80),
  message text CHECK (message IS NULL OR char_length(message) <= 1000),
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_sender_role text NOT NULL DEFAULT 'student'
);
GRANT INSERT ON public.tutor_enquiries TO anon;
GRANT SELECT, INSERT ON public.tutor_enquiries TO authenticated;
GRANT ALL ON public.tutor_enquiries TO service_role;
ALTER TABLE public.tutor_enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can send an enquiry to a listed tutor" ON public.tutor_enquiries
  FOR INSERT TO anon, authenticated WITH CHECK (
    (student_user_id IS NULL OR student_user_id = auth.uid()) AND status = 'new'
    AND EXISTS (SELECT 1 FROM public.teacher_profiles t WHERE t.id = tutor_enquiries.teacher_profile_id
      AND t.status = 'approved' AND t.completed_at IS NOT NULL));
CREATE POLICY "Tutors read enquiries sent to them" ON public.tutor_enquiries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.teacher_profiles t WHERE t.id = teacher_profile_id AND t.user_id = auth.uid()));
CREATE POLICY "Students read their own enquiries" ON public.tutor_enquiries FOR SELECT TO authenticated USING (student_user_id = auth.uid());
CREATE POLICY "Admins read all enquiries" ON public.tutor_enquiries FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tutor photos are publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'tutor-photos');
CREATE POLICY "Users upload own tutor photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tutor-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own tutor photos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'tutor-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own tutor photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'tutor-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE OR REPLACE FUNCTION public.can_access_enquiry(_enquiry_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.tutor_enquiries e JOIN public.teacher_profiles t ON t.id = e.teacher_profile_id
    WHERE e.id = _enquiry_id AND (e.student_user_id = auth.uid() OR t.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
$$;
CREATE OR REPLACE FUNCTION public.enquiry_role(_enquiry_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN e.student_user_id = auth.uid() THEN 'student' WHEN t.user_id = auth.uid() THEN 'teacher' ELSE NULL END
  FROM public.tutor_enquiries e JOIN public.teacher_profiles t ON t.id = e.teacher_profile_id WHERE e.id = _enquiry_id
$$;

CREATE TABLE public.enquiry_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id uuid NOT NULL REFERENCES public.tutor_enquiries(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL,
  sender_role text NOT NULL,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX enquiry_messages_enquiry_idx ON public.enquiry_messages (enquiry_id, created_at);
GRANT SELECT, INSERT ON public.enquiry_messages TO authenticated;
GRANT ALL ON public.enquiry_messages TO service_role;
ALTER TABLE public.enquiry_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read conversation messages" ON public.enquiry_messages FOR SELECT TO authenticated USING (public.can_access_enquiry(enquiry_id));
CREATE POLICY "Participants send messages as themselves" ON public.enquiry_messages FOR INSERT TO authenticated
  WITH CHECK (sender_user_id = auth.uid() AND public.enquiry_role(enquiry_id) IS NOT NULL);

CREATE OR REPLACE FUNCTION public.handle_enquiry_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r text;
BEGIN
  r := public.enquiry_role(NEW.enquiry_id);
  IF r IS NULL THEN RAISE EXCEPTION 'Not part of this conversation'; END IF;
  NEW.sender_role := r;
  NEW.body := btrim(NEW.body);
  NEW.created_at := now();
  UPDATE public.tutor_enquiries SET last_message_at = NEW.created_at, last_sender_role = r,
    status = CASE WHEN r = 'teacher' THEN 'replied' ELSE 'awaiting_reply' END
   WHERE id = NEW.enquiry_id;
  RETURN NEW;
END $$;
CREATE TRIGGER enquiry_message_before_insert BEFORE INSERT ON public.enquiry_messages FOR EACH ROW EXECUTE FUNCTION public.handle_enquiry_message();

CREATE TABLE public.enquiry_reads (
  enquiry_id uuid NOT NULL REFERENCES public.tutor_enquiries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (enquiry_id, user_id)
);
GRANT SELECT, INSERT, UPDATE ON public.enquiry_reads TO authenticated;
GRANT ALL ON public.enquiry_reads TO service_role;
ALTER TABLE public.enquiry_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants see read markers in their conversations" ON public.enquiry_reads FOR SELECT TO authenticated USING (public.can_access_enquiry(enquiry_id));
CREATE POLICY "Users record their own read marker" ON public.enquiry_reads FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.enquiry_role(enquiry_id) IS NOT NULL);
CREATE POLICY "Users update their own read marker" ON public.enquiry_reads FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_enquiring_student(_student uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.tutor_enquiries e JOIN public.teacher_profiles t ON t.id = e.teacher_profile_id
    WHERE e.student_user_id = _student AND t.user_id = auth.uid())
$$;
CREATE POLICY "Tutors read names of students who contacted them" ON public.profiles FOR SELECT TO authenticated USING (public.is_enquiring_student(id));

CREATE OR REPLACE FUNCTION public.has_enquired_teacher(_teacher_profile uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.tutor_enquiries e WHERE e.teacher_profile_id = _teacher_profile AND e.student_user_id = auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r text := new.raw_user_meta_data ->> 'signup_role';
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  IF r = 'student' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'student') ON CONFLICT DO NOTHING;
    INSERT INTO public.student_profiles (user_id) VALUES (new.id) ON CONFLICT DO NOTHING;
  ELSIF r = 'teacher' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'teacher') ON CONFLICT DO NOTHING;
    INSERT INTO public.teacher_profiles (user_id) VALUES (new.id) ON CONFLICT DO NOTHING;
  END IF;
  RETURN new;
END $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

CREATE OR REPLACE FUNCTION public.teacher_listing_complete(_t public.teacher_profiles)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(btrim(_t.tagline),'') <> ''
     AND coalesce(btrim(_t.qualification),'') <> ''
     AND coalesce(array_length(_t.subjects,1),0) > 0
     AND coalesce(_t.teaching_mode,'') <> ''
     AND coalesce(_t.location,'') <> ''
     AND _t.fee_per_hour IS NOT NULL
     AND coalesce(btrim(_t.bio),'') <> ''
     AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _t.user_id AND coalesce(btrim(p.display_name),'') <> '')
$$;
CREATE OR REPLACE FUNCTION public.stamp_teacher_completed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.teacher_listing_complete(NEW) THEN
    NEW.completed_at := coalesce(OLD.completed_at, NEW.completed_at, now());
    IF TG_OP = 'INSERT' THEN NEW.completed_at := coalesce(NEW.completed_at, now()); END IF;
  ELSE
    NEW.completed_at := NULL;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER stamp_teacher_completed BEFORE INSERT OR UPDATE ON public.teacher_profiles FOR EACH ROW EXECUTE FUNCTION public.stamp_teacher_completed();

CREATE OR REPLACE FUNCTION public.touch_teacher_on_name()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.display_name IS DISTINCT FROM OLD.display_name THEN
    UPDATE public.teacher_profiles SET updated_at = now() WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER touch_teacher_on_name AFTER UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_teacher_on_name();