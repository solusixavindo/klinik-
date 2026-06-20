-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view bookings for their clinic" ON public.bookings;
DROP POLICY IF EXISTS "Users can insert bookings for their clinic" ON public.bookings;
DROP POLICY IF EXISTS "Users can update bookings for their clinic" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete bookings for their clinic" ON public.bookings;

-- Create policies that work with both authenticated users and service role
CREATE POLICY "Users can view bookings for their clinic" ON public.bookings
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
    ) OR auth.role() = 'service_role'
  );

CREATE POLICY "Users can insert bookings for their clinic" ON public.bookings
  FOR INSERT WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
    ) OR auth.role() = 'service_role'
  );

CREATE POLICY "Users can update bookings for their clinic" ON public.bookings
  FOR UPDATE USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
    ) OR auth.role() = 'service_role'
  );

CREATE POLICY "Users can delete bookings for their clinic" ON public.bookings
  FOR DELETE USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
    ) OR auth.role() = 'service_role'
  );
