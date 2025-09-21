-- Rename type column to transaction_type in transactions table
ALTER TABLE public.transactions RENAME COLUMN type TO transaction_type;

-- Update the check constraint
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_transaction_type_check 
  CHECK (transaction_type IN ('wager', 'prize', 'refund', 'deposit', 'withdrawal', 'winnings'));
