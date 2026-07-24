alter table conversations add column if not exists appreciate_adjustment bigint not null default 0;
alter table conversations add column if not exists insightful_adjustment bigint not null default 0;
alter table conversations add column if not exists powerful_adjustment bigint not null default 0;

alter table papers add column if not exists appreciate_adjustment bigint not null default 0;
alter table papers add column if not exists insightful_adjustment bigint not null default 0;
alter table papers add column if not exists powerful_adjustment bigint not null default 0;

comment on column conversations.appreciate_adjustment is
'Host-controlled adjustment applied only to the public Appreciate reaction count.';
comment on column conversations.insightful_adjustment is
'Host-controlled adjustment applied only to the public Insightful reaction count.';
comment on column conversations.powerful_adjustment is
'Host-controlled adjustment applied only to the public Powerful reaction count.';
