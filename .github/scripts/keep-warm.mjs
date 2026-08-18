// Keeps the Render free-tier realtime service warm only during F1 session
// windows, so it never cold-starts mid-session but still sleeps (free) the
// rest of the time. Gated on the real F1 calendar via the OpenF1 API.
//
// A session window is [date_start - PRE_MIN, date_end + POST_MIN]. If now is
// inside any window, ping the health endpoint; otherwise exit immediately.

const REALTIME_URL = (process.env.REALTIME_URL || "").replace(/\/$/, "");
const FORCE = process.env.FORCE_PING === "true";
const PRE_MIN = 15; // warm up this many minutes before a session starts
const POST_MIN = 30; // keep warm this many minutes after it ends

if (!REALTIME_URL) {
  console.error("REALTIME_URL is not set");
  process.exit(1);
}

async function ping(reason) {
  const url = `${REALTIME_URL}/api/health`;
  try {
    const res = await fetch(url, { method: "GET" });
    console.log(`ping ${url} -> ${res.status} (${reason})`);
    return res.ok;
  } catch (err) {
    console.error(`ping failed: ${err?.message ?? err}`);
    return false;
  }
}

async function isSessionWindowActive() {
  const year = new Date().getUTCFullYear();
  const url = `https://api.openf1.org/v1/sessions?year=${year}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenF1 sessions HTTP ${res.status}`);
  const sessions = await res.json();

  const now = Date.now();
  const preMs = PRE_MIN * 60_000;
  const postMs = POST_MIN * 60_000;

  for (const s of sessions) {
    const start = Date.parse(s.date_start);
    const end = Date.parse(s.date_end);
    if (Number.isNaN(start) || Number.isNaN(end)) continue;
    if (now >= start - preMs && now <= end + postMs) {
      console.log(
        `active window: ${s.session_name ?? s.session_type} @ ${s.country_name ?? s.location} ` +
          `(${s.date_start} -> ${s.date_end})`
      );
      return true;
    }
  }
  return false;
}

async function main() {
  if (FORCE) {
    await ping("forced dispatch");
    return;
  }

  let active;
  try {
    active = await isSessionWindowActive();
  } catch (err) {
    // If we can't read the calendar, err toward keeping it warm — a missed
    // cold-start during a real session is worse than an occasional wasted ping.
    console.warn(`calendar check failed, pinging as fallback: ${err?.message ?? err}`);
    await ping("calendar unavailable (fallback)");
    return;
  }

  if (!active) {
    console.log("no active session window; letting the service sleep.");
    return;
  }

  // Ping twice ~60s apart so one triggered run covers a little more of the
  // 15-min sleep threshold even if the next scheduled run is delayed.
  await ping("session window active");
  await new Promise((r) => setTimeout(r, 60_000));
  await ping("session window active (+60s)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
