"""Submit one authorized video task, or poll/download that same task. Never retry POST."""
import argparse
import base64
import json
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, build_opener, HTTPRedirectHandler, urlopen
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
RECEIPT = ROOT / "docs/media/video-task.json"

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["submit", "poll"])
    parser.add_argument("--config", type=Path, required=True)
    args = parser.parse_args()
    config = json.loads(args.config.read_text(encoding="utf-8-sig"))
    key = config["api_key"]
    base = config["base_url"].rstrip("/")
    if base != "https://tokenhub.tencentmaas.com/v1":
        raise ValueError("Unexpected API origin")
    def request(path, body=None):
        req = Request(base + path, data=json.dumps(body).encode() if body else None,
                      headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"})
        with build_opener(NoRedirect()).open(req, timeout=60) as response:
            return json.load(response)
    def save(receipt):
        RECEIPT.write_text(json.dumps(receipt, indent=2, ensure_ascii=False) + "\n")
    try:
        if args.action == "submit":
            if RECEIPT.exists():
                print("Receipt exists; will not submit again. Use poll with its task ID.")
                return
            receipt = {"model": "hy-video-v1.5", "status": "submitting", "duration": 5,
                       "resolution": "720p", "estimated_yuan": 1.5,
                       "price_source": "https://cloud.tencent.cn/document/product/1823/130055"}
            save(receipt)  # Leave this marker if the POST times out: never silently resubmit.
            result = request("/wand/hunyuan-video/generation", {
                "model": receipt["model"], "duration": 5, "resolution": "720p", "n": 1,
                "image": base64.b64encode((ROOT / "docs/media/departure-first-frame.png").read_bytes()).decode(),
                "prompt": (ROOT / "docs/media/departure-prompt.txt").read_text(),
                "negative_prompt": "文字，字幕，水印，角色变形，多余眼睛，多余角色，切镜头，闪白，爆炸，地球，完整星系全景",
            })
            receipt.update({k: result[k] for k in ("task_id", "request_id", "status", "created") if k in result})
            receipt["status"] = result.get("status", "queued" if result.get("task_id") else "unknown")
        else:
            receipt = json.loads(RECEIPT.read_text())
            if not receipt.get("task_id"):
                print("No confirmed task ID; inspect submission state before proceeding.")
                return
            result = request("/wand/hunyuan-video/tasks/" + receipt["task_id"])
            receipt["status"] = result.get("status", "unknown")
            for name in ("tokenhub_usage", "usage", "error"):
                if result.get(name):
                    receipt[name] = json.loads(json.dumps(result[name]).replace(key, "[REDACTED]"))
            if receipt["status"] == "succeeded":
                target = ROOT / "docs/media/departure-original.mp4"
                if not target.exists():
                    url = result["videos"][0]["url"]
                    if urlsplit(url).scheme != "https":
                        raise ValueError("Expected HTTPS media URL")
                    # Do not send API authorization to the media host or store signed URLs.
                    with urlopen(url, timeout=60) as response:
                        content = response.read()
                    temporary = target.with_suffix(".download")
                    temporary.write_bytes(content)
                    temporary.replace(target)
                receipt["file"] = "docs/media/departure-original.mp4"
        if result.get("error"):
            receipt["error"] = json.loads(json.dumps(result["error"]).replace(key, "[REDACTED]"))
        save(receipt)
        print(json.dumps(receipt, ensure_ascii=False))
    except HTTPError as error:
        # Only return a scrubbed provider error, never request headers or payloads.
        try:
            body = json.loads(error.read())
            problem = body.get("error", {})
            summary = {k: problem[k] for k in ("code", "message") if k in problem}
            print("HTTP", error.code, json.dumps(summary).replace(key, "[REDACTED]"))
        except (ValueError, AttributeError):
            print("HTTP", error.code)
        raise SystemExit(1)
    except (URLError, TimeoutError):
        print("Network error; no automatic retry. Keep the receipt and task ID.")
        raise SystemExit(1)

if __name__ == "__main__":
    main()
