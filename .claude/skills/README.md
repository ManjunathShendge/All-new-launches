# Project skills

These are **Claude Code Agent Skills** for this repo. Claude Code auto-discovers
any `.claude/skills/<name>/SKILL.md` and loads a skill when its `description`
matches what you're doing. They're committed so the whole team gets them.

| Skill | Loads when you're… |
|-------|--------------------|
| `add-data-access` | adding a repository / service / server action for a table |
| `brand-palette` | writing or reviewing UI colors (enforces DESIGN (2).md) |
| `responsive-layout` | building/fixing layouts for mobile |

## Using them

- **Automatic:** just describe the task ("add a repository for reviews", "make
  this page mobile friendly") and Claude pulls in the relevant skill.
- **Explicit:** type `/add-data-access` (etc.) to invoke on demand.

## Adding a new skill

Create `.claude/skills/<kebab-name>/SKILL.md` with frontmatter:

```markdown
---
name: my-skill
description: Use when … (be specific — this is how Claude decides to load it).
---

Instructions go here. You can also add scripts/resources in the same folder.
```

Keep the body concise and imperative. Reference real files/paths in this repo.
