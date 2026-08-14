# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues in `coderMicah/ict-support`. The `gh` CLI is **not** installed on this machine — use the GitHub REST API via `curl.exe` with a personal access token obtained from `git credential fill`.

## Obtaining a token

```
git credential fill
# protocol=https
# host=github.com
# → username + password (the password is the PAT)
```

## Conventions (REST API equivalents)

- **Create an issue**: `POST /repos/{owner}/{repo}/issues` with body JSON `{"title": "...", "body": "..."}`. PowerShell mangles inline JSON — always write the body to a UTF-8-no-BOM file and use `curl.exe --data-binary "@file"`.
- **Read an issue**: `GET /repos/{owner}/{repo}/issues/{number}` (plus `GET .../issues/{number}/comments`).
- **List issues**: `GET /repos/{owner}/{repo}/issues?state=open` (with `labels` filter). Iterate the pages via `Link` header if needed.
- **Comment on an issue**: `POST /repos/{owner}/{repo}/issues/{number}/comments` with `{"body": "..."}`.
- **Apply / remove labels**: `POST /repos/{owner}/{repo}/issues/{number}/labels` with `{"labels": ["..."]}`; remove via `DELETE .../issues/{number}/labels/{name}`.
- **Close**: `PATCH /repos/{owner}/{repo}/issues/{number}` with `{"state": "closed"}`.

Standard invocation shape:

```
curl.exe -s -H "Authorization: Bearer $token" -H "Accept: application/vnd.github+json" -H "Content-Type: application/json" --data-binary "@body.json" "https://api.github.com/repos/coderMicah/ict-support/issues"
```

Infer the repo from `git remote -v` if the payload path ever needs adjusting.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

GitHub shares one number space across issues and PRs, so a bare `#42` may be either — resolve via `GET /repos/{owner}/{repo}/pulls/{number}` first, falling back to `.../issues/{number}`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue via the REST API (see above).

## When a skill says "fetch the relevant ticket"

`GET /repos/{owner}/{repo}/issues/{number}` plus `.../comments`, and the `labels` field from the response.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body.
- **Child ticket**: an issue linked to the map via GitHub sub-issues (`POST /repos/{owner}/{repo}/issues/{parent}/sub_issues`). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: GitHub's **native issue dependencies** — the canonical, UI-visible representation. Add an edge with `POST /repos/{owner}/{repo}/issues/{child}/dependencies/blocked_by -d '{"issue_id": <blocker-db-id>}'`, where `<blocker-db-id>` is the blocker's numeric **database id** (`GET .../issues/{n} --jq .id`, _not_ the `#number` or `node_id`). GitHub reports `issue_dependencies_summary.blocked_by` (open blockers only — the live gate). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Frontier query**: list the map's open children (open issues scoped to the map's sub-issues / task list), drop any with an open blocker (`issue_dependencies_summary.blocked_by > 0`, or an open issue in the `Blocked by` line) or an assignee; first in map order wins.
- **Claim**: `PATCH /repos/{owner}/{repo}/issues/{n}` with `{"assignee": "<username>"}` — the session's first write.
- **Resolve**: comment the answer on the issue, close it, then append a context pointer (gist + link) to the map's Decisions-so-far.
