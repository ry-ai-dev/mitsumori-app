-- 提案書（proposal）種別の追加
-- documents.type に 'proposal' を追加し、見出し＋本文のセクション配列を
-- 保持するための proposal_sections 列を追加する。
-- 既存の quote / invoice の構造（document_items）には影響を与えない。

alter table documents drop constraint if exists documents_type_check;
alter table documents add constraint documents_type_check check (type in ('quote', 'invoice', 'proposal'));
alter table documents add column if not exists proposal_sections jsonb;
