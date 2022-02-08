# wetland-hydroperiods
A fork of a Google Earth Engine project, accessible by those with read/write permissions [here](
https://code.earthengine.google.com/?accept_repo=users/laura_csp/wetland_hydroperiods). The code in this repository was developed by Conservation Science Partners
in collaboration with the National Park Service, Northern Colorado Plateau Network (NCPN).

## Recommended citation(s)
Halabisky, M., L. M. Moskal, A. Gillespie, M. Hannam. 2016. Reconstructing semi-arid wetland surface water dynamics through spectral mixture analysis of a time series of Landsat satellite images (1984-2011). _Remote Sensing of Environment_ 177:171-183.

## Getting started
Copy the contents of the JavaScript file into your Google Earth Engine (GEE) code editor. This file creates exports tasks that will go to your Google Drive. The R scripts included are used to post-process data exported from GEE.

## Docs
For the report, please see this [Google Doc](https://docs.google.com/document/d/1l8DwajDEt5ObPUpLkjE6UOuMHjyfPPb8lxl0-Zz69p8/edit?usp=sharing).

## Notes
We use Landsat Collection 2 (C02), which marks the second major reprocessing effort on the Landsat archive by the USGS. C02 replaces Collection 1 assets (`'LANDSAT/LT05/C01/T1_SR'` and `'LANDSAT/LC08/C01/T1_SR'`).

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
