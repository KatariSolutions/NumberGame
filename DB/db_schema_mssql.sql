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
    [is_active] BIT DEFAULT 0,
	[is_admin] BIT DEFAULT 0,
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
    [full_name] VARCHAR(100) DEFAULT NULL,
    [avatar_url] VARCHAR(MAX) DEFAULT NULL,
    [dob] DATE DEFAULT NULL,
    [created_at] DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
	[address] VARCHAR(200) DEFAULT NULL,
    [pincode] VARCHAR(10) NULL,
    [updated_at] DATETIME2 NOT NULL,
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
   LOGIN_SESSIONS
   =========================================== */
-- Create sequence for primary key
CREATE SEQUENCE seq_loginsessionid AS BIGINT
START WITH 1
INCREMENT BY 1
MINVALUE -9223372036854775808
MAXVALUE 9223372036854775807
CACHE;
GO

-- Drop table if exists
DROP TABLE IF EXISTS [login_sessions];
GO

-- Create table
CREATE TABLE [login_sessions] (
    [login_session_id] BIGINT NOT NULL,
    [user_id] BIGINT NOT NULL,
	[is_active] BIT DEFAULT 1,
	[session_starttime] DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
	[session_endtime] DATETIME2 DEFAULT NULL,
	[token] VARCHAR(500) NOT NULL,
    CONSTRAINT [PK_login_session_id] PRIMARY KEY CLUSTERED ([login_session_id] ASC)
        WITH (FILLFACTOR = 80)
) ON [PRIMARY];
GO

-- Add default from sequence for profile_id
ALTER TABLE [login_sessions] 
ADD DEFAULT (NEXT VALUE FOR [seq_loginsessionid]) FOR [login_session_id];
GO

-- Add foreign key to users table
ALTER TABLE [login_sessions]
ADD CONSTRAINT [FK_login_sessions_userid]
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
	[is_active] BIT DEFAULT 1,
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
	[txn_type] VARCHAR(10) NOT NULL DEFAULT 'SELF',
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
    [winning_number] VARCHAR(20) NOT NULL,
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
	[txn_ref] BIGINT NOT NULL,
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

-- Add foreign key to wallet transactions table
ALTER TABLE [payment_orders]
ADD CONSTRAINT [FK_payment_orders_txnid]
FOREIGN KEY ([txn_ref]) REFERENCES [wallet_transactions]([txn_id])
ON UPDATE NO ACTION
ON DELETE NO ACTION;
GO




/*

	New Code to add/recommended

*/
CREATE SEQUENCE seq_userresultid AS BIGINT
START WITH 1
INCREMENT BY 1
MINVALUE -9223372036854775808
MAXVALUE 9223372036854775807
CACHE;
GO

DROP TABLE IF EXISTS [session_user_results];
GO

CREATE TABLE [session_user_results] (
    [user_result_id] BIGINT NOT NULL,
    [session_id] BIGINT NOT NULL,
    [user_id] BIGINT NOT NULL,
    [chosen_number] INT NOT NULL,
    [amount] DECIMAL(10,2) NOT NULL,
    [is_winner] BIT NOT NULL,
    [payout] DECIMAL(10,2) NOT NULL DEFAULT 0,
    [created_at] DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT [PK_user_result_Id] PRIMARY KEY CLUSTERED ([user_result_id] ASC)
) ON [PRIMARY];
GO

ALTER TABLE [session_user_results] 
ADD DEFAULT (NEXT VALUE FOR [seq_userresultid]) FOR [user_result_id];
GO

ALTER TABLE [session_user_results]
ADD CONSTRAINT [FK_user_results_sessionid]
FOREIGN KEY ([session_id]) REFERENCES [game_sessions]([session_id]);

ALTER TABLE [session_user_results]
ADD CONSTRAINT [FK_user_results_userid]
FOREIGN KEY ([user_id]) REFERENCES [users]([user_id]);
GO

/*
===========================================
   GAME_CONTROL
=========================================== 
*/
DROP TABLE IF EXISTS game_control;
GO

CREATE TABLE game_control (
    control_id INT IDENTITY(1,1) PRIMARY KEY,
    is_active BIT NOT NULL DEFAULT 0,
    last_updated DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_by VARCHAR(50) NULL
);
GO

/*
===========================================
	BANK_DETAILS
===========================================
*/
-- Create sequence for primary key
CREATE SEQUENCE seq_bankaccountsid AS BIGINT
START WITH 1
INCREMENT BY 1
MINVALUE -9223372036854775808
MAXVALUE 9223372036854775807
CACHE;
GO

-- Drop table if exists
DROP TABLE IF EXISTS [BankAccounts];
GO

-- Create table
CREATE TABLE [BankAccounts] (
    [ba_id] BIGINT NOT NULL,
    [user_id] BIGINT NOT NULL,
    [acc_number] VARCHAR(50) NOT NULL,
	[bank_name] VARCHAR(50) NOT NULL,
	[IFSC_code] VARCHAR(20) NOT NULL,
	[branch_name] VARCHAR(20),
	[pincode] VARCHAR(10),
	[mobile] VARCHAR(13) NOT NULL,
    [last_updated] DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
	[is_active] BIT DEFAULT 1,
	[is_upi_available] BIT DEFAULT 1,
    CONSTRAINT [PK_ba_Id] PRIMARY KEY CLUSTERED ([ba_id] ASC)
        WITH (FILLFACTOR = 80)
) ON [PRIMARY];
GO

-- Add default from sequence for wallet_id
ALTER TABLE [BankAccounts] 
ADD DEFAULT (NEXT VALUE FOR [seq_bankaccountsid]) FOR [ba_id];
GO

-- Add foreign key to users table
ALTER TABLE [BankAccounts]
ADD CONSTRAINT [FK_bankaccounts_userid]
FOREIGN KEY ([user_id]) REFERENCES [users]([user_id])
ON UPDATE NO ACTION
ON DELETE NO ACTION;
GO

/*
===========================================
	WALLET_REQUESTS
===========================================
*/
-- Create sequence for primary key
CREATE SEQUENCE seq_walletrequestid AS BIGINT
START WITH 1
INCREMENT BY 1
MINVALUE -9223372036854775808
MAXVALUE 9223372036854775807
CACHE;
GO

-- Drop table if exists
DROP TABLE IF EXISTS [wallet_requests];
GO

-- Create table
CREATE TABLE [wallet_requests] (
    [request_id] BIGINT NOT NULL,
    [user_id] BIGINT NOT NULL,
    [request_type] VARCHAR(20) NOT NULL,
	[amount] DECIMAL(20) NOT NULL,
	[status] VARCHAR(20) NOT NULL DEFAULT 'PENDING',
	[admin_note] VARCHAR(255),
	[payment_ref] VARCHAR(100),
	[created_at] DATETIME DEFAULT SYSDATETIME(),
	[updated_at] DATETIME,
	[pay_img] VARCHAR(MAX),
    CONSTRAINT [PK_walletrequest_Id] PRIMARY KEY CLUSTERED ([request_id] ASC)
        WITH (FILLFACTOR = 80)
) ON [PRIMARY];
GO

-- Add default from sequence for wallet_id
ALTER TABLE [wallet_requests] 
ADD DEFAULT (NEXT VALUE FOR [seq_walletrequestid]) FOR [request_id];
GO

-- Add foreign key to users table
ALTER TABLE [wallet_requests]
ADD CONSTRAINT [FK_walletrequests_userid]
FOREIGN KEY ([user_id]) REFERENCES [users]([user_id])
ON UPDATE NO ACTION
ON DELETE NO ACTION;
GO


/* ===========================================
   USER_NOTIFICATIONS
   =========================================== */

-- Create sequence for primary key
CREATE SEQUENCE seq_usernotificationsid AS BIGINT
START WITH 1
INCREMENT BY 1
MINVALUE -9223372036854775808
MAXVALUE 9223372036854775807
CACHE;
GO

-- Drop table if exists
DROP TABLE IF EXISTS [user_notifications];
GO

-- Create table
CREATE TABLE [user_notifications] (
    [notification_id] BIGINT NOT NULL,
    [user_id] BIGINT NOT NULL,
    [notification_type] VARCHAR(20) NOT NULL,
    [message] VARCHAR(500) NOT NULL,
    [is_viewed] BIT NOT NULL DEFAULT 0,
    [created_on] DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT [PK_notification_Id] PRIMARY KEY CLUSTERED ([notification_id] ASC)
        WITH (FILLFACTOR = 80)
) ON [PRIMARY];
GO

-- Add default from sequence for notification_id
ALTER TABLE [user_notifications]
ADD DEFAULT (NEXT VALUE FOR [seq_usernotificationsid]) FOR [notification_id];
GO

-- Add foreign key to users table
ALTER TABLE [user_notifications]
ADD CONSTRAINT [FK_user_notifications_userid]
FOREIGN KEY ([user_id]) REFERENCES [users]([user_id])
ON UPDATE NO ACTION
ON DELETE CASCADE;
GO

CREATE NONCLUSTERED INDEX IX_user_notifications_unread
ON user_notifications (user_id, is_viewed, created_on DESC);
GO


/*
===========================================
	PASSWORD_RESET_REQUESTS
===========================================
*/
-- Create sequence for primary key
CREATE SEQUENCE seq_passwordresetrequestid AS BIGINT
START WITH 1
INCREMENT BY 1
MINVALUE -9223372036854775808
MAXVALUE 9223372036854775807
CACHE;
GO

-- Drop table if exists
DROP TABLE IF EXISTS [password_reset_requests];
GO

-- Create table
CREATE TABLE [password_reset_requests] (
    [request_id] BIGINT NOT NULL,
    [user_id] BIGINT NOT NULL,
	[status] VARCHAR(20) NOT NULL DEFAULT 'PENDING',
	[admin_note] VARCHAR(255),
	[created_at] DATETIME DEFAULT SYSDATETIME(),
	[updated_at] DATETIME,
    CONSTRAINT [PK_passwordresetrequest_Id] PRIMARY KEY CLUSTERED ([request_id] ASC)
        WITH (FILLFACTOR = 80)
) ON [PRIMARY];
GO

-- Add default from sequence for wallet_id
ALTER TABLE [password_reset_requests] 
ADD DEFAULT (NEXT VALUE FOR [seq_passwordresetrequestid]) FOR [request_id];
GO

-- Add foreign key to users table
ALTER TABLE [password_reset_requests]
ADD CONSTRAINT [FK_passwordresetrequests_userid]
FOREIGN KEY ([user_id]) REFERENCES [users]([user_id])
ON UPDATE NO ACTION
ON DELETE NO ACTION;
GO