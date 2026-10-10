-- Only accepted friends can see one another's progress in home-screen widgets.
CREATE OR REPLACE FUNCTION public.get_friend_widget_progress(target_ids uuid[])
RETURNS TABLE (friend_id uuid, sobriety_date date)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.id, p.sobriety_date
  FROM public.profiles AS p
  WHERE p.id = ANY (target_ids)
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.friend_connections AS fc
      WHERE fc.status = 'accepted'
        AND (
          (fc.requester_id = auth.uid() AND fc.recipient_id = p.id)
          OR (fc.recipient_id = auth.uid() AND fc.requester_id = p.id)
        )
    );
$$;
REVOKE ALL ON FUNCTION public.get_friend_widget_progress(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_friend_widget_progress(uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_friend_widget_progress(uuid[]) TO authenticated;
