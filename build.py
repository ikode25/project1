#!/usr/bin/env python3
"""
Assembles the single-file index.html from src/admin.html + src/portal.html
(the original UI, unmodified) plus src/backend*.js + src/shim.js (the
Firebase-backed google.script.run replacement).

Each original document gets the Firebase SDK + backend + shim injected as
the very first thing in <head>, so window.google.script.run exists before
any of that document's own scripts run. The two resulting complete HTML
documents are then embedded as JS string literals in the outer index.html
shell, which picks one and drops it into an iframe via `srcdoc`, routed by
?page=portal — exactly mirroring the original doGet(page) branching.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"

FIREBASE_SDK = """<script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-database-compat.js"></script>"""


def build_injected_block():
    parts = [FIREBASE_SDK, "<script>"]
    for name in ["backend.js", "backend2.js", "backend3.js", "backend4.js", "shim.js"]:
        parts.append("/* ==== %s ==== */" % name)
        parts.append((SRC / name).read_text(encoding="utf-8"))
    parts.append("</script>")
    return "\n".join(parts)


def inject_into_head(html, block):
    # Insert right after the first '<head>' opening tag.
    idx = html.find("<head>")
    if idx == -1:
        raise SystemExit("Could not find <head> tag to inject into")
    insert_at = idx + len("<head>")
    return html[:insert_at] + "\n" + block + "\n" + html[insert_at:]


def to_js_string_literal(html):
    encoded = json.dumps(html)
    # The browser's HTML tokenizer looks only for the literal char sequence
    # "</script" (case-insensitive) while scanning our *outer* <script>
    # block's raw text — it doesn't know this is "inside a JS string" first.
    # Break that sequence with a backslash, which JS parses back to a
    # harmless "/" at runtime (an unrecognized escape is just the literal
    # character) but which the HTML parser does NOT treat as a tag close.
    encoded = re.sub(r"</(script)", r"<\\/\1", encoded, flags=re.IGNORECASE)
    return encoded


def main():
    injected = build_injected_block()

    admin_html = (SRC / "admin.html").read_text(encoding="utf-8")
    portal_html = (SRC / "portal.html").read_text(encoding="utf-8")

    admin_combined = inject_into_head(admin_html, injected)
    portal_combined = inject_into_head(portal_html, injected)

    admin_js = to_js_string_literal(admin_combined)
    portal_js = to_js_string_literal(portal_combined)

    shell = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>School Fees Management</title>
<style>
  html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #f8f7ff; }
  #appFrame { border: none; width: 100%; height: 100%; display: block; }
</style>
</head>
<body>
<iframe id="appFrame" allowfullscreen="true" title="School Fees Management"></iframe>
<script>
(function () {
  var ADMIN_HTML = __ADMIN_HTML__;
  var PORTAL_HTML = __PORTAL_HTML__;
  var page = new URLSearchParams(window.location.search).get('page');
  var html = (page && page.toLowerCase() === 'portal') ? PORTAL_HTML : ADMIN_HTML;
  var frame = document.getElementById('appFrame');
  frame.srcdoc = html;
})();
</script>
</body>
</html>
"""
    shell = shell.replace("__ADMIN_HTML__", admin_js).replace("__PORTAL_HTML__", portal_js)

    out_path = ROOT / "index.html"
    out_path.write_text(shell, encoding="utf-8")
    print("Wrote %s (%.1f MB)" % (out_path, out_path.stat().st_size / 1024 / 1024))


if __name__ == "__main__":
    main()
