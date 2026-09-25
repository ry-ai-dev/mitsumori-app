-- ============================================================
-- 見積書・請求書作成ツール 初期スキーマ
-- ============================================================

-- 事業者情報（発行者自身のプロフィール）。auth.users と1:1
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_name text,
  full_name text,
  address text,
  bank_info text,
  created_at timestamptz not null default now()
);

-- クライアント（見積書・請求書の宛先）
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text,
  contact_email text,
  created_at timestamptz not null default now()
);

-- 見積書・請求書
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references clients(id) on delete restrict,
  type text not null check (type in ('quote', 'invoice')),
  doc_number text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid')),
  issue_date date not null default current_date,
  due_date date,
  notes text,
  subtotal numeric(12, 2) not null default 0,
  tax numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  source_quote_id uuid references documents(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 明細行
create table if not exists document_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  description text not null,
  unit_price numeric(12, 2) not null default 0,
  quantity numeric(12, 2) not null default 1,
  sort_order int not null default 0
);

create index if not exists idx_clients_user_id on clients(user_id);
create index if not exists idx_documents_user_id on documents(user_id);
create index if not exists idx_documents_client_id on documents(client_id);
create index if not exists idx_document_items_document_id on document_items(document_id);

-- ============================================================
-- RLS（Row Level Security）
-- ============================================================

alter table profiles enable row level security;
alter table clients enable row level security;
alter table documents enable row level security;
alter table document_items enable row level security;

-- profiles: 本人のみ参照・編集可
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- clients: user_id が自分のものだけ
create policy "clients_select_own" on clients
  for select using (auth.uid() = user_id);
create policy "clients_insert_own" on clients
  for insert with check (auth.uid() = user_id);
create policy "clients_update_own" on clients
  for update using (auth.uid() = user_id);
create policy "clients_delete_own" on clients
  for delete using (auth.uid() = user_id);

-- documents: user_id が自分のものだけ
create policy "documents_select_own" on documents
  for select using (auth.uid() = user_id);
create policy "documents_insert_own" on documents
  for insert with check (auth.uid() = user_id);
create policy "documents_update_own" on documents
  for update using (auth.uid() = user_id);
create policy "documents_delete_own" on documents
  for delete using (auth.uid() = user_id);

-- document_items: 親 document の user_id を通して判定
create policy "document_items_select_own" on document_items
  for select using (
    exists (
      select 1 from documents d
      where d.id = document_items.document_id and d.user_id = auth.uid()
    )
  );
create policy "document_items_insert_own" on document_items
  for insert with check (
    exists (
      select 1 from documents d
      where d.id = document_items.document_id and d.user_id = auth.uid()
    )
  );
create policy "document_items_update_own" on document_items
  for update using (
    exists (
      select 1 from documents d
      where d.id = document_items.document_id and d.user_id = auth.uid()
    )
  );
create policy "document_items_delete_own" on document_items
  for delete using (
    exists (
      select 1 from documents d
      where d.id = document_items.document_id and d.user_id = auth.uid()
    )
  );
