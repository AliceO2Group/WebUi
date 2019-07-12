#!/bin/bash

get_changed_projects_list () {
  UPSTREAM_BRANCH="$1"
  echo "Incepem functia $UPSTREAM_BRANCH"

  # get list of files changed
  CHANGED_FILES=$(git diff --name-only HEAD $(git merge-base HEAD ${UPSTREAM_BRANCH}))
  echo "These are the changed files: $CHANGED_FILES"
  for dir in $CHANGED_FILES; do

    # remove filenames
    dir=$(dirname $dir);
    echo "These are the changed directories $dir"
    # keep root directories only
    dir=$(echo "$dir" | awk -F "/" '{print $1}');

    # append array
    CHANGED_PROJECTS+=("$dir");
  done

  # remove duplicates
  CHANGED_PROJECTS=($(echo "${CHANGED_PROJECTS[@]}" | tr ' ' '\n' | sort -u | tr '\n' ' '));
  echo "THese are the changed directories"
  # remove "." from array
  CHANGED_PROJECTS=("${CHANGED_PROJECTS[@]/.}");
}

# fetch all branches
for b in `git branch -r | grep -v -- '->'`; do
  git branch --track ${b##origin/} $b || true;
done
echo "CURRENT BRANCH IS: $TRAVIS_BRANCH"
get_changed_projects_list $TRAVIS_BRANCH

# for project in ${CHANGED_PROJECTS[@]}; do
#   cd ${project}; touch _TEST; cd ..; echo "Testing ${project}"
# done
