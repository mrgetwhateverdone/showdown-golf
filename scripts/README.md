# Database Migration Scripts

## Migration Order

Run scripts in this exact order:

1. `001_setup_profiles_table.sql` - Create profiles table
2. `001_setup_profiles_rls.sql` - Setup RLS for profiles
3. `002_setup_friends_table.sql` - Create friends tables
4. `003_setup_matches_table.sql` - Create courses and match-related tables
5. `004_setup_profile_trigger.sql` - Setup profile creation trigger
6. `005_add_full_name_to_profiles.sql` - Add full_name column
7. `006_create_reviews_table.sql` - Create reviews table
8. `007_disable_email_confirmation.sql` - Disable email confirmation
9. `013_final_schema_consolidation.sql` - **FINAL SCHEMA** - Fixes all issues

## Important Notes

- **Script 013 is the authoritative schema** - It consolidates and fixes all previous issues
- Scripts 008, 009, 011, 012 have been removed as they contained conflicting definitions
- Always run script 013 last to ensure consistent schema

## Schema Overview

### Core Tables
- `public.profiles` - User profiles (extends auth.users)
- `public.friends` - Friend relationships
- `public.friend_requests` - Friend requests
- `public.matches` - Golf matches
- `public.match_participants` - Match participants
- `public.match_holes` - Hole data for matches
- `public.match_scores` - Player scores per hole
- `public.transactions` - Financial transactions
- `public.courses` - Golf courses
- `public.reviews` - Player reviews

### Key Constraints
- All foreign keys reference `public.profiles(id)` (not `auth.users(id)`)
- All tables use `public.` schema prefix for consistency
- RLS (Row Level Security) enabled on all tables
- Proper CASCADE behavior on foreign keys
