# wetland-hydroperiods
A fork of a Google Earth Engine project, accessible by those with read/write permissions [here](
https://code.earthengine.google.com/?accept_repo=users/laura_csp/wetland_hydroperiods).

## Getting started

## Developer notes
To sync the fork with the upstream repo, follow these steps:
1. Configure a remote that points to the upstream repo
```sh
git remote add upstream https://earthengine.googlesource.com/users/laura_csp/wetland_hydroperiods
```
2. Fetch branches / commits from the upstream repo
```sh
git fetch upstream
```
3. Checkout your fork's local default branch
```sh
git checkout main
```
4 Merge changes on the upstream default branch into your local default branch
```sh
git merge upstream/master --allow-unrelated-histories
```
For more on the ` --allow-unrelated-histories` tag, see this [post](https://www.educative.io/edpresso/the-fatal-refusing-to-merge-unrelated-histories-git-error).

To push changes on the fork to the upstream repo, use `git push upstream`. Any / all merges of these changes onto the upstream default branch (`master`) will need to be done from the upstream repo by those with access.
