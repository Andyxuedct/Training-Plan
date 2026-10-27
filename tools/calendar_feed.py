#!/usr/bin/env python3
"""Build calendar.ics (a subscribable feed) from the detailed plan's day rows.

One all-day event per day, English title, Chinese details then English.
UIDs are fixed per date, so when the plan changes the subscribed calendar
updates the same events instead of adding new ones.
"""
import datetime as dt
import html
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
ICONS = {"t-gym": "🏋️", "t-hyrox": "🔥", "t-speed": "⚡", "t-easy": "🏃", "t-test": "🎯", "t-race": "🏁", "t-rest": "😴"}
ROW = re.compile(r'<tr class="row (t-\w+)" data-date="([\d-]+)"[^>]*>(.*?)</tr>', re.S)
CELL = lambda name: re.compile(r'<td class="c-' + name + r'[^"]*"[^>]*>(.*?)</td>', re.S)


def text(fragment: str) -> str:
    """HTML cell to plain text, keeping block headers and list items on their own lines."""
    s = fragment
    s = re.sub(r'<span class="chip[^"]*">.*?</span>', "", s, flags=re.S)
    s = re.sub(r"<ol>(.*?)</ol>", lambda m: "".join(
        f"\n{i}. {item}" for i, item in enumerate(re.findall(r"<li>(.*?)</li>", m.group(1), re.S), 1)), s, flags=re.S)
    s = re.sub(r"<li>", "\n• ", s)
    s = re.sub(r'<p class="blk[^"]*">', "\n\n", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s)
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r" *\n *", "\n", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


def rows(path: pathlib.Path) -> dict:
    out = {}
    for kind, date, body in ROW.findall(path.read_text(encoding="utf-8")):
        def cell(name):
            m = CELL(name).search(body)
            return text(m.group(1)) if m else ""
        out[date] = {"kind": kind, "session": cell("session").replace("\n", " "), "details": cell("details"), "time": cell("time")}
    return out


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")


def fold(line: str) -> str:
    raw = line.encode("utf-8")
    if len(raw) <= 75:
        return line
    parts, cur = [], b""
    for ch in line:
        b = ch.encode("utf-8")
        if len(cur) + len(b) > (75 if not parts else 74):
            parts.append(cur.decode("utf-8"))
            cur = b""
        cur += b
    parts.append(cur.decode("utf-8"))
    return "\r\n ".join(parts)


def build(site_url: str) -> str:
    zh = rows(ROOT / "content" / "detailed-zh.html")
    en = rows(ROOT / "content" / "detailed-en.html")
    stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    lines = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Andy//Training Plan//ZH", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
        "X-WR-CALNAME:Training Plan", "X-WR-TIMEZONE:Europe/Stockholm",
        "REFRESH-INTERVAL;VALUE=DURATION:PT6H", "X-PUBLISHED-TTL:PT6H",
    ]
    for date in sorted(zh):
        z, e = zh[date], en.get(date, {})
        if "已错过" in z["session"]:  # the missed Monday before the plan started
            continue
        day = dt.date.fromisoformat(date)
        title = f'{ICONS.get(z["kind"], "")} {e.get("session") or z["session"]}'.strip()
        desc = []
        if z["time"]:
            desc.append(f'用时：{z["time"]}')
        if z["details"]:
            desc.append(z["session"] + "\n" + z["details"])
        if e:
            desc.append("—— English ——\n" + (f'Time: {e["time"]}\n' if e.get("time") else "") + e.get("details", ""))
        desc.append(site_url)
        lines += [
            "BEGIN:VEVENT",
            f"UID:{date}@andy-training-plan",
            f"DTSTAMP:{stamp}",
            f"DTSTART;VALUE=DATE:{day:%Y%m%d}",
            f"DTEND;VALUE=DATE:{day + dt.timedelta(days=1):%Y%m%d}",
            "SUMMARY:" + esc(title),
            "DESCRIPTION:" + esc("\n\n".join(desc)),
            "URL:" + site_url,
            "TRANSP:TRANSPARENT",
            "END:VEVENT",
        ]
    lines.append("END:VCALENDAR")
    return "\r\n".join(fold(l) for l in lines) + "\r\n"


def main(site_url: str = "https://andyxuedct.github.io/Training-Plan/") -> None:
    (ROOT / "calendar.ics").write_text(build(site_url), encoding="utf-8", newline="")
    print("wrote", ROOT / "calendar.ics")


if __name__ == "__main__":
    import sys
    main(*sys.argv[1:])
