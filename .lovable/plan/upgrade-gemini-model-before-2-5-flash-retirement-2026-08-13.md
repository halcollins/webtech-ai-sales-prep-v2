# Upgrade Gemini Model Before 2.5 Flash Retirement

## Goal
Replace the retiring `google/gemini-2.5-flash` model with the current-generation equivalent in the project's AI-powered edge functions.

## Proposed Change
Update both AI Gateway calls from `google/gemini-2.5-flash` to `google/gemini-3.6-flash` (latest Gemini Flash generation, same chat-completions + tool-calling interface).

## Files to Modify
1. `supabase/functions/generate-company-briefing/index.ts` (line 787)
2. `supabase/functions/generate-contact-enrichment/index.ts` (line 386)

## Verification Steps
1. Deploy the updated edge functions via Supabase deploy.
2. Run a test company-briefing generation to confirm no API errors and output quality is acceptable.
3. Run a test contact-enrichment generation to confirm no API errors and output quality is acceptable.

## Notes
- No request-body changes are required; the new model supports the same `/v1/chat/completions` endpoint, tool calling, and JSON schema constraints already in use.
- If output quality or cost needs adjustment after testing, we can evaluate `google/gemini-3.1-pro-preview` as a higher-quality alternative.
