# Schema Mismatch Fixes

## Issues Found

During voice conversation testing, two database schema mismatches were identified:

1. **`calls` table**: Code was trying to insert `session_id` column, but it doesn't exist in the schema
2. **`leads` table**: Code was trying to update `authority` column, but it doesn't exist in the schema

## Root Cause

The code was using fields that don't exist in the actual Supabase database schema:
- `calls.session_id` - Not a column in the `calls` table
- `leads.authority` - Not a column in the `leads` table (BANT fields are stored in notes/progress_details)

## Fixes Applied

### 1. Fixed `calls_api.py`

**Changes:**
- Removed `session_id` from being inserted as a column
- Store `session_id` in the `notes` field instead: `[Session: {session_id}]`
- Changed `call_type` default from `"ai_voice"` to `"outbound"` to match schema constraint
- Updated `get_call_by_session()` to search in notes instead of a column

**Schema Constraint:**
- `call_type` must be one of: `'inbound'`, `'outbound'`, `'callback'`, `'voicemail'`

### 2. Fixed `crm_connector.py`

**Changes:**
- Removed `authority`, `budget`, `need`, `timeline` from being sent as separate fields
- These BANT fields are now stored in `notes` and `progress_details` (via `_build_notes()`)
- Changed `call_type` in `start_call_tracking()` from `"ai_voice"` to `"outbound"`

### 3. Fixed `leads_api.py`

**Changes:**
- Added field filtering in `update_lead()` to only include valid columns
- Filters out: `authority`, `budget`, `need`, `timeline`, `conversation_summary`, `extracted_info`, `company_name`, `company_size`, `location`
- These fields are either:
  - Used for client creation (`company_name`, `company_size`, `location`)
  - Stored in notes (`authority`, `budget`, `need`, `timeline`)
  - Not part of the schema (`conversation_summary`, `extracted_info`)

## Valid Leads Table Columns

The following columns are valid in the `leads` table:
- `id`, `client_id`, `agent_id`, `status_bucket`, `lead_score`, `qualification_status`
- `campaign_id`, `utm_source`, `utm_medium`, `utm_campaign`, `referrer_url`
- `first_touch_date`, `last_touch_date`, `progress_details`, `next_step`, `lead_source`
- `contact_person`, `email`, `phone`, `deal_value`, `tags`, `follow_up_due_date`
- `sync_lock`, `notes`, `pipeline_stage_id`, `expected_close_date`, `win_probability`
- `lost_reason`, `industry`, `created_at`, `updated_at`

## Valid Calls Table Columns

The following columns are valid in the `calls` table:
- `id`, `lead_id`, `user_id`, `duration`, `call_type`, `outcome`, `notes`
- `call_start_time`, `created_at`, `updated_at`

## Testing

After these fixes:
- ✅ Lead creation works correctly
- ✅ Lead updates work without schema errors
- ✅ Call tracking works (session_id stored in notes)
- ✅ BANT information preserved in notes/progress_details

## Notes

- `session_id` is now stored in call notes as `[Session: {session_id}]` for tracking
- BANT fields (`authority`, `budget`, `need`, `timeline`) are stored in the `notes` field via `_build_notes()`
- `company_name`, `company_size`, `location` are used for client creation but filtered out in lead updates

