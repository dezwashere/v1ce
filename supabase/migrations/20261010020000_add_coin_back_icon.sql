ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS coin_back_icon text NOT NULL DEFAULT 'none'
  CHECK (coin_back_icon IN ('none','mountain','palm','smiley','clover','butterfly','wave'));
