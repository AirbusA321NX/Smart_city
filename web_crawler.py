import feedparser
from datetime import datetime
import time

QUERY = "Panchkula"
MAX_ARTICLES = 30
OUTPUT_FILE = "panchkula_news.txt"

RSS_URL = f"https://news.google.com/rss/search?q={QUERY}&hl=en-IN&gl=IN&ceid=IN:en"

print(f"[*] Fetching RSS: {RSS_URL}")
feed = feedparser.parse(RSS_URL)

items = feed.entries
print(f"[+] RSS items found: {len(items)}")

if not items:
    print("[-] No items found. Exiting.")
    exit()

count = 0

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write(f"News for location: {QUERY}\n")
    f.write("=" * 60 + "\n\n")

    for entry in items:
        if count >= MAX_ARTICLES:
            print("[*] Reached max articles limit. Stopping.")
            break

        title = entry.get("title", "N/A")
        link = entry.get("link", "N/A")
        source = entry.get("source", {}).get("title", "Unknown Source")

        # Date + Time handling
        published = entry.get("published", "")
        if published:
            try:
                dt = datetime.strptime(published, "%a, %d %b %Y %H:%M:%S %Z")
                date_str = dt.strftime("%Y-%m-%d")
                time_str = dt.strftime("%H:%M:%S")
            except:
                date_str = published
                time_str = "N/A"
        else:
            date_str = "N/A"
            time_str = "N/A"

        block = (
            f"Title   : {title}\n"
            f"Source  : {source}\n"
            f"Date    : {date_str}\n"
            f"Time    : {time_str}\n"
            f"Link    : {link}\n"
            f"{'-'*50}\n"
        )

        print(f"[>] Saving: {title}")
        f.write(block + "\n")

        count += 1
        time.sleep(0.5)  # be polite to Google

print(f"[✓] Done. {count} articles saved to {OUTPUT_FILE}")
