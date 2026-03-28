import os
import subprocess
import sys
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[2]
ISSUES_FILE = ROOT / "planning" / "issues.yaml"


def run(cmd: list[str], input_text: str | None = None) -> subprocess.CompletedProcess:
    return subprocess.run(
        cmd,
        input=input_text,
        text=True,
        capture_output=True,
        check=False,
    )


def gh_issue_search(title: str) -> str:
    result = run(
        [
            "gh",
            "issue",
            "list",
            "--state",
            "open",
            "--search",
            f'in:title "{title}"',
            "--json",
            "number,title",
            "--limit",
            "20",
        ]
    )
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
        raise RuntimeError("Failed to search issues")
    return result.stdout


def gh_issue_create(title: str, body: str, labels: list[str]) -> None:
    cmd = ["gh", "issue", "create", "--title", title, "--body-file", "-"]
    for label in labels:
        cmd.extend(["--label", label])

    result = run(cmd, input_text=body)
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
        raise RuntimeError(f"Failed to create issue: {title}")
    print(result.stdout.strip())


def issue_exists_by_marker(issue_id: str) -> bool:
    marker = f"[issue-id:{issue_id}]"
    result = run(
        [
            "gh",
            "issue",
            "list",
            "--state",
            "open",
            "--search",
            f'"{marker}" in:body',
            "--json",
            "number,title",
            "--limit",
            "20",
        ]
    )
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
        raise RuntimeError("Failed to search issue marker")
    return result.stdout.strip() not in ("[]", "")


def main() -> None:
    if not ISSUES_FILE.exists():
        raise FileNotFoundError(f"{ISSUES_FILE} not found")

    with ISSUES_FILE.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    defaults = data.get("defaults", {})
    default_labels = defaults.get("labels", [])

    issues = data.get("issues", [])
    if not issues:
        print("No issues found in issues.yaml")
        return

    for item in issues:
        issue_id = item["id"]
        title = item["title"]
        body = item.get("body", "").rstrip()
        labels = default_labels + item.get("labels", [])

        marker = f"[issue-id:{issue_id}]"
        final_body = f"{body}\n\n---\n{marker}\n"

        if issue_exists_by_marker(issue_id):
            print(f"Skip existing issue: {issue_id} / {title}")
            continue

        print(f"Create issue: {issue_id} / {title}")
        gh_issue_create(title, final_body, labels)


if __name__ == "__main__":
    main()