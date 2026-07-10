# Echo Ticket Deployment Notes

App Name: Echo Ticket
Tagline: Send a signal
Description: Send a small radio-style ticket with channel, tone, wallet, and time on Base.

## Required env

```bash
NEXT_PUBLIC_BASE_APP_ID=6a0c9f966b7916c4b4095266
NEXT_PUBLIC_BUILDER_CODE=bc_8rqlisus
NEXT_PUBLIC_ECHO_TICKET_CONTRACT_ADDRESS=0x7c687bca91295fbb8570845e857899d182a25bf9
BASE_RPC_URL=replace_with_rpc_url
```

## Order

1. Add the Vercel token, wallet address, and deployer private key to `Vercel.txt`.
2. When Base.dev gives `base:app_id`, send it here.
3. I will write Base App ID to `.env.local`, `Vercel.txt`, `DEPLOY.md`, and `src/app/layout.tsx`, then link/deploy with the token from `Vercel.txt`.
4. I will move the private key into `.env.local`, run `npm run deploy:contract`, and write the contract address back to `.env.local` and `Vercel.txt`.
5. When Base.dev gives Builder Code, send it here.
6. I will write Builder Code to `.env.local`, `Vercel.txt`, add required Vercel env vars, and redeploy production.

## Current deployment

Deployed URL: `https://echo-ticket.vercel.app`

Contract Address: `0x7c687bca91295fbb8570845e857899d182a25bf9`

Contract Transaction: `https://basescan.org/tx/0x4d0611517b0aa32507f86c012f9abcca03c60a0e4ba9dde93b14db3013d117f5`

Builder Code: `bc_8rqlisus`

## Files to sync after Base App ID or Builder Code changes

- `/Users/koala/echo-ticket/.env.local`
- `/Users/koala/echo-ticket/Vercel.txt`
- `/Users/koala/echo-ticket/DEPLOY.md`
- `/Users/koala/echo-ticket/src/app/layout.tsx`
- `/Users/koala/echo-ticket/src/lib/wagmi.ts`
- `/Users/koala/echo-ticket/src/lib/echo-ticket.ts`
