# Retell AI Implementation Guide - Josie Receptionist Agent

## 📋 Quick Start

This guide will help you import and configure the Josie receptionist agent in Retell AI.

## 📁 File to Import

**File**: `config/agents/josie-receptionist-retell-import.json`

This is the Retell AI-compatible configuration ready for direct import.

---

## 🚀 Step-by-Step Import Instructions

### Step 1: Access Retell Dashboard

1. Log in to your Retell AI dashboard at [https://retell.ai](https://retell.ai)
2. Navigate to **Agents** section

### Step 2: Create New Agent

1. Click **"Create New Agent"** or **"Import Agent"**
2. Select **"Import from JSON"** option
3. Upload the file: `josie-receptionist-retell-import.json`

### Step 3: Critical Customizations Required

Before activating the agent, you **MUST** customize these fields:

#### ⚠️ Required Changes

1. **Transfer Phone Number** (Line 524)
   ```json
   "transfer_destination": {
     "type": "predefined",
     "number": "+1234567890"  // ← CHANGE THIS to your loan officer's phone
   }
   ```

   **Action**: Replace `+1234567890` with your actual transfer number in E.164 format (e.g., `+14155551234`)

2. **Voice Selection** (Line 15)
   ```json
   "voice_id": "11labs-Jessica"
   ```

   **Options**:
   - Keep `11labs-Jessica` for professional female voice
   - Or choose from Retell's voice library:
     - `11labs-Charlie` - Professional male
     - `11labs-Rachel` - Warm female
     - `11labs-Chloe` - Friendly female
     - Custom voice IDs from your account

3. **Agent ID** (Line 2)
   ```json
   "agent_id": ""
   ```

   **Action**: Leave blank on import - Retell will auto-generate, or provide your own unique ID

#### Optional Customizations

4. **Call Duration** (Line 16)
   ```json
   "max_call_duration_ms": 900000  // 15 minutes
   ```

   Adjust as needed (value in milliseconds)

5. **Interruption Sensitivity** (Line 17)
   ```json
   "interruption_sensitivity": 0.9
   ```

   Range: 0.0 (never interrupt) to 1.0 (interrupt easily)
   - 0.9 = Very responsive (recommended for intake)
   - 0.7 = Balanced
   - 0.5 = Let agent finish more often

---

## 🎯 Post-Import Configuration

### Webhook Configuration (Recommended)

Set up webhooks to send collected data to your CRM/LOS:

1. Go to **Agent Settings** → **Webhooks**
2. Add webhook URL for your system
3. Configure to send `post_call_analysis_data`
4. Test webhook with a sample call

**Webhook Payload** will include all fields defined in `post_call_analysis_data` (lines 18-151):
- Contact information (name, phone, email)
- Property details (address, units)
- Loan specifics (type, transaction, financials)
- Call metadata (intake completeness, human request)

### Phone Number Assignment

1. Navigate to **Phone Numbers** in Retell dashboard
2. Purchase or assign a phone number
3. Link it to the "Josie - Sphinx Capital Receptionist" agent
4. Test with an inbound call

### Call Recording Settings

By default, `data_storage_setting` is set to `"everything"` (line 13), which means:
- All calls are recorded
- All transcripts are saved
- All post-call analysis is stored

**To modify**: Change to `"metadata_only"` or `"none"` based on your privacy requirements.

---

## 📊 Understanding the Conversation Flow

The agent follows this conversation structure:

```
START: Greeting and Intent
    ├─→ NEW DEAL → Deal Type Classification
    │                ├─→ DSCR Loan Path
    │                │    ├─→ Property Address
    │                │    ├─→ Units
    │                │    ├─→ Transaction Type (Purchase/Refi)
    │                │    ├─→ Financials (based on transaction)
    │                │    ├─→ Occupancy Status
    │                │    ├─→ Rent & Expenses
    │                │    └─→ Credit Score
    │                │
    │                └─→ RTL Loan Path
    │                     ├─→ Property Address
    │                     ├─→ Units
    │                     ├─→ Purchase Price/Value
    │                     ├─→ Renovation Budget
    │                     └─→ After Repair Value (ARV)
    │
    └─→ NOT NEW DEAL → Non-Deal Message Capture
                        └─→ Non-Deal Close

ALL PATHS CONVERGE:
    → Contact Information
    → Confirmation & Notes
    → Closing & Expectation Setting
    → END

GLOBAL ESCAPE:
    → Transfer to Human (triggered anytime by user request)
```

### Global Transfer Node

The **"Transfer to Human"** node (lines 520-542) is globally accessible from any point in the conversation when:
- Caller explicitly requests human
- Caller refuses AI assistance
- Caller is upset or angry
- Situation is beyond agent capability

---

## 🔧 Conversation Flow Customization

### Editing Node Instructions

Each node has an `instruction` field with a `text` prompt. You can customize these to:

**Example: Change greeting** (lines 101-107)
```json
"instruction": {
  "type": "prompt",
  "text": "Greet the caller warmly and professionally:\n\n\"Hi, this is Josie. I'm an AI assistant for Sphinx Capital. Are you calling about a new deal today?\"\n\nBe warm, clear, and disclose you're an AI assistant upfront."
}
```

**To customize**:
1. Find the node by name in the `nodes` array
2. Edit the `text` field within `instruction`
3. Keep the conversational guidance (e.g., "Be warm, clear...")

### Adding/Removing Data Collection Steps

To add a new question:

1. Create a new conversation node
2. Add it to the `nodes` array
3. Update the `edges` of the previous node to point to your new node
4. Add corresponding field to `post_call_analysis_data`

**Example**: Adding "Desired Loan Amount" question:

```json
{
  "instruction": {
    "type": "prompt",
    "text": "Ask: \"What loan amount are you looking for?\"\n\nRepeat back for confirmation."
  },
  "name": "Desired Loan Amount",
  "edges": [
    {
      "condition": "After collecting loan amount",
      "id": "edge-loan-amount-to-next",
      "transition_condition": {
        "type": "prompt",
        "prompt": "After collecting desired loan amount"
      },
      "destination_node_id": "node-next-step"
    }
  ],
  "id": "node-loan-amount",
  "type": "conversation",
  "display_position": {
    "x": 3200,
    "y": 300
  }
}
```

Then add to `post_call_analysis_data`:
```json
{
  "name": "desired_loan_amount",
  "description": "Desired loan amount from borrower",
  "type": "number"
}
```

---

## 📈 Post-Call Analysis Data Reference

All data extracted from calls:

| Field Name | Type | Description | Used For |
|------------|------|-------------|----------|
| `call_type` | enum | new_deal / existing_loan / general_inquiry / other | Routing |
| `loan_type` | enum | DSCR / RTL / Unknown | Product classification |
| `transaction_type` | enum | purchase / refinance / not_applicable | Deal structure |
| `caller_name` | string | Full name | Contact |
| `caller_phone` | string | Phone number | Contact |
| `caller_email` | string | Email address | Contact |
| `property_street` | string | Street address | Property ID |
| `property_city` | string | City | Property ID |
| `property_state` | string | State | Property ID |
| `property_zip` | string | Zip code | Property ID |
| `number_of_units` | number | Unit count | Underwriting |
| `purchase_price` | number | Purchase price (if purchase) | DSCR Underwriting |
| `estimated_current_value` | number | Current value (if refi) | DSCR Underwriting |
| `desired_cashout_amount` | number | Cash out amount (if refi) | DSCR Underwriting |
| `has_purchase_contract` | enum | Yes / No / Not asked | DSCR Underwriting |
| `occupancy_status` | string | Occupancy description | DSCR Underwriting |
| `total_monthly_rent` | number | Total rent | DSCR Underwriting |
| `monthly_property_taxes` | number | Monthly taxes | DSCR Underwriting |
| `monthly_insurance` | number | Monthly insurance | DSCR Underwriting |
| `estimated_middle_credit_score` | number | Credit score | DSCR Underwriting |
| `renovation_construction_budget` | number | Rehab budget | RTL Underwriting |
| `after_repair_value` | number | ARV | RTL Underwriting |
| `additional_notes` | string | Special circumstances | Context |
| `intake_complete` | enum | Complete / Partial / Minimal | Quality flag |
| `caller_requested_human` | enum | Yes / No | Escalation flag |
| `reason_for_call_non_deal` | string | Non-deal call reason | Routing |

---

## 🧪 Testing Your Agent

### Pre-Launch Testing Checklist

- [ ] **Test 1: Standard DSCR Purchase**
  - Call the agent
  - Say you're calling about a new deal
  - Describe a rental property purchase
  - Provide complete information
  - Verify all data is captured

- [ ] **Test 2: Standard RTL Fix & Flip**
  - Call the agent
  - Say you're calling about a fix and flip
  - Provide renovation project details
  - Verify RTL-specific fields are captured

- [ ] **Test 3: DSCR Refinance**
  - Call about refinance
  - Provide current value and cash-out amount
  - Verify refinance path is taken

- [ ] **Test 4: Rushed Caller**
  - Start intake normally
  - Say "I'm in a rush, can we make this quick?"
  - Verify agent adapts and gets essentials

- [ ] **Test 5: Request Human Transfer**
  - At any point say "I want to speak to a real person"
  - Verify immediate, graceful transfer

- [ ] **Test 6: Non-Deal Call**
  - Say you're calling about an existing loan
  - Verify message capture flow

- [ ] **Test 7: Incomplete Information**
  - Refuse to provide some details (e.g., credit score)
  - Say "I don't know" to financial questions
  - Verify agent accepts and marks as unknown

- [ ] **Test 8: Vacant Property on DSCR Request**
  - Request DSCR loan
  - Mention property is vacant
  - Verify agent suggests RTL if renovation involved

### Using Retell's Testing Tools

1. **Test Call Feature**: Use Retell's built-in test call feature
   - Go to Agent → Test
   - Click "Start Test Call"
   - Speak naturally through various scenarios

2. **Transcript Review**: After each test call
   - Review full transcript
   - Check `post_call_analysis_data` extraction
   - Verify all fields populated correctly

3. **Edge Case Testing**: Test with:
   - Background noise
   - Unclear speech
   - Long pauses
   - Interruptions
   - Multiple property inquiries in one call

---

## 🔐 Privacy & Compliance

### Data Handling

The agent is configured to:
- ✅ Collect: Names, addresses, financial info, property details
- ❌ NOT collect: SSN, bank accounts, passwords, full credit card numbers

### Call Recording Compliance

Ensure you comply with local recording laws:
- **One-party consent states**: Generally OK
- **Two-party consent states**: May need explicit consent notification

**Recommendation**: Add to greeting if required in your jurisdiction:
```
"This call may be recorded for quality assurance and training purposes."
```

### TCPA Compliance

For outbound calls (if applicable):
- Ensure prior express consent
- Maintain Do Not Call list
- Provide opt-out mechanism

---

## 🛠️ Troubleshooting

### Issue: Agent Not Transferring Properly

**Solution**:
1. Verify transfer number is in E.164 format: `+1XXXXXXXXXX`
2. Check number is registered and active in Retell
3. Test transfer node separately

### Issue: Missing Data in Post-Call Analysis

**Solution**:
1. Check if caller actually provided the information
2. Review transcript to see if agent asked the question
3. Verify field name matches exactly in webhook payload
4. Check data type (string vs. number mismatch)

### Issue: Agent Too Slow / Too Fast

**Solution**:
1. Adjust `interruption_sensitivity`:
   - Higher (0.9) = More responsive
   - Lower (0.5) = Let agent finish speaking
2. Edit node instructions to be more/less verbose
3. Consider voice selection (some voices speak faster)

### Issue: Agent Misclassifying Loan Type

**Solution**:
1. Review `node-deal-classification` instruction (lines 190-246)
2. Add more specific keywords to classification logic
3. Test with explicit clarification questions
4. Consider adding a confirmation step

### Issue: Caller Provides Info in Wrong Order

**Solution**:
This is expected behavior. The agent will:
- Accept information whenever provided
- Still ask for missing fields in sequence
- Gracefully handle out-of-order responses

If problematic, adjust `global_prompt` to mention:
```
"Accept information in any order the caller provides it. Don't re-ask for information already given."
```

---

## 📞 Integration with Your Systems

### CRM Integration via Webhook

Example webhook payload structure:

```json
{
  "call_id": "call_abc123",
  "agent_id": "agent_josie_v1",
  "call_type": "inbound",
  "start_timestamp": "2026-01-09T10:30:00Z",
  "end_timestamp": "2026-01-09T10:35:30Z",
  "duration_ms": 330000,
  "transcript": "Full call transcript here...",
  "recording_url": "https://retell.ai/recordings/abc123.mp3",
  "analysis_data": {
    "call_type": "new_deal",
    "loan_type": "DSCR",
    "transaction_type": "purchase",
    "caller_name": "John Smith",
    "caller_phone": "5555551234",
    "caller_email": "john@example.com",
    "property_street": "123 Main St",
    "property_city": "Austin",
    "property_state": "TX",
    "property_zip": "78701",
    "number_of_units": 4,
    "purchase_price": 500000,
    "total_monthly_rent": 6000,
    "monthly_property_taxes": 800,
    "monthly_insurance": 200,
    "estimated_middle_credit_score": 720,
    "additional_notes": "Property is currently under contract",
    "intake_complete": "Complete",
    "caller_requested_human": "No"
  }
}
```

### Mapping to Your LOS

Create a mapping layer in your webhook handler:

```javascript
// Example webhook handler
app.post('/webhook/retell-intake', (req, res) => {
  const data = req.body.analysis_data;

  // Map to your LOS fields
  const losPayload = {
    borrower: {
      firstName: data.caller_name.split(' ')[0],
      lastName: data.caller_name.split(' ').slice(1).join(' '),
      phone: data.caller_phone,
      email: data.caller_email,
      creditScore: data.estimated_middle_credit_score
    },
    property: {
      street: data.property_street,
      city: data.property_city,
      state: data.property_state,
      zip: data.property_zip,
      units: data.number_of_units
    },
    loan: {
      product: data.loan_type === 'DSCR' ? 'rental_loan' : 'bridge_loan',
      purpose: data.transaction_type,
      amount: data.purchase_price || data.estimated_current_value,
      // ... additional mappings
    },
    notes: data.additional_notes,
    source: 'retell_ai_josie'
  };

  // Send to your LOS
  sendToLOS(losPayload);

  res.status(200).send('OK');
});
```

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **Intake Completion Rate**
   - Track `intake_complete` field
   - Target: >80% "Complete"

2. **Human Transfer Rate**
   - Track `caller_requested_human` field
   - Target: <15% (lower is better, indicates AI acceptance)

3. **Average Call Duration**
   - DSCR calls: ~5-7 minutes expected
   - RTL calls: ~4-6 minutes expected
   - Non-deal: ~2-3 minutes expected

4. **Missing Data Fields**
   - Track which fields are most often null/unknown
   - Optimize prompts for frequently missed fields

5. **Call Volume by Type**
   - Track distribution of DSCR vs RTL vs non-deal
   - Adjust marketing/routing accordingly

### Retell Dashboard Analytics

Access built-in analytics:
1. Go to **Analytics** → **Agent Performance**
2. Review:
   - Total calls handled
   - Success rate
   - Average duration
   - Transfer rate
   - Sentiment analysis

---

## 🚀 Going Live Checklist

Before activating for production:

- [ ] Transfer phone number updated to real loan officer
- [ ] Voice selection tested and approved
- [ ] All test scenarios passed
- [ ] Webhook configured and tested
- [ ] CRM/LOS integration working
- [ ] Phone number purchased and assigned
- [ ] Call recording compliance verified
- [ ] Team trained on handling transferred calls
- [ ] Escalation procedures documented
- [ ] Monitoring dashboard set up
- [ ] Business hours configured (if applicable)
- [ ] Backup/failover plan in place

---

## 📚 Additional Resources

- **Retell AI Documentation**: [https://docs.retell.ai](https://docs.retell.ai)
- **Conversation Flow Guide**: [https://docs.retell.ai/conversation-flow](https://docs.retell.ai/conversation-flow)
- **Webhook Integration**: [https://docs.retell.ai/webhooks](https://docs.retell.ai/webhooks)
- **Voice Library**: [https://docs.retell.ai/voices](https://docs.retell.ai/voices)

---

## 🆘 Support

For Retell AI platform issues:
- Email: support@retell.ai
- Documentation: https://docs.retell.ai
- Community: Retell AI Discord/Slack

For this configuration:
- Review the comprehensive configuration docs in `README.md`
- Check the original detailed spec in `josie-receptionist-agent.json`

---

## 🔄 Version History

- **v1.0.0** (2026-01-09): Initial Retell AI import configuration
  - Full conversation flow with 20+ nodes
  - 26 post-call analysis data fields
  - DSCR and RTL loan paths
  - Global transfer node for human escalation
  - Complete intake validation and confirmation

---

**Ready to Import!** 🎉

You're all set to import `josie-receptionist-retell-import.json` into Retell AI and start capturing qualified leads for Sphinx Capital.
