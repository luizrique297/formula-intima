-- A policy original de update em profiles exigia role = 'cliente' no
-- resultado do update, para impedir que um cliente se autopromovesse a
-- admin. Efeito colateral: isso também bloqueava contas admin de editarem
-- o próprio perfil (nome/telefone), já que role continua 'admin' após o
-- update. Substituído por um trigger que trava só o campo role, não o
-- update inteiro.
drop policy "profiles_update_own" on public.profiles;

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

create function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    new.role = old.role;
  end if;
  return new;
end;
$$;

create trigger on_profile_update_guard_role
  before update on public.profiles
  for each row execute procedure public.prevent_role_self_escalation();
