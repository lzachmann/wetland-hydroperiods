# ==== Clean Google Earth Engine SMA exports ====

library(tidyverse)
library(lubridate)
library(hrbrthemes)
# library(extrafont)

# Columns to remove (they aren't necessary)
extraneous_cols <- c('L8_date', 'NAIP_date', 'QA_PIXEL', '.geo') # TODO: confirm that QA_PIXEL is unneeded

# Functions
get_date <- function(system_index) {
  ymd(parse_date_time(str_sub(system_index, 15, 22), 'Y!m!*d!'))
}

# Load the exports
wetland_SMA <- read_csv('exports/SMA_timeSeries.csv')
wetland_SMA_NA <- read_csv('exports/SMA_NA_timeSeries.csv')

# Post-processing
masked_recs <- wetland_SMA_NA %>% 
  distinct(`system:index`, na_col = water) %>% 
  mutate(is_masked = na_col != 0) # TODO: consider another threshold?

# Phase 1 cleanup
d1 <- wetland_SMA %>%
  left_join(masked_recs, by = "system:index") %>% 
  mutate(date = get_date(`system:index`), rmse_is_gt0 = rmse > 0, # TODO: ask Meghan why this is the case...
         keep = !is_masked & rmse_is_gt0) %>% 
  select(-any_of(extraneous_cols))

# To the phase 1 filters, add an additional quantile filter
d2 <- d1 %>% 
  filter(keep, water < quantile(water, probs = 0.999))

# Plot the entire timeseries for a subset of sites
ggplot(
  d2  %>% filter(pond_ID %in% sample(unique(pond_ID), 9)), 
  aes(x = date, y = water, group = pond_ID)
) +
  facet_wrap(~pond_ID, scales = 'free') +
  geom_point(
        aes(fill = interaction(is_masked, rmse_is_gt0)), pch = 21, size = 2
  ) +
  geom_path() +
  theme_ipsum_rc(grid = "Y", base_size = 14, base_family = font_an,
                 axis_title_size = 16, strip_text_size = 16) +
  labs(x = "Date", y = 'Water') +
  theme(legend.position = "bottom")

# One curve for each year for each pond
ggplot(d2 %>% filter(pond_ID %in% sample(unique(pond_ID), 9))) +
  facet_wrap(~pond_ID, scales = 'free') +
  geom_line(aes(x = yday(date), y = water, group = interaction(year(date), pond_ID)))

## Export cleaned SMA data
write_csv(d2, "output/cleaned_SMA_data.csv")
