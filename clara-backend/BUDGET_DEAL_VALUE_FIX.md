# Budget/Deal Value Storage Fix

## Problem

The budget amount mentioned in conversations (e.g., "ten thousand dollars", "$10k") was not being stored in the CRM's `deal_value` field. The system was only extracting qualitative budget assessment (low/medium/high) but not the actual numeric amount.

## Root Cause

1. **Missing Budget Extraction**: The prompt didn't ask for the numeric budget amount, only the qualitative assessment
2. **No Budget Parsing**: No function to parse budget amounts from various formats (written numbers, currency, etc.)
3. **Deal Value Not Set**: The `deal_value` field was looking for `deal_value` or `expected_value` in extracted_info, but these were never extracted

## Solution

### 1. Updated Prompt to Extract Budget Amount

**File**: `clara-backend/agents/sales_agent/prompts.py`

Added `budget_amount` field to `extracted_info`:
```json
"budget_amount": "numeric value in dollars (e.g., 10000 for $10k or 'ten thousand dollars') or null"
```

Added instructions to extract numeric budget values from various formats.

### 2. Added Budget Parsing Function

**File**: `clara-backend/agents/sales_agent/crm_connector.py`

Created `_parse_budget_amount()` function that handles:
- **Numeric strings**: "10000", "10,000" → 10000
- **Currency formats**: "$10,000", "$10k", "10k" → 10000
- **Written numbers**: "ten thousand", "ten thousand dollars" → 10000
- **Multipliers**: Handles "k" (thousands) and "m" (millions) suffixes

### 3. Updated Deal Value Assignment

Changed from:
```python
"deal_value": merged_info.get("deal_value") or merged_info.get("expected_value"),
```

To:
```python
"deal_value": self._parse_budget_amount(
    merged_info.get("budget_amount") or 
    merged_info.get("deal_value") or 
    merged_info.get("expected_value")
),
```

### 4. Enhanced Notes with Budget

Updated `_build_notes()` to include formatted budget amount in notes:
- "$10k" for amounts >= $1,000
- "$1.5M" for amounts >= $1,000,000
- "$500" for smaller amounts

## Supported Budget Formats

The parser now handles:
- ✅ "$10,000" → 10000
- ✅ "$10k" or "10k" → 10000
- ✅ "ten thousand dollars" → 10000
- ✅ "10000" → 10000
- ✅ "10,000" → 10000
- ✅ "$1.5M" → 1500000
- ✅ Numeric values (int/float) → passed through

## Testing

After this fix:
- ✅ Budget amounts mentioned in conversation are extracted
- ✅ Budget is parsed from various formats
- ✅ `deal_value` is stored in CRM
- ✅ Budget is visible in lead notes

## Example

**Before:**
- User says: "My budget is around ten thousand dollars"
- Extracted: Only BANT assessment `budget: "medium"`
- Stored: `deal_value: null`

**After:**
- User says: "My budget is around ten thousand dollars"
- Extracted: `budget_amount: 10000` (or "ten thousand")
- Parsed: `10000.0`
- Stored: `deal_value: 10000.0`
- Notes: `"Budget: $10k | BANT: Budget: medium, ..."`

