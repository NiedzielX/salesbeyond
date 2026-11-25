-- Cover both quote foreign keys. The leading event_id column also supports
-- catalog-scoped quote lookups while consumed_hold_id keeps hold cleanup cheap.
create index if not exists quotes_event_consumed_hold_idx
  on sb_hold.quotes (event_id, consumed_hold_id);
