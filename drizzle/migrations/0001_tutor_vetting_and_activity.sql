ALTER TABLE public.teacher_profiles
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz,
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz,
  ADD COLUMN IF NOT EXISTS reactivated_at timestamptz,
  ADD COLUMN IF NOT EXISTS paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_checkin_at timestamptz;

ALTER TABLE public.tutor_enquiries ADD COLUMN IF NOT EXISTS tutor_replied_at timestamptz;
UPDATE public.tutor_enquiries e SET tutor_replied_at = m.first_at
  FROM (SELECT enquiry_id, min(created_at) first_at FROM public.enquiry_messages WHERE sender_role = 'teacher' GROUP BY enquiry_id) m
 WHERE m.enquiry_id = e.id AND e.tutor_replied_at IS NULL;

-- Proof of qualification documents
CREATE TABLE public.teacher_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  teacher_profile_id uuid NOT NULL REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('certificate','id','other')),
  file_path text NOT NULL,
  file_name text NOT NULL CHECK (char_length(file_name) BETWEEN 1 AND 200),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.teacher_documents TO authenticated;
GRANT ALL ON public.teacher_documents TO service_role;
ALTER TABLE public.teacher_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tutors read own documents" ON public.teacher_documents FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Tutors add own documents" ON public.teacher_documents FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.teacher_profiles t WHERE t.id = teacher_profile_id AND t.user_id = auth.uid())
    AND (storage.foldername(file_path))[1] = auth.uid()::text);
CREATE POLICY "Tutors delete own documents" ON public.teacher_documents FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins read all documents" ON public.teacher_documents FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tutors read own documents files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'tutor-documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Tutors upload own documents files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tutor-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Tutors delete own documents files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'tutor-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Approval needs proof
CREATE OR REPLACE FUNCTION public.guard_teacher_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'approved'
     AND NOT public.has_role(auth.uid(), 'admin') AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Only an administrator can approve a tutor listing';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'approved'
     AND NOT EXISTS (SELECT 1 FROM public.teacher_documents d WHERE d.teacher_profile_id = NEW.id AND d.kind IN ('certificate','id')) THEN
    RAISE EXCEPTION 'At least one proof of qualification (certificate or ID) is required before approval';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status NOT IN ('pending','approved','rejected') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  RETURN NEW;
END $$;

-- Listed = approved, complete, not hidden, not paused
CREATE OR REPLACE FUNCTION public.teacher_is_listed(_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.teacher_profiles t WHERE t.id = _id AND t.status = 'approved'
    AND t.completed_at IS NOT NULL AND t.hidden_at IS NULL AND t.paused_at IS NULL)
$$;

DROP POLICY "Anyone can read approved complete teacher profiles" ON public.teacher_profiles;
CREATE POLICY "Anyone can read listed teacher profiles" ON public.teacher_profiles FOR SELECT TO anon, authenticated
  USING (status = 'approved' AND completed_at IS NOT NULL AND hidden_at IS NULL AND paused_at IS NULL);
DROP POLICY "Anyone can read names of listed tutors" ON public.profiles;
CREATE POLICY "Anyone can read names of listed tutors" ON public.profiles FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.teacher_profiles t WHERE t.user_id = profiles.id AND public.teacher_is_listed(t.id)));
DROP POLICY "Anyone can send an enquiry to a listed tutor" ON public.tutor_enquiries;
CREATE POLICY "Anyone can send an enquiry to a listed tutor" ON public.tutor_enquiries FOR INSERT TO anon, authenticated
  WITH CHECK ((student_user_id IS NULL OR student_user_id = auth.uid()) AND status = 'new' AND public.teacher_is_listed(teacher_profile_id));

-- Reply tracking + activity
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
    status = CASE WHEN r = 'teacher' THEN 'replied' ELSE 'awaiting_reply' END,
    tutor_replied_at = CASE WHEN r = 'teacher' THEN coalesce(tutor_replied_at, NEW.created_at) ELSE tutor_replied_at END
   WHERE id = NEW.enquiry_id;
  IF r = 'teacher' THEN
    UPDATE public.teacher_profiles t SET last_active_at = now()
      FROM public.tutor_enquiries e WHERE e.id = NEW.enquiry_id AND t.id = e.teacher_profile_id;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.teacher_heartbeat()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.teacher_profiles SET last_active_at = now()
   WHERE user_id = auth.uid() AND (last_active_at IS NULL OR last_active_at < now() - interval '10 minutes');
$$;

CREATE OR REPLACE FUNCTION public.reactivate_my_listing()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.teacher_profiles SET hidden_at = NULL, reactivated_at = now(), last_active_at = now()
   WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.tutor_checkin(_available boolean)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.teacher_profiles SET last_checkin_at = now(), last_active_at = now(),
    paused_at = CASE WHEN _available THEN NULL ELSE now() END
   WHERE user_id = auth.uid();
$$;

-- Hide tutors whose 3 most recent enquiries older than 72h (since last reactivation) all went unanswered
CREATE OR REPLACE FUNCTION public.hide_unresponsive_tutors()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  UPDATE public.teacher_profiles t SET hidden_at = now()
   WHERE t.hidden_at IS NULL AND t.status = 'approved'
     AND (SELECT count(*) = 3 AND bool_and(x.tutor_replied_at IS NULL)
            FROM (SELECT e.tutor_replied_at FROM public.tutor_enquiries e
                   WHERE e.teacher_profile_id = t.id AND e.created_at < now() - interval '72 hours'
                     AND e.created_at > coalesce(t.reactivated_at, '-infinity'::timestamptz)
                   ORDER BY e.created_at DESC LIMIT 3) x);
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.hide_unresponsive_tutors() FROM PUBLIC, anon, authenticated;

-- Public activity stats for listed tutors
CREATE OR REPLACE FUNCTION public.tutor_activity(_ids uuid[])
RETURNS TABLE (teacher_profile_id uuid, last_active_at timestamptz, avg_reply_minutes integer, replies integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, t.last_active_at,
    (SELECT round(avg(extract(epoch FROM e.tutor_replied_at - e.created_at) / 60))::int FROM public.tutor_enquiries e
      WHERE e.teacher_profile_id = t.id AND e.tutor_replied_at IS NOT NULL AND e.created_at > now() - interval '90 days'),
    (SELECT count(*)::int FROM public.tutor_enquiries e
      WHERE e.teacher_profile_id = t.id AND e.tutor_replied_at IS NOT NULL AND e.created_at > now() - interval '90 days')
  FROM public.teacher_profiles t
  WHERE t.id = ANY(_ids) AND public.teacher_is_listed(t.id)
$$;
GRANT EXECUTE ON FUNCTION public.tutor_activity(uuid[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_heartbeat(), public.reactivate_my_listing(), public.tutor_checkin(boolean) TO authenticated;