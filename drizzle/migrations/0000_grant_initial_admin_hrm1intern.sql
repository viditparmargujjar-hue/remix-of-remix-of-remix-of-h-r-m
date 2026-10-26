INSERT INTO public.user_roles(user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE lower(email) = 'hrm1intern@gmail.com'
ON CONFLICT DO NOTHING;
UPDATE public.access_requests SET status = 'approved', decided_at = now()
WHERE user_id IN (SELECT id FROM auth.users WHERE lower(email) = 'hrm1intern@gmail.com') AND kind = 'admin';