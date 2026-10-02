# User testing kit

The Consumer Products & Payments track asks two things we can only prove with real people: *would a non-crypto user complete the core flow without confusion or help?* and *is there evidence of user testing, even five friends trying it?* This kit makes one session take about 15 minutes.

## Who to test

- 5 or more people who **don't** use crypto. Friends and family are fine, but not teammates.
- Ideally from at least two countries, and people who have actually split costs on a trip.
- Write down only first name, country and "uses crypto: yes/no". Nothing else.

## Setup

- The app on a phone (APK or dev build), in live mode on testnet, with a trip already created so they can join it.
- One facilitator (gives the tasks, says nothing else) and one note-taker.
- Don't explain the app first. Say only: *"Your friends are going to Japan with you and they use this app for the trip money. Think out loud while you use it."*

## Tasks

Read each task aloud. Don't help. If they are stuck for 30 seconds, note it, then give the smallest possible hint.

1. **Join the trip.** Open this invite link and join. Put in $100.
2. **Pay for something.** You just paid $24 for a taxi with your own card. Pay yourself back from the pot, for everyone.
3. **Add a receipt.** Add a photo of the taxi receipt to that payment.
4. **Check a friend's payment.** Open "Dinner in Shibuya" and look at the receipt.
5. **After the trip.** The trip is over. How much did you get back? Show me your invoice.

## What to note per task

| Task | Done without help? (yes / hint / no) | Seconds | Where they hesitated (screen + words they said) |
| --- | --- | --- | --- |
| 1 Join | | | |
| 2 Pay | | | |
| 3 Receipt | | | |
| 4 Check | | | |
| 5 Invoice | | | |

Also note, word for word, anything that made them think "this is crypto". That is the harshest point in judging.

## Questions afterwards (2 minutes)

1. In your own words, what does this app do?
2. Was there a moment you weren't sure your money was safe?
3. How did you split costs on your last trip with friends? What was annoying about it?
4. Would you use this on your next trip? What would stop you?
5. Who would you send it to first?

## After all sessions

Fill in the table in the root README (§ Testing with real people) with:

- the number of people, their countries and crypto experience,
- how many finished the core flow without help,
- the median time to the first payment,
- the top 3 places people hesitated, and what we changed because of them.

Commit each change you make because of a test with the reason in the message (for example `fix(mobile): clearer safety net label after user test`). Judges read the commit history.
