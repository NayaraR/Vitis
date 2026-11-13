
create or replace function public.try_uuid(_t text) returns uuid language plpgsql immutable as $$
begin return _t::uuid; exception when others then return null; end $$;

create policy "read attachment files" on storage.objects for select to authenticated
  using (bucket_id = 'attachments' and exists (
    select 1 from public.article_attachments att where att.storage_path = name and public.can_read_article(att.article_id)));
create policy "editors upload attachment files" on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments' and exists (
    select 1 from public.articles a where a.id = public.try_uuid((storage.foldername(name))[1]) and public.can_manage_area(a.owner_area_id)));
create policy "editors delete attachment files" on storage.objects for delete to authenticated
  using (bucket_id = 'attachments' and exists (
    select 1 from public.articles a where a.id = public.try_uuid((storage.foldername(name))[1]) and public.can_manage_area(a.owner_area_id)));

insert into public.internal_domains values ('vissimo.com.br');
insert into public.app_settings (id, popular_queries, support_channel)
values (1, array['abertura de loja','fechamento de caixa','troca de produto','inventário','senha do PDV'], 'Canal de suporte a definir — configure em Administração › Configurações');

insert into public.areas (name) values ('Operações de loja'),('Financeiro'),('Tecnologia'),('Pessoas'),('Produto'),('Comunicação');

insert into public.systems (name, slug, description) values
 ('SAP','sap','ERP corporativo'), ('VarejoFácil','varejofacil','Sistema de gestão de loja'), ('SysPDV','syspdv','Frente de caixa (PDV)');

insert into public.categories (name, slug, sort_order, description) values
 ('Processos de loja','processos-de-loja',1,'Rotinas da operação diária das lojas'),
 ('Gestão da loja','gestao-da-loja',2,'Indicadores, metas e rotinas de gestão'),
 ('Produto e experiência','produto-e-experiencia',3,'Produto, exposição e experiência do cliente'),
 ('Segurança e infraestrutura','seguranca-e-infraestrutura',4,'Segurança, manutenção e equipamentos'),
 ('Pessoas e treinamento','pessoas-e-treinamento',5,'Equipe, escalas e capacitação'),
 ('Comunicados','comunicados',6,'Comunicados oficiais');
insert into public.categories (name, slug, sort_order, parent_id)
select v.name, v.slug, v.ord, (select id from public.categories where slug='processos-de-loja')
from (values ('Operação de loja','operacao-de-loja',1),('Abertura e fechamento','abertura-e-fechamento',2),('Caixa e pagamentos','caixa-e-pagamentos',3),
 ('Atendimento, trocas e devoluções','atendimento-trocas-devolucoes',4),('Estoque e inventário','estoque-e-inventario',5)) v(name,slug,ord);

-- demo articles
do $$
declare
  c_ab uuid := (select id from public.categories where slug='abertura-e-fechamento');
  c_cx uuid := (select id from public.categories where slug='caixa-e-pagamentos');
  c_tr uuid := (select id from public.categories where slug='atendimento-trocas-devolucoes');
  c_es uuid := (select id from public.categories where slug='estoque-e-inventario');
  c_com uuid := (select id from public.categories where slug='comunicados');
  c_ges uuid := (select id from public.categories where slug='gestao-da-loja');
  ar_op uuid := (select id from public.areas where name='Operações de loja');
  ar_fin uuid := (select id from public.areas where name='Financeiro');
  ar_ti uuid := (select id from public.areas where name='Tecnologia');
  ar_com uuid := (select id from public.areas where name='Comunicação');
  s_vf uuid := (select id from public.systems where slug='varejofacil');
  s_pdv uuid := (select id from public.systems where slug='syspdv');
  s_sap uuid := (select id from public.systems where slug='sap');
  st jsonb := '[{"text":"Etapa de exemplo: descreva uma única ação, começando por um verbo."},{"text":"Etapa de exemplo: indique onde a ação acontece (tela, sistema ou local da loja)."},{"text":"Etapa de exemplo: diga como confirmar que a etapa deu certo."}]';
  fq jsonb := '[{"q":"Pergunta de exemplo: o que fazer se a situação for diferente do padrão?","a":"Resposta de exemplo: descreva a exceção e a quem recorrer."},{"q":"Pergunta de exemplo: quem pode autorizar esta ação?","a":"Resposta de exemplo: informe o cargo responsável, sem nomes pessoais."}]';
  a1 uuid; a2 uuid; a3 uuid; a4 uuid; a5 uuid; a6 uuid; t uuid;
begin
  insert into public.articles (slug,title,summary,quick_answer,attention,materials,steps,faq,category_id,content_type,audience,visibility,search_synonyms,featured,status,owner_area_id,version_label,change_summary,published_at,reviewed_at,next_review_at,is_example,contact,view_count)
  values ('exemplo-modelo-de-procedimento','EXEMPLO · Modelo de procedimento de abertura de loja','Modelo que mostra a estrutura de um procedimento. Substitua pelo conteúdo oficial da área.',
   'Resposta rápida de exemplo: em uma ou duas frases, diga o que a pessoa precisa fazer.','Alerta de exemplo: use este bloco para riscos, prazos ou proibições.',
   array['Material de exemplo 1','Material de exemplo 2'], st, fq, c_ab,'procedure',array['store_team','manager'],'internal',array['abrir loja','abertura','início do expediente'],true,'published',ar_op,'1.1','Exemplo: ajuste no passo 2 e inclusão de FAQ',now()-interval '20 days',now()-interval '20 days',current_date+300,true,'Área de Operações de loja (canal a definir)',42)
  returning id into a1;
  insert into public.article_versions (article_id,version_label,snapshot,change_summary,kind,published_at) values
   (a1,'1.0',jsonb_build_object('title','EXEMPLO · Modelo de procedimento de abertura de loja','version_label','1.0'),'Primeira publicação (exemplo)','publish',now()-interval '120 days'),
   (a1,'1.1',jsonb_build_object('title','EXEMPLO · Modelo de procedimento de abertura de loja','version_label','1.1'),'Exemplo: ajuste no passo 2 e inclusão de FAQ','publish',now()-interval '20 days');
  insert into public.article_systems values (a1, s_vf);

  insert into public.articles (slug,title,summary,quick_answer,attention,materials,steps,faq,category_id,content_type,audience,visibility,search_synonyms,status,owner_area_id,version_label,change_summary,published_at,reviewed_at,next_review_at,is_example,view_count)
  values ('exemplo-checklist-fechamento-caixa','EXEMPLO · Checklist de fechamento de caixa (revisão vencida)','Modelo de checklist com revisão vencida, para demonstrar o aviso de revisão necessária.',
   'Resposta rápida de exemplo: liste o essencial que não pode faltar no fechamento.',null,array['Item de exemplo'],st,'[]',c_cx,'checklist',array['manager'],'internal',array['fechar caixa','sangria','conferência'],'published',ar_fin,'2.0','Exemplo de versão',now()-interval '400 days',now()-interval '400 days',current_date-35,true,30)
  returning id into a2;
  insert into public.article_versions (article_id,version_label,snapshot,change_summary,kind,published_at) values (a2,'2.0','{}','Exemplo de versão','publish',now()-interval '400 days');
  insert into public.article_systems values (a2, s_pdv);

  insert into public.articles (slug,title,summary,quick_answer,materials,steps,faq,category_id,content_type,audience,visibility,search_synonyms,status,owner_area_id,version_label,change_summary,published_at,reviewed_at,next_review_at,is_example,view_count)
  values ('exemplo-guia-trocas','EXEMPLO · Guia rápido de trocas e devoluções','Modelo de guia rápido visível também para clientes (visibilidade: todos). Há uma nova versão em rascunho.',
   'Resposta rápida de exemplo: indique a regra principal em linguagem simples.',array[]::text[],st,fq,c_tr,'quick_guide',array['all'],'all',array['troca','devolução','devolver produto','trocar'],'published',ar_op,'1.0','Primeira publicação (exemplo)',now()-interval '60 days',now()-interval '60 days',current_date+200,true,55)
  returning id into a3;
  insert into public.article_versions (article_id,version_label,snapshot,change_summary,kind,published_at) values (a3,'1.0','{}','Primeira publicação (exemplo)','publish',now()-interval '60 days');
  insert into public.article_drafts (article_id,status,title,slug,summary,quick_answer,steps,faq,category_id,content_type,audience,visibility,search_synonyms,owner_area_id,tag_names)
  values (a3,'draft','EXEMPLO · Guia rápido de trocas e devoluções','exemplo-guia-trocas','Nova versão em rascunho (exemplo): o texto publicado continua no ar até a publicação.','Resposta rápida de exemplo revisada.',st,fq,c_tr,'quick_guide',array['all'],'all',array['troca','devolução'],ar_op,array['atendimento','troca']);

  insert into public.articles (slug,title,summary,category_id,content_type,audience,visibility,status,owner_area_id,is_example)
  values ('exemplo-inventario-em-revisao','EXEMPLO · Procedimento de inventário (em revisão)','Modelo nunca publicado, aguardando revisão.',c_es,'procedure',array['store_team'],'internal','in_review',ar_op,true)
  returning id into a4;
  insert into public.article_drafts (article_id,status,title,slug,summary,quick_answer,steps,category_id,content_type,audience,visibility,owner_area_id,system_ids,submitted_at)
  values (a4,'in_review','EXEMPLO · Procedimento de inventário (em revisão)','exemplo-inventario-em-revisao','Modelo nunca publicado, aguardando revisão.','Resposta rápida de exemplo.',st,c_es,'procedure',array['store_team'],'internal',ar_op,array[s_sap],now());

  insert into public.articles (slug,title,summary,quick_answer,category_id,content_type,audience,visibility,status,owner_area_id,version_label,change_summary,published_at,reviewed_at,next_review_at,is_example)
  values ('exemplo-comunicado','EXEMPLO · Comunicado institucional','Modelo de comunicado: diga o que mudou, para quem e a partir de quando.','Resumo de exemplo do comunicado.',c_com,'announcement',array['all'],'all','published',ar_com,'1.0','Publicação do comunicado (exemplo)',now()-interval '3 days',now()-interval '3 days',current_date+90,true)
  returning id into a5;
  insert into public.article_versions (article_id,version_label,snapshot,change_summary,kind,published_at) values (a5,'1.0','{}','Publicação do comunicado (exemplo)','publish',now()-interval '3 days');

  insert into public.articles (slug,title,summary,quick_answer,attention,steps,category_id,content_type,audience,visibility,search_synonyms,status,owner_area_id,version_label,change_summary,published_at,reviewed_at,next_review_at,is_example,view_count,featured)
  values ('exemplo-modelo-senha-pdv','EXEMPLO · Modelo de manual de sistema','Modelo de manual de sistema para o Espaço do gerente.','Resposta rápida de exemplo para dúvidas de sistema.','Alerta de exemplo: nunca compartilhe senhas.',st,c_ges,'manual',array['manager'],'internal',array['senha','acesso','login do pdv'],'published',ar_ti,'1.0','Primeira publicação (exemplo)',now()-interval '10 days',now()-interval '10 days',current_date+355,true,18,true)
  returning id into a6;
  insert into public.article_versions (article_id,version_label,snapshot,change_summary,kind,published_at) values (a6,'1.0','{}','Primeira publicação (exemplo)','publish',now()-interval '10 days');
  insert into public.article_systems values (a6, s_pdv), (a6, s_vf);

  insert into public.tags(name) values ('abertura') returning id into t; insert into public.article_tags values (a1,t);
  insert into public.tags(name) values ('caixa') returning id into t; insert into public.article_tags values (a2,t);
  insert into public.tags(name) values ('atendimento') returning id into t; insert into public.article_tags values (a3,t);
  insert into public.tags(name) values ('sistemas') returning id into t; insert into public.article_tags values (a6,t);
end $$;
