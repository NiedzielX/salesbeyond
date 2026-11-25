-- Support the composite seats -> holds foreign key and release/expiry cleanup.
create index if not exists seats_event_active_hold_idx
  on sb_hold.seats (event_id, active_hold);
