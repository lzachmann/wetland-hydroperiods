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

Spectral bands used for spectral mixture analysis. Note that the band indices for a given band name are different for Landsat 5 Thematic Mapper (L5) and Landsat 8 Operational Land Imager (L8) imagery.
| Band name           | L5 Band / Wavelength (micrometers) | L8 Band / Wavelength (micrometers) |
|---------------------|------------------------------------|------------------------------------|
| Blue                | Band 1 / 0.45-0.52                 | Band 2 / 0.45-0.51                 |
| Green               | Band 2 / 0.52-0.60                 | Band 3 / 0.53-0.59                 |
| Red                 | Band 3 / 0.63-0.69                 | Band 4 / 0.64-0.67                 |
| Near Infrared (NIR) | Band 4 / 0.76-0.90                 | Band 5 / 0.85-0.88                 |
| SWIR 1              | Band 5 / 1.55-1.75                 | Band 6 / 1.57-1.65                 |
| SWIR 2              | Band 7 / 2.08-2.35                 | Band 7 / 2.11-2.29                 |

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
