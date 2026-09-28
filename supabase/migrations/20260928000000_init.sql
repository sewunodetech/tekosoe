-- Tekosoe — metadata off-chain. Uang dan aturan tetap on-chain; tabel ini TIDAK PERNAH menyimpan saldo.
-- Sumber: docs/03-spesifikasi-teknis.md › Database off-chain (Supabase).
-- Semua akses lewat apps/api dengan service role. RLS aktif tanpa policy = role anon/authenticated ditolak.
-- group_id / spend_id: uint256 on-chain disimpan sebagai numeric(78,0). Alamat: lowercase hex.

create domain eth_address as text check (value ~ '^0x[0-9a-f]{40}$');
create domain bytes32_hex as text check (value ~ '^0x[0-9a-f]{64}$');

-- P0 · Home, Invite, Trip members
create table profiles (
  address       eth_address primary key,
  display_name  text not null check (char_length(display_name) between 1 and 40),
  city          text,
  country_code  char(2) not null,
  avatar_color  text,
  created_at    timestamptz not null default now()
);

-- P0 · Home, Trip, Invite
create table group_meta (
  group_id          numeric(78, 0) primary key,
  name              text not null,
  invite_code_hash  bytes32_hex not null,
  created_by        eth_address not null,
  created_at        timestamptz not null default now()
);

-- P0 · Activity, Payment details, Approval. note_hash harus = noteHash on-chain.
create table spend_meta (
  group_id      numeric(78, 0) not null,
  note_hash     bytes32_hex not null,
  spend_id      numeric(78, 0), -- diisi setelah Envio mengindeks SpendRequested/SpendExecuted
  title         text not null,
  category      text not null default 'other',
  note          text not null default '',
  receipt_path  text,
  created_at    timestamptz not null default now(),
  primary key (group_id, note_hash)
);
create index spend_meta_spend_idx on spend_meta (group_id, spend_id);

-- P1 · Waiting (Seen), Declined (catatan penolak)
create table spend_reviews (
  group_id       numeric(78, 0) not null,
  spend_id       numeric(78, 0) not null,
  member         eth_address not null,
  seen_at        timestamptz,
  decision_note  text,
  primary key (group_id, spend_id, member)
);

-- P1 · Nudge, pengingat settle
create table push_subs (
  address          eth_address not null,
  expo_push_token  text not null,
  platform         text not null check (platform in ('ios', 'android')),
  created_at       timestamptz not null default now(),
  primary key (address, expo_push_token)
);

-- P0 · Membuka struk (kunci grup AES-256 dibungkus X25519 per anggota)
create table group_keys (
  group_id     numeric(78, 0) not null,
  member       eth_address not null,
  wrapped_key  text not null,
  key_version  int not null default 1,
  primary key (group_id, member)
);

-- P0 · Add receipt, tanda struk di Activity. Isi file hanya ciphertext.
create table receipts (
  group_id      numeric(78, 0) not null,
  spend_id      numeric(78, 0) not null,
  n             int not null,
  storage_path  text not null, -- {group_id}/{spend_id}/{n}.bin di bucket receipts
  receipt_hash  bytes32_hex not null, -- keccak256(ciphertext) = receiptHash on-chain
  mime          text not null,
  attached_by   eth_address not null,
  created_at    timestamptz not null default now(),
  primary key (group_id, spend_id, n)
);

-- P0 · Trip invoice, See your invoice
create table invoices (
  group_id      numeric(78, 0) not null,
  member        eth_address not null,
  number        text not null unique, -- INV-{trip}-{urutan}
  status        text not null check (status in ('paid', 'refunded', 'due')),
  invoice_hash  bytes32_hex not null,
  issued_at     timestamptz not null default now(),
  primary key (group_id, member)
);

alter table profiles      enable row level security;
alter table group_meta    enable row level security;
alter table spend_meta    enable row level security;
alter table spend_reviews enable row level security;
alter table push_subs     enable row level security;
alter table group_keys    enable row level security;
alter table receipts      enable row level security;
alter table invoices      enable row level security;

-- Bucket privat untuk ciphertext struk.
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false)
on conflict (id) do nothing;
