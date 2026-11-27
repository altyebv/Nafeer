# Two-week pilot: what to check by hand

One subject, one lead, 3–5 contributors. These need the real services, so no
test covers them. State as of 27 November 2026.

## Already checked, from outside

- `https://nafeer4sudan.site` answers; protected routes refuse (401), `/editor`
  redirects to sign-in, and the daily cron has its secret set.
- The live coverage endpoint reports 527 lessons, none approved.

## Check before inviting anyone

1. **Email links.** The local env file, pulled from Vercel, has
   `NEXT_PUBLIC_APP_URL=https://nafeer-edu.vercel.app`, and that address has no
   deployment. If Vercel's production setting is the same, every invite,
   password reset and review email links to a dead page. Set it to
   `https://nafeer4sudan.site` and redeploy.
2. **Deployment.** The latest commit on `main` shows as ready in Vercel.
3. **Email delivery.** Invite yourself at a spare address; follow the interview
   and onboarding links. Return a lesson and check the verdict email arrives.
4. **Image upload.** Add an image block, describe it, upload from the dashboard
   (الوسائط → طلبات صور) and see it appear in the lesson.
5. **Publishing and Basheer.** With one real approved lesson: preview the
   release, publish, then check on a phone that the lesson and its image show.
   Edit it, publish again before approving, and check the phone still shows the
   approved text. Approve and publish, and check the change arrives.
6. **Lead.** Appoint the lead with review rights, sign in as them, and approve
   and return one lesson.

## Tell the pilot team

- Take lessons from the lesson list (تولَّ), and hand back what you will not
  finish.
- There are no instant notifications: open the app to see what is waiting.
- Images: describe what you need in the image block.

## Watch as the owner

- Image requests have no notification: look at الوسائط daily.
- Review waiting lessons the lead wrote; the daily email does not list them.
