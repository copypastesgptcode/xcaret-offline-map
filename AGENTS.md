# Working together

Read HANDOFF.md before starting, then run `git status -sb` and `git log -3 --oneline`. It records the last tested state and the next useful work. Update it when you finish or leave a task partly done.

- For sequential work, continue from the last reviewed commit. For simultaneous work, use separate Git worktrees and branches and agree on files before editing. Keep unrelated changes out of a handoff commit.
- Keep runtime assets bundled. Bump the service-worker cache version after changing a precached asset. Test an offline reload before calling a release vacation-ready.
- Preserve venue IDs used by device-local edits or migrate them. Distinguish venue identity, position, entrance, floor, access and hours when recording evidence.
- Record the source and date for new paths. Satellite imagery can suggest a path; verify guest access, level and both ends before using it for directions. Keep unverified candidates out of walking routes.
- Record the branch, tested device, checks, unresolved questions and deployment state in HANDOFF.md. Publish when Dave requests deployment.
