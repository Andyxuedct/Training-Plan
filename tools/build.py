#!/usr/bin/env python3
"""Turn the four designed plan pages into the app's content fragments.

Usage: python3 tools/build.py SRC_DIR
SRC_DIR holds detailed-en.html, detailed-zh.html, v3-en.html, v3-zh.html
(the full HTML of the four plan artifacts). Writes content/*.html and
bumps the service-worker version so phones pick up the new plan.
"""
import pathlib
import re
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent
DOCS = ["detailed-en", "detailed-zh", "v3-en", "v3-zh"]

# Links between the four pages become in-app switches.
ARTIFACT_TO_APP = {
    "KFKpfDuK7NZsdHRBo79XYk": "detailed:en",
    "HTYYB8qedVuR7UnJMvSXps": "detailed:zh",
    "2XgsfM4hUiKpPqLHGhNics": "v3:en",
    "52QJ54X3pj7rPFVsf9Z598": "v3:zh",
}


def fragment(html: str) -> str:
    start = re.search(r'<div class="lang-(en|zh)"', html)
    end = html.find("<script>", start.start())
    body = html[start.start():end].rstrip()
    for art, target in ARTIFACT_TO_APP.items():
        body = body.replace(f'href="https://claude.ai/artifact/{art}"', f'href="#app:{target}"')
    # Other claude.ai links (editable docs, video notes) open outside the app.
    body = re.sub(r'<a href="(https://[^"]+)"', r'<a href="\1" target="_blank" rel="noopener"', body)
    return body + "\n"


def main() -> None:
    src = pathlib.Path(sys.argv[1])
    out = ROOT / "content"
    out.mkdir(exist_ok=True)
    for name in DOCS:
        html = (src / f"{name}.html").read_text(encoding="utf-8")
        (out / f"{name}.html").write_text(fragment(html), encoding="utf-8")
        print("wrote", out / f"{name}.html")
    sw = ROOT / "sw.js"
    text = sw.read_text(encoding="utf-8")
    text = re.sub(r"const VERSION = '[^']*';", f"const VERSION = 'v{time.strftime('%Y%m%d%H%M%S')}';", text)
    sw.write_text(text, encoding="utf-8")
    print("bumped sw.js version")


if __name__ == "__main__":
    main()
