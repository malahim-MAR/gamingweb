-- Enable pg_cron and pg_net in Dashboard > Database > Extensions first.
-- Set Vault secrets named playroom_cron_secret and playroom_project_url using the Dashboard.
-- Never put your cron secret in source control.
select cron.schedule('playroom-daily-challenge','1 0 * * *', $$
 select net.http_post(
 url := (select decrypted_secret from vault.decrypted_secrets where name='playroom_project_url') || '/functions/v1/daily-challenge',
 headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='playroom_cron_secret')),
 body := '{}'::jsonb
 );
$$);
