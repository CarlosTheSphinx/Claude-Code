# Quick Reference - Josie Receptionist Agent

## 📁 Which File Do I Need?

| If you need... | Use this file |
|----------------|---------------|
| **Import directly into Retell AI** | `config/agents/josie-receptionist-retell-import.json` |
| **Understand the full specification** | `config/agents/josie-receptionist-agent.json` |
| **Implementation instructions** | `RETELL-IMPLEMENTATION-GUIDE.md` |
| **General overview** | `README.md` |

---

## ⚡ Quick Start (Retell AI)

1. **Download**: `config/agents/josie-receptionist-retell-import.json`

2. **Before Import - Update These**:
   - Line 524: Change transfer phone number from `+1234567890` to your actual number
   - Line 15: Optionally change voice from `11labs-Jessica` to your preferred voice

3. **Import**:
   - Retell Dashboard → Agents → Import from JSON
   - Upload the file
   - Assign a phone number
   - Test with a call

4. **Done!** Agent is ready to take calls.

---

## 📊 Data Collected

### For DSCR Loans (11 fields):
1. Property address (street, city, state, zip)
2. Number of units
3. Transaction type (purchase/refinance)
4. Purchase price OR current value + cash-out
5. Occupancy status
6. Total monthly rent
7. Monthly property taxes
8. Monthly insurance
9. Estimated credit score
10. Contact info (name, phone, email)
11. Additional notes

### For RTL Loans (6 fields):
1. Property address (street, city, state, zip)
2. Number of units
3. Purchase price or current value
4. Renovation/construction budget
5. After Repair Value (ARV)
6. Contact info (name, phone, email)
7. Additional notes

### For All Calls:
- Call type classification
- Loan type determination
- Intake completeness flag
- Human transfer request flag

---

## 🔀 Conversation Flow Map

```
📞 INBOUND CALL
    ↓
┌───────────────────────────────────────┐
│ "Are you calling about a new deal?"  │
└───────────┬───────────────────────────┘
            │
    ┌───────┴───────┐
    │               │
   YES             NO
    │               │
    ↓               ↓
[Classify]    [Message Capture]
    │               │
    ↓               └──→ End
DSCR or RTL?
    │
┌───┴────┐
│        │
DSCR    RTL
│        │
├─ Address          ├─ Address
├─ Units            ├─ Units
├─ Purchase/Refi    ├─ Price/Value
├─ Financials       ├─ Rehab Budget
├─ Occupancy        └─ ARV
├─ Rent/Expenses         │
└─ Credit Score          │
     │                   │
     └───────┬───────────┘
             │
             ↓
      [Contact Info]
             │
             ↓
    [Confirmation/Notes]
             │
             ↓
        [Closing]
             │
             ↓
          [End]

🔀 GLOBAL ESCAPE ROUTE:
   "I want to speak to a human"
            ↓
      [Transfer Call]
```

---

## 🎯 Key Features

### ✅ Intelligent Classification
- Automatically determines DSCR vs RTL based on caller's description
- Handles mixed signals with clarifying questions
- Redirects vacant DSCR properties to RTL if renovation involved

### ✅ Data Validation
- Requires complete address including zip code
- Repeats back all critical financial figures
- Accepts estimates but marks them explicitly
- Never invents missing data

### ✅ Adaptive Behavior
- Switches to essentials-only if caller is rushed
- Handles poor audio by simplifying questions
- Immediately transfers to human if requested
- De-escalates upset callers

### ✅ Professional Touch
- 24-hour follow-up promise
- Warm, natural conversational style
- Clear AI disclosure upfront
- Helpful loan coordinator tone (not salesperson)

---

## 🔧 Common Customizations

### Change Greeting
**Location**: Node `start-node-greeting` instruction
```json
"text": "Hi, this is Josie. I'm an AI assistant for Sphinx Capital..."
```

### Adjust LTV/LTC Guidance
**Location**: Global prompt section
```
- DSCR: ~80% LTV (line 35)
- RTL: ~85% LTC (line 36)
```

### Modify Call Duration
**Location**: Line 16
```json
"max_call_duration_ms": 900000  // 15 minutes
```

### Change Voice
**Location**: Line 15
```json
"voice_id": "11labs-Jessica"
```
Options: Jessica, Charlie, Rachel, Chloe, or custom

### Update Transfer Number
**Location**: Line 524
```json
"number": "+1234567890"  // ← MUST CHANGE
```

---

## 📈 Success Metrics

### Target KPIs
- **Intake Completion**: >80% complete
- **Human Transfer Rate**: <15%
- **Average Call Duration**: 5-7 minutes (DSCR), 4-6 minutes (RTL)
- **Data Accuracy**: >95% valid fields

### Monitor These
- Missing field frequency (optimize prompts)
- Transfer trigger reasons (improve handling)
- Call abandonment rate (check voice/pace)
- Caller sentiment (ensure positive experience)

---

## ⚠️ Pre-Launch Checklist

**Must Do Before Going Live**:
- [ ] Update transfer phone number to real loan officer
- [ ] Test all loan types (DSCR purchase, DSCR refi, RTL)
- [ ] Test human transfer request
- [ ] Verify webhook integration working
- [ ] Configure CRM/LOS data mapping
- [ ] Train team on handling transfers
- [ ] Test with background noise
- [ ] Verify call recording compliance
- [ ] Set up monitoring dashboard
- [ ] Document escalation procedures

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Transfer not working | Check E.164 format: `+1XXXXXXXXXX` |
| Missing data fields | Review transcript - was question asked? |
| Agent too slow | Increase `interruption_sensitivity` to 0.9 |
| Agent too fast | Decrease `interruption_sensitivity` to 0.7 |
| Wrong loan type | Add keywords to classification node |
| Caller confused | Simplify node instruction text |

---

## 📞 Example Call Flows

### Happy Path - DSCR Purchase
1. ✅ Caller confirms new deal
2. ✅ Describes rental property
3. ✅ Classified as DSCR
4. ✅ Provides complete address with zip
5. ✅ Says it's 4 units
6. ✅ Confirms purchase at $500k
7. ✅ Property is rented, $6k/month
8. ✅ Provides tax/insurance estimates
9. ✅ Estimates 720 credit score
10. ✅ Gives contact info
11. ✅ Confirms all details
12. ✅ Receives 24-hour follow-up promise
13. ✅ Call ends professionally

**Result**: Complete intake, loan officer can quote immediately

### Edge Case - Rushed Caller
1. ✅ Caller confirms new deal but says "I'm in a rush"
2. ✅ Agent adapts: "Let me grab the essentials"
3. ✅ Collects only: address, loan type, contact info
4. ✅ Marks other fields as "to be determined"
5. ✅ Promises follow-up call

**Result**: Minimal intake captured, flagged for follow-up

### Escalation - Wants Human
1. ✅ Caller says "I want to talk to a real person"
2. ✅ Agent: "I completely understand. Transferring now."
3. ✅ Warm transfer to loan officer
4. ✅ (If transfer fails) Agent captures info for callback

**Result**: Immediate human assistance

---

## 🔗 Quick Links

- **Retell Dashboard**: [https://retell.ai/dashboard](https://retell.ai/dashboard)
- **Import File**: `config/agents/josie-receptionist-retell-import.json`
- **Full Guide**: `RETELL-IMPLEMENTATION-GUIDE.md`
- **Retell Docs**: [https://docs.retell.ai](https://docs.retell.ai)

---

## 💡 Pro Tips

1. **Test Early, Test Often**: Use Retell's test call feature extensively
2. **Monitor First Week Closely**: Review all transcripts and adjust prompts
3. **Start Conservative**: Use lower interruption sensitivity (0.7) initially
4. **Iterate Prompts**: Based on real call data, refine node instructions
5. **Train Your Team**: Ensure loan officers know what data is collected
6. **Have Backup**: Always have human fallback ready
7. **Track Metrics**: Set up analytics from day one

---

**Version**: 1.0.0
**Last Updated**: 2026-01-09
**Optimized For**: Retell AI Platform

🚀 **Ready to deploy your AI receptionist!**
