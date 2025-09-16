CREATE DATABASE NumberGame;
GO

USE NumberGame;
GO


/* ===========================================
   USERS
   =========================================== */
-- Create sequence for primary key
CREATE SEQUENCE seq_usersid AS BIGINT
START WITH 1
INCREMENT BY 1
MINVALUE -9223372036854775808
MAXVALUE 9223372036854775807
CACHE;
GO

-- Drop table if exists
DROP TABLE IF EXISTS [users];
GO

-- Create table
CREATE TABLE [users] (
    [user_id] BIGINT NOT NULL,
    [email] VARCHAR(100) NOT NULL UNIQUE,
    [phone] VARCHAR(20) NOT NULL UNIQUE,
    [password_hash] VARCHAR(255) NOT NULL,
    [created_at] DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
	[is_verified] BIT DEFAULT 0,
    CONSTRAINT [PK_user_Id] PRIMARY KEY CLUSTERED ([user_id] ASC)
        WITH (
            PAD_INDEX = OFF,
            STATISTICS_NORECOMPUTE = OFF,
            IGNORE_DUP_KEY = OFF,
            ALLOW_ROW_LOCKS = ON,
            ALLOW_PAGE_LOCKS = ON,
            FILLFACTOR = 80
        ) ON [PRIMARY]
) ON [PRIMARY];
GO

-- Add default from sequence for user_id
ALTER TABLE [users] 
ADD DEFAULT (NEXT VALUE FOR [seq_usersid]) FOR [user_id];
GO



/* ===========================================
   USER_PROFILES
   =========================================== */
-- Create sequence for primary key
CREATE SEQUENCE seq_userprofilesid AS BIGINT
START WITH 1
INCREMENT BY 1
MINVALUE -9223372036854775808
MAXVALUE 9223372036854775807
CACHE;
GO

-- Drop table if exists
DROP TABLE IF EXISTS [user_profiles];
GO

-- Create table
CREATE TABLE [user_profiles] (
    [profile_id] BIGINT NOT NULL,
    [user_id] BIGINT NOT NULL,
    [full_name] VARCHAR(100) NOT NULL,
    [avatar_url] VARCHAR(255) NOT NULL,
    [dob] DATE NOT NULL,
    [created_at] DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
	[address] VARCHAR(200) DEFAULT NULL,
    CONSTRAINT [PK_profile_Id] PRIMARY KEY CLUSTERED ([profile_id] ASC)
        WITH (FILLFACTOR = 80)
) ON [PRIMARY];
GO

-- Add default from sequence for profile_id
ALTER TABLE [user_profiles] 
ADD DEFAULT (NEXT VALUE FOR [seq_userprofilesid]) FOR [profile_id];
GO

-- Add foreign key to users table
ALTER TABLE [user_profiles]
ADD CONSTRAINT [FK_user_profiles_userid]
FOREIGN KEY ([user_id]) REFERENCES [users]([user_id])
ON UPDATE NO ACTION
ON DELETE NO ACTION;
GO


/* ===========================================
   USER_OTPS
   =========================================== */
-- Create sequence for primary key
CREATE SEQUENCE seq_userotpsid AS BIGINT
START WITH 1
INCREMENT BY 1
MINVALUE -9223372036854775808
MAXVALUE 9223372036854775807
CACHE;
GO

-- Drop table if exists
DROP TABLE IF EXISTS [user_otps];
GO

-- Create table
CREATE TABLE [user_otps] (
    [verification_id] BIGINT NOT NULL,
    [user_id] BIGINT NOT NULL,
    [email_otp] VARCHAR(6) NOT NULL,
	[phone_otp] VARCHAR(6) NOT NULL,
	[is_verified] BIT DEFAULT 0,
    [created_at] DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
	[expires_at] DATETIME2 NOT NULL,
    CONSTRAINT [PK_verification_Id] PRIMARY KEY CLUSTERED ([verification_id] ASC)
        WITH (FILLFACTOR = 80)
) ON [PRIMARY];
GO

-- Add default from sequence for profile_id
ALTER TABLE [user_otps] 
ADD DEFAULT (NEXT VALUE FOR [seq_userotpsid]) FOR [verification_id];
GO

-- Add foreign key to users table
ALTER TABLE [user_otps]
ADD CONSTRAINT [FK_user_otps_userid]
FOREIGN KEY ([user_id]) REFERENCES [users]([user_id])
ON UPDATE NO ACTION
ON DELETE NO ACTION;
GO


/* ===========================================
   WALLETS
   =========================================== */
-- Create sequence for primary key
CREATE SEQUENCE seq_walletsid AS BIGINT
START WITH 1
INCREMENT BY 1
MINVALUE -9223372036854775808
MAXVALUE 9223372036854775807
CACHE;
GO

-- Drop table if exists
DROP TABLE IF EXISTS [wallets];
GO

-- Create table
CREATE TABLE [wallets] (
    [wallet_id] BIGINT NOT NULL,
    [user_id] BIGINT NOT NULL,
    [balance] DECIMAL(10,2) NOT NULL DEFAULT 0,
    [last_updated] DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT [PK_wallet_Id] PRIMARY KEY CLUSTERED ([wallet_id] ASC)
        WITH (FILLFACTOR = 80)
) ON [PRIMARY];
GO

-- Add default from sequence for wallet_id
ALTER TABLE [wallets] 
ADD DEFAULT (NEXT VALUE FOR [seq_walletsid]) FOR [wallet_id];
GO

-- Add foreign key to users table
ALTER TABLE [wallets]
ADD CONSTRAINT [FK_wallets_userid]
FOREIGN KEY ([user_id]) REFERENCES [users]([user_id])
ON UPDATE NO ACTION
ON DELETE NO ACTION;
GO



/* ===========================================
   WALLET_TRANSACTIONS
   =========================================== */
-- Create sequence for primary key
CREATE SEQUENCE seq_wallettxnid AS BIGINT
START WITH 1
INCREMENT BY 1
MINVALUE -9223372036854775808
MAXVALUE 9223372036854775807
CACHE;
GO

-- Drop table if exists
DROP TABLE IF EXISTS [wallet_transactions];
GO

-- Create table
CREATE TABLE [wallet_transactions] (
    [txn_id] BIGINT NOT NULL,
    [wallet_id] BIGINT NOT NULL,
    [amount] DECIMAL(10,2) NOT NULL,
    [reference_id] BIGINT NOT NULL,
    [created_at] DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT [PK_txn_Id] PRIMARY KEY CLUSTERED ([txn_id] ASC)
        WITH (FILLFACTOR = 80)
) ON [PRIMARY];
GO

-- Add default from sequence for txn_id
ALTER TABLE [wallet_transactions] 
ADD DEFAULT (NEXT VALUE FOR [seq_wallettxnid]) FOR [txn_id];
GO

-- Add foreign key to wallets table
ALTER TABLE [wallet_transactions]
ADD CONSTRAINT [FK_wallet_transactions_walletid]
FOREIGN KEY ([wallet_id]) REFERENCES [wallets]([wallet_id])
ON UPDATE NO ACTION
ON DELETE NO ACTION;
GO



/* ===========================================
   GAME_SESSIONS
   =========================================== */
-- Create sequence for primary key
CREATE SEQUENCE seq_sessionid AS BIGINT
START WITH 1
INCREMENT BY 1
MINVALUE -9223372036854775808
MAXVALUE 9223372036854775807
CACHE;
GO

-- Drop table if exists
DROP TABLE IF EXISTS [game_sessions];
GO

-- Create table
CREATE TABLE [game_sessions] (
    [session_id] BIGINT NOT NULL,
    [session_start] DATETIME2 NOT NULL,
    [session_end] DATETIME2 NOT NULL,
    [bidding_end] DATETIME2 NOT NULL,
    [created_at] DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT [PK_session_Id] PRIMARY KEY CLUSTERED ([session_id] ASC)
        WITH (FILLFACTOR = 80)
) ON [PRIMARY];
GO

-- Add default from sequence for session_id
ALTER TABLE [game_sessions] 
ADD DEFAULT (NEXT VALUE FOR [seq_sessionid]) FOR [session_id];
GO



/* ===========================================
   BIDS
   =========================================== */
-- Create sequence for primary key
CREATE SEQUENCE seq_bidid AS BIGINT
START WITH 1
INCREMENT BY 1
MINVALUE -9223372036854775808
MAXVALUE 9223372036854775807
CACHE;
GO

-- Drop table if exists
DROP TABLE IF EXISTS [bids];
GO

-- Create table
CREATE TABLE [bids] (
    [bid_id] BIGINT NOT NULL,
    [session_id] BIGINT NOT NULL,
    [user_id] BIGINT NOT NULL,
    [chosen_number] INT NOT NULL,
    [amount] DECIMAL(10,2) NOT NULL,
    [created_at] DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT [PK_bid_Id] PRIMARY KEY CLUSTERED ([bid_id] ASC)
        WITH (FILLFACTOR = 80)
) ON [PRIMARY];
GO

-- Add default from sequence for bid_id
ALTER TABLE [bids] 
ADD DEFAULT (NEXT VALUE FOR [seq_bidid]) FOR [bid_id];
GO

-- Add foreign keys to sessions and users table
ALTER TABLE [bids]
ADD CONSTRAINT [FK_bids_sessionid]
FOREIGN KEY ([session_id]) REFERENCES [game_sessions]([session_id])
ON UPDATE NO ACTION
ON DELETE NO ACTION;

ALTER TABLE [bids]
ADD CONSTRAINT [FK_bids_userid]
FOREIGN KEY ([user_id]) REFERENCES [users]([user_id])
ON UPDATE NO ACTION
ON DELETE NO ACTION;
GO



/* ===========================================
   SESSION_RESULTS
   =========================================== */
-- Create sequence for primary key
CREATE SEQUENCE seq_resultid AS BIGINT
START WITH 1
INCREMENT BY 1
MINVALUE -9223372036854775808
MAXVALUE 9223372036854775807
CACHE;
GO

-- Drop table if exists
DROP TABLE IF EXISTS [session_results];
GO

-- Create table
CREATE TABLE [session_results] (
    [result_id] BIGINT NOT NULL,
    [session_id] BIGINT NOT NULL,
    [winning_number] INT NOT NULL,
    [declared_at] DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT [PK_result_Id] PRIMARY KEY CLUSTERED ([result_id] ASC)
        WITH (FILLFACTOR = 80)
) ON [PRIMARY];
GO

-- Add default from sequence for result_id
ALTER TABLE [session_results] 
ADD DEFAULT (NEXT VALUE FOR [seq_resultid]) FOR [result_id];
GO

-- Add foreign key to sessions table
ALTER TABLE [session_results]
ADD CONSTRAINT [FK_session_results_sessionid]
FOREIGN KEY ([session_id]) REFERENCES [game_sessions]([session_id])
ON UPDATE NO ACTION
ON DELETE NO ACTION;
GO



/* ===========================================
   PAYMENT_ORDERS
   =========================================== */
-- Create sequence for primary key
CREATE SEQUENCE seq_orderid AS BIGINT
START WITH 1
INCREMENT BY 1
MINVALUE -9223372036854775808
MAXVALUE 9223372036854775807
CACHE;
GO

-- Drop table if exists
DROP TABLE IF EXISTS [payment_orders];
GO

-- Create table
CREATE TABLE [payment_orders] (
    [order_id] BIGINT NOT NULL,
    [user_id] BIGINT NOT NULL,
    [amount] DECIMAL(10,2) NOT NULL,
    [gateway] VARCHAR(50) NOT NULL,
    [gateway_order_id] VARCHAR(100) NOT NULL,
    [gateway_payment_id] VARCHAR(100) NOT NULL,
    [created_at] DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT [PK_order_Id] PRIMARY KEY CLUSTERED ([order_id] ASC)
        WITH (FILLFACTOR = 80)
) ON [PRIMARY];
GO

-- Add default from sequence for order_id
ALTER TABLE [payment_orders] 
ADD DEFAULT (NEXT VALUE FOR [seq_orderid]) FOR [order_id];
GO

-- Add foreign key to users table
ALTER TABLE [payment_orders]
ADD CONSTRAINT [FK_payment_orders_userid]
FOREIGN KEY ([user_id]) REFERENCES [users]([user_id])
ON UPDATE NO ACTION
ON DELETE NO ACTION;
GO
