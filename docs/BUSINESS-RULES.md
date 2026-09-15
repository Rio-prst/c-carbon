# Business Rules

## 1. Farm state

```text
REGISTERED
    ↓
DATA_COLLECTION
    ↓
ASSESSED
    ↓
CARBON_CANDIDATE
```

Do not skip to a later state without satisfying the underlying product condition.

## 2. Insurance

```text
PENDING → ACTIVE → EXPIRED
```

Insurance is informational/read-only for farmer MVP.

The platform does not underwrite the policy.

## 3. Farm data verification

```text
SELF_REPORTED → REVIEW → VERIFIED
                         ↘
                          REJECTED
```

Rules:
- Admin reviews data/evidence.
- Reject requires a reason.
- Verify/reject is persisted.
- Admin action is audited.
- Verified data triggers relevant score recalculation.

## 4. FSS

FSS is 0–100.

Prototype weighting:
- Productivity 20%
- Input Efficiency 15%
- Water Efficiency 15%
- Fertilizer Management 10%
- Waste Management 10%
- Soil Conservation 10%
- Energy 5%
- Risk History 5%
- Data Consistency 5%
- Low-Carbon Practice 5%

The PRD says raw values are normalized against commodity-specific reference ranges; exact reference ranges are TBD.

Score behavior:
- provisional score may use self-reported data
- verified score uses verified data
- recalculate after new verified data
- explain component contributions
- do not show "0" when no data exists; show "Belum tersedia"

## 5. CRS

CRS is 0–100.

Prototype weighting:
- Eligible Farming Practice 40%
- Data Completeness 25%
- Baseline Availability 15%
- Verification Readiness 10%
- Aggregation Suitability 10%

CRS is not carbon credit.

## 6. Rewards

Reward events:
- farm data submission
- verification
- FSS improvement
- sustainable practices recorded
- milestone bonus

Tiers:
- 0–399 Basic
- 400–699 Silver
- 700–899 Gold
- 900+ Carbon Ready

Each reward event records:
- event
- points
- total snapshot
- tier snapshot

Rewards are non-financial gamification in MVP.

## 7. Carbon eligibility

CRS contributes to readiness, but eligibility also depends on the PRD-defined data completeness, baseline, verification readiness, practice, and aggregation conditions.

If not ready:
- show low/readiness score
- explain why
- do not fabricate project eligibility

## 8. Aggregation

Admin runs an eligibility filter.

Eligible farms become `project_farms`.

Failure:
- not enough eligible farms

Do not silently add arbitrary farms to make a project look complete.

## 9. Carbon project lifecycle

MVP:
```text
CANDIDATE → ASSESSMENT → AGGREGATING
```

Longer conceptual lifecycle:
```text
CANDIDATE
→ ASSESSMENT
→ AGGREGATING
→ VERIFICATION
→ REGISTRATION
→ ISSUANCE
→ TRADING
```

MVP must not claim that issuance/trading happened.

## 10. Corporate visibility

Corporate sees aggregate information.

Allowed examples:
- total farms
- total area
- commodity focus
- region
- project status

Not allowed in MVP:
- farmer names
- farmer contact information
- individual farm identity unless explicitly approved as a future requirement

## 11. Consent

Farmer grants consent at registration.

Farmer can review/manage consent in Profile.

Use consent information as a governance boundary for downstream data usage.

## 12. Audit

Audit sensitive actions:
- verify
- reject
- project lifecycle changes
- other privileged operations

Audit record includes:
- actor
- action
- target
- timestamp
- metadata

## 13. Edge cases

### No farm
Show empty state + CTA.

### Insurance pending/expired
Show status and contextual warning.

### No farm data
FSS = "Belum tersedia", not 0.

### Incomplete data
Prevent submission until required fields are complete.

### Rejected evidence
Show REJECTED + reason.

### Duplicate submission
Disable submit while sending and apply backend duplicate/idempotency protection.

### Network failure
Show clear error + Retry and avoid losing draft input.

### API failure
Friendly error + Retry.

### Score calculation failure
Keep previous score and communicate failed update; allow recalculation.

### Not carbon ready
Show score + explanation rather than implying failure of the farmer.
