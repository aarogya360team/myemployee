# Onboarding

Target: first value in about 10 minutes. Resumable. Progress saved after every step.

| Step | Merchant sees | Skip? |
|---|---|---|
| 1 Business | Name, type, city, language | No |
| 2 Employee | Meet Rahul → **Hire Rahul** | No |
| 3 WhatsApp | Existing / new number / not sure | Yes (stay NOT_CONNECTED) |
| 4 Products | Add SKUs or skip | Yes |
| 5 Rules | What Rahul may do vs approval | Defaults exist |
| 6 Escalation | Owner phone, discount / large-order limits | Defaults exist |
| 7 Language | Hindi / English / Hinglish, tone | Defaults exist |
| 8 Test | DEMO conversation. Never a live send. | No — strongly recommended |
| 9 Go live | Checklist → **Go live with Rahul** | No |

If they leave: next visit opens **Continue setup** at the last unfinished step.

`Business.onboardingStep`, `onboardingJson`, `goLiveAt` persist state. Funnel events: `signup_started`, `business_created`, `employee_created`, `whatsapp_setup_started`, `whatsapp_connected`, `catalogue_uploaded`, `test_completed`, `go_live`.
