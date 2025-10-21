-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.customer_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method character varying NOT NULL DEFAULT 'Cash'::character varying,
  reference_number character varying,
  notes text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT customer_payments_pkey PRIMARY KEY (id),
  CONSTRAINT customer_payments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT customer_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid,
  user_id uuid,
  amount numeric NOT NULL,
  description text NOT NULL,
  category character varying,
  expense_date date NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  scope_of_work text,
  vendor_name character varying,
  vendor_contact character varying,
  payment_method character varying DEFAULT 'Cash'::character varying,
  payment_status character varying DEFAULT 'Unpaid'::character varying,
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT expenses_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT expenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0::numeric),
  payment_date date NOT NULL,
  payment_type character varying NOT NULL DEFAULT 'Other'::character varying,
  payment_mode character varying NOT NULL DEFAULT 'Cash'::character varying,
  reference_number character varying,
  notes text,
  received_from character varying,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  name character varying NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date,
  status character varying DEFAULT 'active'::character varying,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  client_name character varying,
  total_project_cost numeric,
  scope_of_work ARRAY CHECK (scope_of_work IS NULL OR scope_of_work <@ ARRAY['Carpentry Work'::text, 'Painting Work'::text, 'Aluminium Work'::text, 'Electrical Work'::text, 'Plumbing Work'::text, 'Flooring Work'::text, 'False Ceiling Work'::text, 'Masonry Work'::text, 'Tiling Work'::text, 'Glazing Work'::text, 'Door & Window Work'::text, 'Kitchen & Modular Work'::text, 'Interior Decoration'::text, 'Exterior Decoration'::text, 'Landscaping Work'::text, 'HVAC Work'::text, 'Waterproofing Work'::text, 'Structural Work'::text, 'Civil Work'::text, 'Plastering Work'::text, 'Wallpaper Work'::text, 'Furniture Work'::text, 'Lighting Work'::text, 'Partition Work'::text, 'Plaster of Paris Work'::text, 'Wood Flooring'::text, 'Marble & Granite Work'::text, 'Steel Fabrication'::text, 'Railing Work'::text, 'Staircase Work'::text, 'Bathroom Fitting'::text, 'Wardrobe Work'::text, 'Curtain & Blinds'::text, 'Wall Cladding'::text, 'Roofing Work'::text, 'Insulation Work'::text, 'Demolition Work'::text, 'Site Preparation'::text, 'Complete Interior Fit-out'::text, 'Complete Renovation'::text, 'Turnkey Project'::text]),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  full_name character varying NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  last_login timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vendor_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method character varying NOT NULL DEFAULT 'Cash'::character varying,
  vendor_name character varying NOT NULL,
  vendor_contact character varying,
  reference_number character varying,
  notes text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT vendor_payments_pkey PRIMARY KEY (id),
  CONSTRAINT vendor_payments_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES public.expenses(id),
  CONSTRAINT vendor_payments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT vendor_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);