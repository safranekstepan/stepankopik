# PRD: stepankopik

## Problem
PPC specialisté tráví hodiny psaním reklamních textů pro Google Ads, Meta Ads a Sklik.
Nástroj vezme URL klienta, prostuduje web a vygeneruje kompletní copy podklady — rychle, ve správných znakových limitech.

## Target user
PPC tým evisions — interní nástroj pro více kolegů.

## User stories
- As a PPC specialist I want to enter a client URL and generate complete ad copy so that I save time on manual copywriting.
- As a PPC specialist I want to choose which ad systems to generate copy for (Google / Meta / Sklik) so that I only get what I need.
- As a PPC specialist I want to download the result as a Markdown file so that I can share it with the client or paste it into the ad system.
- As a PPC specialist I want to browse a history of previous generations in a left sidebar so that I can return to any client's copy at any time.
- As a PPC specialist I want to see the evisions logo and the app name "stepankopik" in the header so that the tool feels like a branded internal product.

## MVP scope

### In scope
- Input form: client URL + optional client name
- System selector: Google Ads / Meta Ads / Sklik (default: all three)
- Copy generation via Claude API (website analysis + ad copy in Czech)
- Result displayed in the right panel (formatted Markdown)
- Download result as `.md` file
- Left sidebar with generation history (client name + date), click to reload result
- Header: title "stepankopik" + evisions logo top-right

### Out of scope
- Editing copy inside the app
- Sharing result via link
- PDF export
- User accounts / login
- Direct integration with Google Ads or Meta Business Manager

## External services
- Claude API (copy generation) — https://console.anthropic.com → API Keys

## Data model

### Collection: generations
| Field | Type | Description |
|-------|------|-------------|
| id | number | Sequential, new = highest existing + 1 |
| clientName | string | Client name (from input or extracted from URL) |
| clientUrl | string | Client website URL |
| systems | string | Comma-separated: "google,meta,sklik" |
| result | string | Generated copy as Markdown |
| createdAt | string | ISO 8601 timestamp |

## Initial data shape

```json
{
  "generations": []
}
```
