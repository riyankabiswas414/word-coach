#!/usr/bin/env node
// word-coach — a gentle writing companion.
// paste a sentence; it reads the tone (Amazon Comprehend) and coaches you.
// runtime: node CLI. aws: comprehend. no cloudformation.
"use strict";

const readline = require("readline");
const os = require("os");
const fs = require("fs");
const path = require("path");

const CFG = path.join(os.homedir(), ".word-coach.json");
const DEFAULT_REGION = "us-east-1";

const c = {
  reset: "\x1b[0m", dim: "\x1b[2m", b: "\x1b[1m",
  green: "\x1b[32m", cyan: "\x1b[36m", yellow: "\x1b[33m", mag: "\x1b[35m",
};
const tty = process.stdout.isTTY;
const paint = (s, col) => (tty ? `${c[col]}${s}${c.reset}` : s);

function loadCfg() {
  try { return JSON.parse(fs.readFileSync(CFG, "utf8")); }
  catch { return null; }
}
function saveCfg(cfg) {
  fs.writeFileSync(CFG, JSON.stringify(cfg, null, 2), { mode: 0o600 });
}

function ask(rl, q) {
  return new Promise((res) => rl.question(q, (a) => res(a.trim())));
}

async function firstRun(rl) {
  console.log(paint("\n  👋  Hi! I'm word-coach — let's set up once.\n", "cyan"));
  const region =
    (await ask(rl, `  Which AWS region should I use? [${DEFAULT_REGION}] `)) ||
    DEFAULT_REGION;
  const profile = await ask(
    rl,
    "  AWS profile name? (leave blank to use your default/env creds) "
  );
  const cfg = { region, profile };
  saveCfg(cfg);
  console.log(
    paint(`\n  Great — saved your choices to ${CFG}. You're ready!\n`, "green")
  );
  return cfg;
}

// friendly, human read of Comprehend's sentiment result
function coach(sent, scores) {
  const pct = (n) => Math.round(n * 100);
  const lines = [];
  if (sent === "POSITIVE") {
    lines.push("That reads warm and positive — nice work! 🌱");
    lines.push("If you want it even stronger, lead with the upbeat part.");
  } else if (sent === "NEGATIVE") {
    lines.push("This one lands a little heavy.");
    lines.push("Try softening one sharp word, or naming the fix, not just the problem.");
  } else if (sent === "MIXED") {
    lines.push("There are two moods tangled together here.");
    lines.push("Consider splitting it into two sentences so each feeling is clear.");
  } else {
    lines.push("Pretty neutral and factual — great for docs and updates.");
    lines.push("If you wanted some warmth, a single friendly word goes a long way.");
  }
  lines.push(
    paint(
      `  (positive ${pct(scores.Positive)}% · neutral ${pct(
        scores.Neutral
      )}% · negative ${pct(scores.Negative)}% · mixed ${pct(scores.Mixed)}%)`,
      "dim"
    )
  );
  return lines;
}

async function analyze(cfg, text) {
  let AWS;
  try {
    AWS = require("@aws-sdk/client-comprehend");
  } catch {
    console.error(
      paint(
        "\n  Oops — I need the AWS SDK first. Please run:  npm install\n",
        "yellow"
      )
    );
    process.exit(1);
  }
  const { ComprehendClient, DetectSentimentCommand } = AWS;
  const client = new ComprehendClient({
    region: cfg.region,
    ...(cfg.profile
      ? { credentials: require("@aws-sdk/credential-providers").fromIni({ profile: cfg.profile }) }
      : {}),
  });
  try {
    const out = await client.send(
      new DetectSentimentCommand({ Text: text, LanguageCode: "en" })
    );
    return { sentiment: out.Sentiment, scores: out.SentimentScore };
  } catch (e) {
    const msg = String(e && e.message);
    if (/credential|token|security token/i.test(msg)) {
      console.error(
        paint(
          "\n  I couldn't find working AWS credentials.\n" +
            "  Try `aws configure` (or `aws sso login`), then come back. 🙂\n",
          "yellow"
        )
      );
    } else if (/AccessDenied|not authorized/i.test(msg)) {
      console.error(
        paint(
          "\n  Your credentials don't have Comprehend access yet.\n" +
            "  Ask for the `comprehend:DetectSentiment` permission, then retry.\n",
          "yellow"
        )
      );
    } else {
      console.error(paint(`\n  Something went wrong: ${msg}\n`, "yellow"));
    }
    process.exit(1);
  }
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let cfg = loadCfg();
  if (!cfg) cfg = await firstRun(rl);

  const argText = process.argv.slice(2).join(" ").trim();
  if (argText) {
    const r = await analyze(cfg, argText);
    console.log(paint(`\n  Tone: ${r.sentiment}`, "b"));
    coach(r.sentiment, r.scores).forEach((l) => console.log("  " + l));
    console.log();
    rl.close();
    return;
  }

  console.log(paint("\n  Paste a sentence and I'll coach the tone. Type 'bye' to leave.\n", "cyan"));
  for (;;) {
    const text = await ask(rl, paint("you> ", "mag"));
    if (!text) continue;
    if (/^(bye|exit|quit)$/i.test(text)) {
      console.log(paint("  Take care — keep writing! 💛\n", "green"));
      break;
    }
    const r = await analyze(cfg, text);
    console.log(paint(`\n  Tone: ${r.sentiment}`, "b"));
    coach(r.sentiment, r.scores).forEach((l) => console.log("  " + l));
    console.log();
  }
  rl.close();
}

main();
