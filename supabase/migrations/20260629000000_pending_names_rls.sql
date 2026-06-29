-- Select own rows
CREATE POLICY "Owners can view their own pending names"
  ON public.pending_horse_names
  FOR SELECT
  TO authenticated
  USING (owner_id = (
    SELECT id FROM public.owners WHERE auth_user_id = auth.uid()
  ));

-- Insert own rows
CREATE POLICY "Owners can insert their own pending names"
  ON public.pending_horse_names
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (
    SELECT id FROM public.owners WHERE auth_user_id = auth.uid()
  ));

-- Update own rows (needed for drag-to-reorder)
CREATE POLICY "Owners can update their own pending names"
  ON public.pending_horse_names
  FOR UPDATE
  TO authenticated
  USING (owner_id = (
    SELECT id FROM public.owners WHERE auth_user_id = auth.uid()
  ));