# Josie - Sphinx Capital Receptionist Agent Configuration

## Overview

This repository contains the complete JSON configuration for **Josie**, an AI-powered inbound receptionist agent for Sphinx Capital, a private real estate lending company. Josie handles incoming calls, qualifies leads, and collects detailed intake information for loan originators.

## 🚀 Quick Start

### For Retell AI Users (RECOMMENDED)

**Use this file**: `config/agents/josie-receptionist-retell-import.json`

This is the production-ready Retell AI configuration. Simply:
1. Import into Retell dashboard
2. Update transfer phone number (line 524)
3. Assign a phone number
4. Start taking calls!

📖 **Full instructions**: See [RETELL-IMPLEMENTATION-GUIDE.md](RETELL-IMPLEMENTATION-GUIDE.md)
⚡ **Quick reference**: See [QUICK-REFERENCE.md](QUICK-REFERENCE.md)

### For Documentation/Planning

**Use this file**: `config/agents/josie-receptionist-agent.json`

This is the comprehensive specification document with detailed explanations, fallback behaviors, and implementation notes. Use this to understand the complete system design.

## Product Lines Supported

### 1. DSCR (Debt Service Coverage Ratio) Loans
- **Purpose**: Long-term 30-year financing for rental properties
- **Typical LTV**: ~80% on purchases
- **Requirements**: Property must be occupied, rent data required

### 2. RTL (Residential Transition Loans)
- **Purpose**: Fix and flip, renovation, ground-up construction, value-add projects
- **Typical LTC**: ~85% loan-to-cost
- **Requirements**: Renovation budget and ARV required, occupancy not required

## File Structure

```
Claude-Code/
├── config/
│   └── agents/
│       ├── josie-receptionist-agent.json          # Comprehensive specification
│       └── josie-receptionist-retell-import.json  # Retell AI import file ⭐
├── README.md                                       # This file - overview
├── RETELL-IMPLEMENTATION-GUIDE.md                 # Detailed implementation guide
└── QUICK-REFERENCE.md                             # Quick reference card
```

⭐ = **Start here for Retell AI implementation**

## Configuration File

**Location**: `config/agents/josie-receptionist-agent.json`

### Key Features

#### 1. **Modular Conversation Flow**
The agent is structured into distinct modules that handle different stages of the conversation:

- **Module 1**: Greeting & Intent Confirmation
- **Module 1B**: Non-Deal Message Capture
- **Module 2**: Deal Type Classification (DSCR vs RTL)
- **Module 3A**: DSCR Property & Borrower Intake
- **Module 3B**: RTL Property & Project Intake
- **Module 4**: Confirmation & Notes Collection
- **Module 5**: Close & Expectation Setting
- **Module X**: Universal Fallback Layer (active across all modules)

#### 2. **Comprehensive Data Collection**

##### DSCR Required Fields:
- Full property address (street, city, state, zip)
- Number of units
- Transaction type (purchase/refinance)
- Purchase price OR current value + cash-out amount
- Occupancy status
- Total monthly rent
- Monthly property taxes
- Monthly insurance
- Estimated middle credit score
- Caller name and phone

##### RTL Required Fields:
- Full property address (street, city, state, zip)
- Number of units
- Purchase price or current value
- Renovation/construction budget
- After Repair Value (ARV)
- Caller name and phone

#### 3. **Intelligent Fallback Behaviors**

The configuration includes sophisticated fallback handling for:
- Caller rushed/distracted
- Poor audio quality
- Caller driving
- Caller refuses AI/wants human
- Caller upset or angry
- Caller refuses to provide information
- Incomplete address
- Caller rambles or goes off-topic
- Call disconnects early
- Missing data/unknowns

#### 4. **Data Validation & Accuracy**

- Address validation (requires all components including zip)
- Phone number validation (10-digit US format)
- Email format validation
- Currency validation (positive numbers, no negatives)
- Credit score validation (300-850 range)
- Repeat-back confirmation for critical numbers
- Explicit marking of unknown fields

#### 5. **Clear Boundaries**

The agent is configured to:
- ✅ Collect intake information
- ✅ Route to loan officers
- ✅ Provide general LTV/LTC guidance
- ❌ NOT provide binding quotes
- ❌ NOT provide final approvals
- ❌ NOT provide binding terms

## Conversational Design

### Voice Characteristics
- **Tone**: Friendly, natural, calm, professional
- **Pace**: Relaxed
- **Style**: Helpful loan coordinator (not salesperson, not robotic)
- **Pacing**: One question at a time
- **Confirmations**: "Perfect," "Got it," "That makes sense," "Thanks for that"

### Opening Script
```
"Hi, this is Josie. I'm an AI assistant for Sphinx Capital.
Are you calling about a new deal today?"
```

### Closing Script
```
"Awesome, thanks for walking through that with me. I'm submitting
this to your assigned loan officer now. They'll review it and
reach out within about 24 hours."
```

## Key Improvements Over Standard Configurations

### 1. **Comprehensive Edge Case Handling**
- Handles vacant properties on DSCR applications (redirects to RTL if renovation planned)
- Manages multifamily occupancy requirements (80%+ threshold)
- Gracefully handles missing data with explicit marking
- Rush/distraction modes with minimum viable intake

### 2. **Enhanced Data Validation**
- Multi-component address validation with explicit zip code requirement
- Confirmation protocols for all critical financial figures
- Range validation for credit scores
- Currency formatting rules

### 3. **Context-Aware Prompting**
- Conditional question flows based on transaction type
- Different validation rules for purchase vs refinance
- Product-specific information delivery (DSCR vs RTL)
- Occupancy-based routing logic

### 4. **Professional Escalation Paths**
- Immediate escalation when caller refuses AI
- De-escalation protocols for upset callers
- Respectful handling of information refusal
- Priority flagging for urgent callbacks

### 5. **Quality Assurance Framework**
- Call recording configuration
- Success metrics tracking
- Edge case flagging
- Continuous improvement logging

### 6. **Production-Ready Integration**
- Structured output format for CRM/LOS integration
- Complete call metadata capture
- Quality flags for incomplete intakes
- Handoff data structure specification

## Usage Instructions

### For Retell Platform

1. Import the JSON configuration into your Retell agent dashboard
2. Map the data fields to your CRM/Loan Origination System
3. Configure webhook endpoints for loan officer notifications
4. Set up call recording per compliance requirements
5. Monitor quality metrics and adjust as needed

### Data Output

The agent outputs structured JSON containing:
- Call metadata (ID, timestamp, duration)
- Classification (call type, loan type, transaction type)
- Contact information
- Property data
- Financial data (varies by loan type)
- Notes and special circumstances
- Quality flags

### Example Output Structure
```json
{
  "call_metadata": {
    "call_id": "unique_identifier",
    "timestamp": "2026-01-09T10:30:00Z",
    "duration": 420
  },
  "classification": {
    "call_type": "new_deal",
    "loan_type": "DSCR",
    "transaction_type": "purchase"
  },
  "contact_information": {
    "name": "John Smith",
    "phone": "5555551234",
    "email": "john@example.com"
  },
  "property_data": {
    "address": {
      "street": "123 Main St",
      "city": "Austin",
      "state": "TX",
      "zip": "78701"
    },
    "units": 4
  },
  "financial_data": {
    "purchase_price": 500000,
    "total_monthly_rent": 6000,
    "monthly_property_taxes": 800,
    "monthly_insurance": 200,
    "estimated_credit_score": 720
  },
  "quality_flags": {
    "complete_intake": true,
    "missing_fields": [],
    "requires_urgent_follow_up": false
  }
}
```

## Compliance & Privacy

### Data NOT Collected
- Social Security Numbers
- Bank account numbers
- Passwords
- Full credit card numbers

### Call Recording
- Enabled for quality assurance
- Disclosure timing: At beginning of call (if required by law)
- Retention: Per company policy

## Testing Scenarios

The configuration has been designed to handle:
- ✅ Standard DSCR purchase
- ✅ Standard DSCR refinance
- ✅ Standard RTL fix and flip
- ✅ Multifamily with vacancy issues
- ✅ Caller in a rush
- ✅ Poor connection quality
- ✅ Caller wants human immediately
- ✅ Incomplete information provided
- ✅ Non-deal inquiry routing

## Known Limitations

1. Cannot handle commercial loans outside of residential transition
2. Cannot provide binding quotes or approvals
3. Requires human escalation for existing loan servicing issues
4. Does not support non-English language calls (configuration is English-only)

## Monitoring & Optimization

### Recommended Metrics
- Complete intake capture rate
- Escalation rate
- Average call duration
- Missing field frequency
- Caller satisfaction (via tone analysis)
- Data accuracy rate

### Continuous Improvement
- Review edge case logs weekly
- Analyze fallback trigger frequency
- Monitor confusion points
- Adjust prompts based on real call data

## Support & Customization

### To Customize This Configuration

1. **Adjust LTV/LTC Ranges**: Update in `business_context.loan_products`
2. **Modify Scripts**: Edit prompt text in each module
3. **Add/Remove Fields**: Update `data_to_collect` arrays
4. **Change Validation Rules**: Modify `validation_rules` objects
5. **Adjust Fallbacks**: Edit `fallback_behaviors` in Module X

### Version History
- **v1.0.0** (2026-01-09): Initial comprehensive configuration

## License

Proprietary - Sphinx Capital

## Contact

For questions or support regarding this configuration, contact the Sphinx Capital technology team.

---

**Built for Retell AI Platform**
**Configured for Sphinx Capital Private Lending**
**Last Updated**: January 2026
