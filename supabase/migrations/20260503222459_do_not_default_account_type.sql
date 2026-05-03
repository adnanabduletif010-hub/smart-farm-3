-- Update handle_new_user to NOT default account_type to 'farmer'
-- This ensures that users signing up via phone or Google get a NULL account_type,
-- which in turn triggers the AccountTypeGate dialog requiring them to select one.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, account_type)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
    (NEW.raw_user_meta_data->>'account_type')::public.account_type
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
