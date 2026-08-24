# AI employee

Entity: `Employee` (`type=AI`). First hire: **Rahul**, Sales & Customer Service.

## Status

`WORKING` · `PAUSED` · `HUMAN_ONLY` · `OFFLINE` · `SETUP_REQUIRED`

Pause can include `pauseUntil`. Per-conversation mute is `Conversation.controlMode = HUMAN` (take over). Resume sets it back to `AI`.

## What Rahul may do

Only with catalogue + rules + provider confirmation:

Answer, search, availability, approved price, quote, order draft, request payment, book delivery after paid, follow up, recover, escalate, remember sourced facts.

## What Rahul must not do

Invent price, stock, paid, delivered, discounts beyond cap, refunds, or “done”.

Engine: `src/lib/usp/completion.ts` (state + next best action) and `src/lib/usp/handle-turn.ts` (tools + persistence). Language layer does not own money facts.

Future seats (templates only): Priya, Amit, Neha — `src/lib/usp/workforce.ts`.
