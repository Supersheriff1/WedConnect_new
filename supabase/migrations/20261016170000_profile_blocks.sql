CREATE TABLE IF NOT EXISTS public.profile_blocks (
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_blocks_pkey PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT profile_blocks_not_self CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS profile_blocks_blocked_id_idx ON public.profile_blocks (blocked_id);

ALTER TABLE public.profile_blocks ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.profile_blocks FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.profile_blocks TO authenticated;

DROP POLICY IF EXISTS "Users can view blocks involving themselves" ON public.profile_blocks;
CREATE POLICY "Users can view blocks involving themselves"
  ON public.profile_blocks FOR SELECT TO authenticated
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

DROP POLICY IF EXISTS "Users can block profiles" ON public.profile_blocks;
CREATE POLICY "Users can block profiles"
  ON public.profile_blocks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = blocker_id AND blocker_id <> blocked_id);

DROP POLICY IF EXISTS "Users can unblock their own blocks" ON public.profile_blocks;
CREATE POLICY "Users can unblock their own blocks"
  ON public.profile_blocks FOR DELETE TO authenticated
  USING (auth.uid() = blocker_id);

CREATE OR REPLACE FUNCTION public.reject_blocked_profile_interaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.profile_blocks AS b
    WHERE (b.blocker_id = NEW.sender_id AND b.blocked_id = NEW.recipient_id)
       OR (b.blocker_id = NEW.recipient_id AND b.blocked_id = NEW.sender_id)
  ) THEN
    RAISE EXCEPTION USING MESSAGE = 'profile_blocked';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reject_blocked_profile_message ON public.profile_messages;
CREATE TRIGGER reject_blocked_profile_message
  BEFORE INSERT ON public.profile_messages
  FOR EACH ROW EXECUTE FUNCTION public.reject_blocked_profile_interaction();

CREATE OR REPLACE FUNCTION public.reject_blocked_profile_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.profile_blocks AS b
    WHERE (b.blocker_id = NEW.liker_id AND b.blocked_id = NEW.liked_id)
       OR (b.blocker_id = NEW.liked_id AND b.blocked_id = NEW.liker_id)
  ) THEN
    RAISE EXCEPTION USING MESSAGE = 'profile_blocked';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reject_blocked_profile_like ON public.profile_likes;
CREATE TRIGGER reject_blocked_profile_like
  BEFORE INSERT ON public.profile_likes
  FOR EACH ROW EXECUTE FUNCTION public.reject_blocked_profile_like();

REVOKE ALL ON FUNCTION public.reject_blocked_profile_interaction() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_blocked_profile_like() FROM PUBLIC;
