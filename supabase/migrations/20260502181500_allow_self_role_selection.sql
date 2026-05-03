
-- Remove the restriction that prevents users from changing their own account_type
DROP TRIGGER IF EXISTS profiles_block_account_type_self_change ON public.profiles;
DROP FUNCTION IF EXISTS public.prevent_account_type_self_change();

-- Update handle_new_user to pick up account_type from raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, account_type)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
    COALESCE((NEW.raw_user_meta_data->>'account_type')::public.account_type, 'farmer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
