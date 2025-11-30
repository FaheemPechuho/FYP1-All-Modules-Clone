# 🐛 Lead Creation Bug Fixes

## Summary
Fixed critical issues where the sales agent was attempting to create leads in the CRM **before gathering sufficient information**, causing database errors and null value violations.

## Issues Fixed

### ❌ **Problem 1: Lead Scorer NoneType Error**
**Error**: `'NoneType' object has no attribute 'lower'`
**Location**: `agents/sales_agent/lead_scorer.py:181`

**Root Cause**: 
- The `company_size` field could be `None`
- Attempting to call `.lower()` on `None` caused AttributeError

**Fix**:
```python
# BEFORE (line 181)
company_size = lead_info.get("company_size", "").lower()

# AFTER
company_size = lead_info.get("company_size")
if company_size:
    company_size_str = str(company_size).lower()
    # ... process it safely
```

---

### ❌ **Problem 2: Creating Leads Without Required Information**
**Error**: `null value in column "client_name" of relation "clients" violates not-null constraint`
**Location**: Agent was calling `create_or_update_lead` too early

**Root Cause**:
- Agent tried to create CRM records after the **first message** ("Hi, I'm looking for a CRM solution")
- No company name or contact person had been collected yet
- TrendtialCRM requires `client_name` (company_name) for client creation

**Fix 1 - Enhanced Validation** (`agents/sales_agent/agent.py`):
```python
def _should_update_crm(self, qualification_result, score_breakdown) -> bool:
    """
    IMPORTANT: Only create leads when we have minimum required information!
    """
    extracted_info = qualification_result.get("extracted_info", {})
    
    # CRITICAL: Must have at least company_name OR contact_person
    company_name = extracted_info.get("company_name")
    contact_person = extracted_info.get("contact_person") or extracted_info.get("name")
    
    has_company_or_contact = bool(company_name or contact_person)
    
    if not has_company_or_contact:
        logger.debug("Not updating CRM: Missing company_name and contact_person")
        return False  # ⛔ Don't create lead yet!
    
    # ... rest of qualification checks
```

**Fix 2 - Safety Fallback** (`agents/sales_agent/crm_connector.py`):
```python
def _prepare_lead_data(...) -> Optional[Dict[str, Any]]:
    # CRITICAL: Ensure we have minimum required data
    company_name = merged_info.get("company_name")
    contact_person = merged_info.get("contact_person") or merged_info.get("name")
    
    # If no company_name, use contact_person as company name
    if not company_name and contact_person:
        company_name = f"{contact_person}'s Company"
        logger.warning(f"No company_name provided, using fallback: {company_name}")
    elif not company_name and not contact_person:
        logger.error("Cannot create lead: Missing both company_name and contact_person")
        return None  # ⛔ Abort lead creation!
    
    # ... build lead_data
```

**Fix 3 - Null Check** (`agents/sales_agent/crm_connector.py`):
```python
def create_or_update_lead(...):
    lead_data = self._prepare_lead_data(...)
    
    # Safety check: If lead_data preparation failed, don't proceed
    if lead_data is None:
        logger.error("Lead data preparation failed - insufficient information")
        return None
    
    # ... proceed with creation/update
```

---

## When Will Leads Be Created Now?

Leads will **only** be created when:

1. ✅ We have **company_name** OR **contact_person**
   - *Agent must extract at least one of these from conversation*

2. ✅ **AND** one of these conditions:
   - Lead score ≥ 30 (shows meaningful engagement)
   - Qualification status is not "unqualified"
   - We have company/contact + email/phone

## Expected Behavior

### ❌ Before Fix
```
User: "Hi, I'm looking for a CRM solution."
Agent: *Immediately tries to create lead*
Result: ERROR - null value in column "client_name"
```

### ✅ After Fix
```
User: "Hi, I'm looking for a CRM solution."
Agent: *Qualifies as "marketing_qualified"*
Agent: *Checks: No company_name, no contact_person*
Agent: *Skips CRM creation* ⏭️
Agent: Asks qualifying questions to gather info

User: "My name is John Smith from Acme Corp"
Agent: *Extracts: company_name="Acme Corp", contact_person="John Smith"*
Agent: *Checks: Has both - OK to proceed!* ✅
Agent: *Creates lead in CRM successfully*
```

## Debug Logs Added

You'll now see helpful debug messages:

```
✅ "Updating CRM: Lead score 45 >= 30"
✅ "Updating CRM: Qualified as sales_qualified"
✅ "Updating CRM: Has company/contact + contact method"
⚠️  "Not updating CRM: Missing company_name and contact_person"
⚠️  "Not updating CRM: Insufficient information collected"
❌ "Cannot create lead: Missing both company_name and contact_person"
```

## Testing

Test with these conversation flows:

### Test 1: Early Stage (No Info)
```
User: "Hi, tell me about your product"
Expected: No CRM creation (insufficient info)
```

### Test 2: Name Provided
```
User: "Hi, I'm Sarah from TechStart"
Expected: CRM lead created with company="TechStart", contact="Sarah"
```

### Test 3: Name Only, No Company
```
User: "Hi, I'm Michael"
Expected: CRM lead created with fallback company="Michael's Company"
```

### Test 4: High Engagement
```
User: *Asks 5+ questions about features*
Agent: *Lead score reaches 40*
Expected: CRM lead created (score ≥ 30 threshold)
```

## Files Modified

1. ✅ `clara-backend/agents/sales_agent/lead_scorer.py`
   - Fixed NoneType error on `company_size.lower()`

2. ✅ `clara-backend/agents/sales_agent/agent.py`
   - Enhanced `_should_update_crm()` with stricter validation
   - Added detailed debug logging

3. ✅ `clara-backend/agents/sales_agent/crm_connector.py`
   - Added safety checks in `_prepare_lead_data()`
   - Added null check in `create_or_update_lead()`
   - Changed return type to `Optional[Dict[str, Any]]`

---

## 🧪 Next Steps

1. **Test the Voice Agent**:
   ```bash
   cd clara-backend
   python test_voice_manual.py
   ```

2. **Try these test conversations**:
   - "Hi, I'm looking for a CRM" ➡️ Should NOT create lead
   - "Hi, I'm John from Acme Corp" ➡️ Should create lead

3. **Check the logs** for debug messages showing CRM decision logic

4. **Verify in Supabase Dashboard**:
   - Open your Supabase project
   - Go to Table Editor → `clients` and `leads`
   - Verify no null/incomplete records are created

---

## 🎉 Result

✅ No more null value errors  
✅ Leads only created with sufficient information  
✅ Better conversation flow (gather info first)  
✅ Clear debug logging for troubleshooting

