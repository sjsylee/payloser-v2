#!/usr/bin/env bash
set -euo pipefail

# KR: PR을 열거나 기존 PR 브랜치에 추가 푸시하기 전에 브랜치 상태를 확인한다.
# EN: Check branch state before opening a PR or pushing more commits to an existing PR branch.

BASE_REF="${1:-origin/main}"
CURRENT_BRANCH="$(git branch --show-current)"

if [ -z "$CURRENT_BRANCH" ]; then
  echo "현재 브랜치를 확인할 수 없습니다. / Could not detect the current branch."
  exit 2
fi

if [ "$CURRENT_BRANCH" = "main" ]; then
  echo "main 브랜치에서는 PR 상태를 확인하지 않습니다. / Skip PR branch check on main."
  exit 2
fi

if [[ "$BASE_REF" == origin/* ]]; then
  REMOTE_NAME="${BASE_REF%%/*}"
  REMOTE_BRANCH="${BASE_REF#*/}"

  echo "원격 기준 브랜치를 갱신합니다. / Fetching base branch: $BASE_REF"
  git fetch --quiet "$REMOTE_NAME" "$REMOTE_BRANCH"
fi

if ! git rev-parse --verify --quiet "$BASE_REF" >/dev/null; then
  echo "기준 브랜치를 찾을 수 없습니다. / Base ref was not found: $BASE_REF"
  exit 2
fi

echo "현재 브랜치 / Current branch: $CURRENT_BRANCH"
echo "기준 브랜치 / Base branch: $BASE_REF"

if git merge-base --is-ancestor HEAD "$BASE_REF"; then
  echo "이미 기준 브랜치에 포함된 상태입니다. 새 작업은 새 브랜치에서 시작하세요."
  echo "Already merged into the base branch. Start new work from a new branch."
  exit 10
fi

if git merge-base --is-ancestor "$BASE_REF" HEAD; then
  echo "새 PR을 열기 좋은 상태입니다. / Branch is cleanly ahead of the base."
  echo
  echo "아직 main에 없는 커밋 / Commits not in base:"
  git log --oneline "$BASE_REF"..HEAD
  exit 0
fi

echo "기준 브랜치와 갈라진 상태입니다. / Branch has diverged from the base."
echo "origin/main에서 새 브랜치를 만들고 필요한 커밋만 cherry-pick하는 편이 안전합니다."
echo "Safer path: create a new branch from origin/main and cherry-pick only the needed commits."
echo
echo "현재 브랜치에만 있는 커밋 / Commits only on current branch:"
git log --oneline "$BASE_REF"..HEAD
echo
echo "기준 브랜치에만 있는 커밋 / Commits only on base:"
git log --oneline HEAD.."$BASE_REF"
exit 20
