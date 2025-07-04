-- Tabla "member"
CREATE TABLE Members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255)
);

CREATE TABLE Loans (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    member_id uuid,
    original_amount DECIMAL(20),
    updated_amount DECIMAL(20),
    monthly_payment DECIMAL(20),
    interest_rate DECIMAL(5, 4),
    created_at DECIMAL(20),
    updated_at DECIMAL(20),
    loan_type VARCHAR(255),
    state VARCHAR(255),
    FOREIGN KEY (member_id) REFERENCES Members(id)
);

-- Creación de la tabla LoanDisbursements
CREATE TABLE LoanTransactions (
  id SERIAL PRIMARY KEY,
  loan_id uuid,
  date TIMESTAMP DEFAULT current_timestamp,
  disbursement_amount DECIMAL(20),
  payment_amount DECIMAL(20),
  interest_amount DECIMAL(20),
  last_balance DECIMAL(20),
  FOREIGN KEY (loan_id) REFERENCES Loans(id)
);

-- Tabla "stock"
CREATE TABLE Stocks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  type VARCHAR(100),
  value DECIMAL(20),
  monthly_contribution DECIMAL(20),
  updated_at TIMESTAMP DEFAULT current_timestamp
);

-- Tabla "member_stock"
CREATE TABLE MemberStock (
  member_id uuid REFERENCES Members (id),
  stock_id uuid REFERENCES Stocks (id),
  quantity INTEGER,
  PRIMARY KEY (member_id, stock_id)
);

-- Tabla "contribution"
CREATE TABLE Contributions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id uuid REFERENCES Members (id),
  stock_id uuid REFERENCES Stocks (id),
  date TIMESTAMP DEFAULT current_timestamp,
  quantity INTEGER,
  amount DECIMAL(20)
);

-- Tabla "stock_transaction"
CREATE TABLE StockTransactions (
  id SERIAL PRIMARY KEY,
  member_id uuid REFERENCES Members (id),
  stock_id uuid REFERENCES Stocks (id),
  date TIMESTAMP DEFAULT current_timestamp,
  type VARCHAR(100),
  quantity INTEGER,
  value DECIMAL(20)
);

-- Tabla "meetings_resume"
CREATE TABLE MeetingsReport (
  id SERIAL PRIMARY KEY,
  date TIMESTAMP DEFAULT current_timestamp,
  interest_amount DECIMAL(20),
  raised_money DECIMAL(20),
  loan_amount DECIMAL(20),
  withdrawal_amount DECIMAL(20)
);

-- Tabla "stock_performance"
CREATE TABLE StockPerformance (
  id SERIAL PRIMARY KEY,
  stock_id uuid REFERENCES Stocks (id),
  date DATE,
  quantity INTEGER,
  value DECIMAL(20)
);

-- Tabla FundAssets
CREATE TABLE FundAssets (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  updated_at TIMESTAMP DEFAULT current_timestamp,
  asset_type VARCHAR(255) NOT NULL,
  total DECIMAL(10, 2) NOT NULL
);

INSERT INTO FundAssets(asset_type,total) VALUES ('ACTIVIDAD',0);
INSERT INTO FundAssets(asset_type,total) VALUES ('INGRESOS ADICIONALES',0);
INSERT INTO FundAssets(asset_type,total) VALUES ('ADMINISTRACION',0);

-- Tabla Insurance
CREATE TABLE Insurance (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id uuid NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  updated_at TIMESTAMP DEFAULT current_timestamp,
  FOREIGN KEY (member_id) REFERENCES Members(id)
);

-- Tabla MemberPayments
CREATE TABLE MemberPayments (
  id SERIAL PRIMARY KEY,
  member_id uuid NOT NULL,
  date TIMESTAMP DEFAULT current_timestamp,
  obligation_type VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (member_id) REFERENCES Members(id)
);

-- Table "audit"
CREATE TABLE Audit (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  date TIMESTAMP DEFAULT current_timestamp,
  action VARCHAR(100),
  description VARCHAR(255),
  user_audited VARCHAR(255)
);
