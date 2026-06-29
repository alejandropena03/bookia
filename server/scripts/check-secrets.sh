#!/bin/sh
# Check staged files for secrets before commit/push.
# Run manually: bash scripts/check-secrets.sh
# Or wire as pre-commit hook.

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ℹ️  Not a git repo, skipping secret check."
  exit 0
fi

STAGED=$(git diff --cached --name-only 2>/dev/null)
if [ -z "$STAGED" ]; then
  echo "ℹ️  No staged files to check."
  exit 0
fi

# 1. Refuse if any real .env file is staged (.env, .env.local, .env.production — NOT .env.example)
if echo "$STAGED" | grep -qiE '(^|/)\.env(\.local|\.production|\.development|\.staging)?$'; then
  echo "❌ REFUSING: .env file is staged. Unstage it:"
  echo "$STAGED" | grep -iE '(^|/)\.env(\.local|\.production|\.development|\.staging)?$'
  echo ""
  echo "Fix: git reset HEAD <file>"
  exit 1
fi

# 2. Scan staged diff for API key patterns (requires real alphanumerics after prefix,
#    so the regex literals in this script itself don't self-match)
if git diff --cached | grep -qiE 'sk-[a-zA-Z0-9]{20,}|sk-proj-[a-zA-Z0-9]{20,}|DEEPSEEK_API_KEY=sk-[a-zA-Z0-9]{10,}'; then
  echo "❌ REFUSING: API key pattern detected in staged diff."
  echo ""
  echo "Scan results:"
  git diff --cached | grep -nE 'sk-[a-zA-Z0-9]{20,}|sk-proj-[a-zA-Z0-9]{20,}|DEEPSEEK_API_KEY=sk-[a-zA-Z0-9]{10,}' | head -5
  echo ""
  echo "Fix: remove the secret, use .env (gitignored) or shell export."
  exit 1
fi

echo "✅ No secrets detected in staged files."
exit 0
