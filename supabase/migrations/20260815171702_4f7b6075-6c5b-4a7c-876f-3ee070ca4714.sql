CREATE TABLE public.company_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  singleton boolean NOT NULL DEFAULT true,
  company_name text NOT NULL,
  website text,
  what_we_sell jsonb NOT NULL DEFAULT '[]'::jsonb,
  who_we_serve text,
  trigger_signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  disqualifiers jsonb NOT NULL DEFAULT '[]'::jsonb,
  proof_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  price_range text,
  known_objections jsonb NOT NULL DEFAULT '[]'::jsonb,
  standard_faqs jsonb NOT NULL DEFAULT '[]'::jsonb,
  competitors jsonb NOT NULL DEFAULT '[]'::jsonb,
  banned_words jsonb NOT NULL DEFAULT '[]'::jsonb,
  rep_experience_level text NOT NULL DEFAULT 'experienced',
  bot_user_agent text NOT NULL DEFAULT 'SalesPrepBot/1.0',
  ai_model text NOT NULL DEFAULT 'google/gemini-3.6-flash',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_profile_singleton_true CHECK (singleton = true),
  CONSTRAINT company_profile_singleton_unique UNIQUE (singleton)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_profile TO authenticated;
GRANT ALL ON public.company_profile TO service_role;

ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view the company profile"
ON public.company_profile FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert the company profile"
ON public.company_profile FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update the company profile"
ON public.company_profile FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete the company profile"
ON public.company_profile FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_company_profile_updated_at
BEFORE UPDATE ON public.company_profile
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.company_profile (
  company_name, website, what_we_sell, who_we_serve, trigger_signals, disqualifiers,
  proof_points, price_range, known_objections, standard_faqs, competitors, banned_words,
  rep_experience_level, bot_user_agent, ai_model
) VALUES (
  'Moxxy Marketing',
  'https://getmoxxy.com',
  '["Brand strategy and positioning","Website design and development","Paid media management","Content marketing and SEO","Ongoing marketing retainers"]'::jsonb,
  'Small to mid-size businesses, roughly $2M to $50M in revenue, that have outgrown DIY marketing but are not large enough for an in-house team.',
  '["Hired a new marketing leader in the last 6 months","Recent funding, expansion, or new location","Website has not been meaningfully updated in 2+ years","Running paid ads that point to a weak landing page","Rebrand or name change in progress","No blog or social activity in the last 12 months","Copy or reviews suggesting low brand awareness"]'::jsonb,
  '["Pre-revenue startups with no marketing budget","Companies wanting one-off logo or flyer work","Businesses already under contract with another agency"]'::jsonb,
  '["PLACEHOLDER: named client result with a number","PLACEHOLDER: named client result with a number","PLACEHOLDER: named client result with a number"]'::jsonb,
  'Projects typically start in the low five figures. Retainers typically start at a few thousand per month.',
  '["We already have someone doing our marketing","We tried an agency before and it did not work","We do not have budget right now","We want to keep this in-house"]'::jsonb,
  '["What do you charge?","How long until we see results?","Who actually does the work?","What makes you different from other agencies?"]'::jsonb,
  '["Freelancers","In-house hire","Doing nothing"]'::jsonb,
  '["synergy","leverage","circle back","touch base","game-changer"]'::jsonb,
  'experienced',
  'MoxxyPrepBot/1.0',
  'google/gemini-3.6-flash'
);