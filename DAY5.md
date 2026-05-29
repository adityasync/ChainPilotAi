# Day 5 — AI copilot & intelligence layer

**Date:** 29/05/26
**Project:** Supply Chain AI Copilot
**Hackathon:** OpenAI × Outskill AI Builders Hackathon

---

## What today was about

This was the day the project earned its name.

Days 1–4 built the plumbing: auth, CRUD, analytics, ML predictions. Today was about making all of that accessible through natural language — users ask a question about their supply chain, the system pulls their company's live data, and the model responds with something grounded and specific rather than generic.

Two distinct features went in: a freeform query interface where users can ask anything, and a proactive insight engine that surfaces recommendations without waiting to be asked.

---

## Natural language query system

Users can now type operational questions and get answers based on their actual data.

- [x] AI query endpoint
- [x] Natural language question support
- [x] Company-scoped query processing
- [x] Dynamic response generation
- [x] Frontend query component

Example exchanges:

**Input:** Which suppliers are risky?
**Response:** Supplier X has a higher delay probability and lower reliability score compared to other vendors.

**Input:** What inventory should I prioritize?
**Response:** Product A may require reorder — forecasted demand is trending above available stock.

The responses aren't generic because the model receives the company's actual inventory state, supplier scores, and ML predictions as context. Without that, it would just be a chatbot answering supply chain questions from training data.

---

## Context builder

Getting the AI to respond usefully required solving a grounding problem first. The model needs to know about *this company's* operations, not supply chains in general.

The context builder assembles a structured snapshot of the authenticated company's data before every query:

- Current inventory levels and risk classifications
- Supplier metadata and delay probabilities
- Demand forecasts
- Stored ML predictions

```
Authenticated request
      ↓
Extract company_id from JWT
      ↓
Fetch company's operational data
      ↓
Build context object
      ↓
Send to AI with the user's question
```

This also handles the tenant isolation problem — the context is scoped to one company, so there's no path for the model to surface another company's data even if a prompt tried to extract it.

---

## Streaming responses

Full responses were taking long enough to feel unresponsive. Switched to streaming so the answer starts rendering token-by-token rather than appearing all at once after a delay.

- [x] Streaming response support
- [x] Incremental frontend rendering
- [x] Loading states
- [x] Error handling on stream failure

```
Question submitted
      ↓
AI starts generating
      ↓
Tokens stream to frontend
      ↓
UI updates incrementally
```

Small change, noticeable difference in how the interface feels.

---

## Insight engine

The query system waits for the user to ask something. The insight engine doesn't — it generates proactive recommendations based on current operational state and surfaces them on the insights page.

Example outputs:
```
High inventory risk detected for Product A.
Supplier X has an elevated delay probability.
Reorder recommended for Product B.
```

Each insight gets a severity level:
```
LOW
MEDIUM
HIGH
```

- [x] Insight generation endpoint
- [x] Structured recommendation generation
- [x] Severity classification
- [x] Company-scoped generation

### Insight persistence

Insights are stored rather than regenerated on every page load. A replace-on-regenerate pattern keeps the table from growing indefinitely — triggering a refresh overwrites the previous set.

- [x] Insight persistence
- [x] Company-scoped storage
- [x] Retrieval endpoint
- [x] Replace-on-regenerate workflow

```
Generate insights
      ↓
Validate response
      ↓
Persist to database
      ↓
Retrieve via dashboard
```

---

## Reliability additions

- [x] Rate limiting preparation
- [x] Structured error handling
- [x] Failure-safe responses for malformed AI output

AI responses don't always come back in the expected shape. Added parsing and fallback handling so a bad response degrades gracefully rather than breaking the page.

---

## Frontend

- [x] AI query interface
- [x] Query input component
- [x] Streaming response UI
- [x] Insights page
- [x] Recommendation cards

---

## Screenshots

> Add screenshots here

1. AI query interface
2. Natural language question example
3. Streaming response working
4. AI insights page
5. Generated insight cards
6. Swagger / Postman AI endpoint testing
7. Context builder code
8. AI response example

---

## What went wrong

**Context accuracy.** The first few responses were too vague — the model was getting data but not in a format it could reason about clearly. Spent time restructuring the context object and tweaking the prompt until responses referenced specific products and suppliers by name rather than speaking in generalities.

**Prompt sensitivity.** Supply chain questions come in a lot of different phrasings. "What's at risk?" and "Which products need attention?" mean the same thing but the model handled them differently depending on how the prompt was framed. Took a few iterations to get consistent output quality across varied inputs.

**Streaming and error states.** When the AI request fails mid-stream, the frontend needs to handle a partial response gracefully. That edge case wasn't obvious until it happened during testing.

---

## Tomorrow

- Supplier AI narratives
- Caching and optimization
- Reliability improvements
- Error handling pass
- UX polish
- System stability

---

## GitHub

_Add repository / commit links here_

---

## Notes

_Add observations, ideas, or blockers here._
