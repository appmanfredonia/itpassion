insert into public.passions (slug, name)
values
  ('fotografia', 'Fotografia'),
  ('viaggi', 'Viaggi'),
  ('design', 'Design'),
  ('cucina', 'Cucina'),
  ('tecnologia', 'Tecnologia'),
  ('cinema', 'Cinema'),
  ('fitness', 'Fitness'),
  ('musica', 'Musica')
on conflict (slug) do update set
  name = excluded.name;

with source_users as (
  select
    id,
    coalesce(
      nullif(left(lower(regexp_replace(coalesce(raw_user_meta_data->>'username', ''), '[^a-z0-9_.]', '', 'g')), 24), ''),
      nullif(left(lower(regexp_replace(split_part(coalesce(email, ''), '@', 1), '[^a-z0-9_.]', '', 'g')), 24), ''),
      'utente_' || substr(replace(id::text, '-', ''), 1, 8)
    ) as username_candidate,
    coalesce(
      nullif(raw_user_meta_data->>'display_name', ''),
      nullif(raw_user_meta_data->>'full_name', ''),
      nullif(split_part(coalesce(email, ''), '@', 1), ''),
      'Utente ItPassion'
    ) as display_name_candidate,
    nullif(raw_user_meta_data->>'bio', '') as bio,
    nullif(raw_user_meta_data->>'avatar_url', '') as avatar_url
  from auth.users
),
prepared_users as (
  select
    id,
    case
      when username_candidate ~ '^[a-z0-9_.]{3,24}$' then username_candidate
      else 'utente_' || substr(replace(id::text, '-', ''), 1, 8)
    end as username,
    display_name_candidate,
    bio,
    avatar_url
  from source_users
)
insert into public.users (id, username, display_name, bio, avatar_url)
select
  pu.id,
  pu.username,
  pu.display_name_candidate,
  pu.bio,
  pu.avatar_url
from prepared_users pu
on conflict (id) do update set
  username = excluded.username,
  display_name = excluded.display_name,
  bio = excluded.bio,
  avatar_url = excluded.avatar_url,
  updated_at = timezone('utc', now());

with demo_user as (
  select id
  from public.users
  order by created_at
  limit 1
),
demo_posts as (
  select
    demo_user.id as user_id,
    item.passion_slug,
    item.content_type,
    item.text_content,
    item.media_url
  from demo_user
  cross join (
    values
      ('fotografia', 'text', 'Scatto all''alba nel centro di Roma.', null),
      ('viaggi', 'image', 'Weekend in costiera: luce spettacolare.', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1'),
      ('musica', 'video', 'Jam session serale con il mio trio.', 'https://cdn.coverr.co/videos/coverr-dj-playing-music-in-club-1574/1080p.mp4')
  ) as item(passion_slug, content_type, text_content, media_url)
),
inserted_posts as (
  insert into public.posts (user_id, passion_slug, content_type, text_content)
  select
    dp.user_id,
    dp.passion_slug,
    dp.content_type,
    dp.text_content
  from demo_posts dp
  where not exists (
    select 1
    from public.posts p
    where p.user_id = dp.user_id
      and p.text_content = dp.text_content
  )
  returning id, user_id, text_content, content_type
)
insert into public.post_media (post_id, media_url, media_kind)
select
  p.id,
  dp.media_url,
  p.content_type
from public.posts p
join demo_posts dp
  on p.user_id = dp.user_id
 and p.text_content = dp.text_content
where dp.media_url is not null
  and p.content_type in ('image', 'video')
  and not exists (
    select 1
    from public.post_media pm
    where pm.post_id = p.id
      and pm.media_url = dp.media_url
  );

with first_user as (
  select id
  from public.users
  order by created_at
  limit 1
),
first_post as (
  select id
  from public.posts
  order by created_at
  limit 1
)
insert into public.likes (post_id, user_id)
select fp.id, fu.id
from first_post fp
cross join first_user fu
where not exists (
  select 1
  from public.likes l
  where l.post_id = fp.id
    and l.user_id = fu.id
);

with first_user as (
  select id
  from public.users
  order by created_at
  limit 1
),
first_post as (
  select id
  from public.posts
  order by created_at
  limit 1
)
insert into public.saved_posts (post_id, user_id)
select fp.id, fu.id
from first_post fp
cross join first_user fu
where not exists (
  select 1
  from public.saved_posts sp
  where sp.post_id = fp.id
    and sp.user_id = fu.id
);

with first_user as (
  select id
  from public.users
  order by created_at
  limit 1
),
first_post as (
  select id
  from public.posts
  order by created_at
  limit 1
)
insert into public.comments (post_id, user_id, content)
select fp.id, fu.id, 'Primo commento demo su ItPassion.'
from first_post fp
cross join first_user fu
where not exists (
  select 1
  from public.comments c
  where c.post_id = fp.id
    and c.user_id = fu.id
    and c.content = 'Primo commento demo su ItPassion.'
);

with ordered_users as (
  select id, row_number() over (order by created_at, id) as rn
  from public.users
),
follow_pair as (
  select
    follower.id as follower_id,
    followed.id as following_id
  from ordered_users followed
  join ordered_users follower
    on followed.rn = 1
   and follower.rn = 2
)
insert into public.follows (follower_id, following_id)
select
  fp.follower_id,
  fp.following_id
from follow_pair fp
where fp.follower_id <> fp.following_id
  and not exists (
    select 1
    from public.follows f
    where f.follower_id = fp.follower_id
      and f.following_id = fp.following_id
  );
