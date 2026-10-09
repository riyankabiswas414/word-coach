# word-coach 💛

Hi there! **word-coach** is a tiny, friendly agent that reads a sentence and
gently tells you how its *tone* comes across — then nudges you toward the vibe
you actually want. Think of it as a patient friend reading over your shoulder
before you hit send.

You'll paste a line like *"we regret to inform you the feature is delayed"* and
it'll say, kindly, "this one lands a little heavy — try naming the fix, not just
the problem." No red ink. No scolding. Just a nudge.

## Who it's for

You — if you ever stare at a Slack message, an email, or a release note and
wonder *does this sound as warm (or as neutral) as I meant?* Writers, support
folks, anyone who cares how their words feel.

## What's under the hood

Just two friendly pieces, no servers to babysit:

- **Node.js** running right in your terminal — nothing to deploy.
- **Amazon Comprehend** (`DetectSentiment`) — AWS reads the mood of your text
  and hands back positive / neutral / negative / mixed scores. We turn those
  numbers into plain, encouraging language.

That's it. No CloudFormation, no always-on anything. You pay only for the words
you actually check.

## Let's set it up — step by step

**Step 1 — make sure Node is here**
```
node --version
```
You'll want Node 18 or newer. 🙂

**Step 2 — install the one dependency**
```
npm install
```

**Step 3 — point AWS at you**

Comprehend needs your AWS credentials. If you've never done this:
```
aws configure
```
(or `aws sso login` if your team uses SSO). You'll also want the
`comprehend:DetectSentiment` permission — most default roles have it.

**Step 4 — say hello (one-time setup)**
```
node index.js
```
The first time, I'll ask you two gentle questions (region + optional profile)
and remember your answers in `~/.word-coach.json`. You only do this once.

**Step 5 — coach away!**
```
node index.js                       # chat with me line by line
node index.js "thanks so much for your patience today"   # one-shot
```
Type `bye` whenever you're done.

## If something hiccups

Don't worry — I try to explain, not alarm:
- *No credentials?* I'll point you back to `aws configure`.
- *No Comprehend access?* I'll tell you exactly which permission to ask for.
- *Forgot to `npm install`?* I'll remind you in plain words.

## Tidying up

Nothing to tear down — it's just a script! If you'd like it gone entirely:
```
rm ~/.word-coach.json
```
and delete this folder. Thanks for writing with me. 💛

## Files
```
word-coach/
├── index.js        # the whole friendly agent
├── package.json
└── README.md
```
