-- HomeScope — household v2 grants (Stage A: family invites + active household)
--
-- EXECUTE grants for the five new functions from 0006. bootstrap_household()
-- already has its execute grant from 0002 (create or replace does not touch
-- existing grants on a function). No table grants here: user_preferences
-- stays fully ungranted (0005/0007's comments explain why), and
-- household_invites' existing table grants (0004) are unchanged — insert is
-- no longer backed by a policy (0007), so any direct client insert attempt
-- is rejected by RLS even though the table grant remains.

grant execute on function public.create_household(text) to authenticated;
grant execute on function public.generate_family_invite() to authenticated;
grant execute on function public.redeem_family_invite(text) to authenticated;
grant execute on function public.revoke_family_invite(uuid) to authenticated;
grant execute on function public.list_household_members() to authenticated;
