# Clean Google Earth Engine SMA exports

library(tidyverse)
library(lubridate)


# Functions
get_date <- function(system_index) {
  ymd(parse_date_time(str_sub(system_index, 15, 22), 'Y!m!*d!'))
}

# Load the exports
wetland_SMA <- read_csv('exports/SMA_timeSeries.csv')

d1 <- wetland_SMA %>% 
  mutate(date = get_date(`system:index`)) %>% 
#   filter(water > 0) %>% 
  select(-.geo)

ggplot(d1 %>% filter(pond_ID == "pond_19")) +
  geom_line(aes(x = date, y = water, group = pond_ID))

# ##Clean-up code for SMA outputs from GEE.

# ## Load libraries
# library("dplyr")
# library("reshape2")


# ## Set working directory
# setwd("C:/CSP-backup/NCPN_NPS_drought_monitoring/time_series_data/")
# list.files()


# ## Upload SMA files and extract data
# wetlandSMA <- read.csv("SMA_timeSeries.csv") ## Remove columns that are confusing.
# wetlandIndices <- read.csv("Normalized_indices_timeSeries.csv")#[-30]
# wetlandCoord <- read.csv("pond_centroids.csv") ## wetland centroids
# wetlandSMA <- wetlandSMA[,-c(2:3,13)]

# ## Add xy coordinates of pond 'maxExtent' centroids to SMA data
# wetlandSMA <- merge(wetlandSMA, wetlandCoord, by="pond_ID")

# ## Create a Date field
# wetlandSMA$Date <- substring(wetlandSMA$system.index, 15, 22)
# #wWetlandIndices$Date <- substring(wetlandIndices$system.index, 15, 22)
# #$Date <- as.Date(strptime(Wetland_SMA$Date, "%Y %m %d"))
# #wetlandIndices$Date <- as.Date(strptime(wetlandIndices$Date, "%Y %m %d"))

# ## Check out data
# head(wetlandSMA)


# # Rename each polygon ObjectID ### THIS WILL NEED TO BE CHANGED BASED ON WHAT IS USED AS A UNIQUE ID ###
# wetlandSMA$uniqueID <- wetlandSMA$pond_ID # Convert to unique id 
# head(wetlandSMA)


# ## CLEANING UP NAs and unmatched pixel counts

# ## Remove NAs designated as -9999
# wetlandSMA <- wetlandSMA[!Wetland_SMA$water<0, ]
# head(wetlandSMA)

# # Convert to quantile
# cleanedSMA1 <- as.data.frame(wetlandSMA %>% group_by(Unique_ID) %>% mutate(quantile = quantile(water,.999)))## Find 99.9% to remove outliers
# cleanedSMA2 <- as.data.frame(cleanedSMA1%>% group_by(Unique_ID) %>% mutate(pixelcount = max(count)))

# head(SMA_cleaned2)
# SMA_cleaned2 <- cleanedSMA2[cleanedSMA2$pixelcount==SMA_cleaned2$count,] #27634-16945(observations with bad pixel counts) = 10689
# SMA_cleaned2 <- cleanedSMA2[cleanedSMA2$water<SMA_cleaned2$quantile,] #10689-10644
# SMA_cleaned2 <- cleanedSMA2[!cleanedSMA2$rmse==0,] #10689-10644

# cleanedSMA2$Date <- as.Date(strptime(cleanedSMA2$Date, "%Y %m %d"))
# cleanedSMA2$DOY <- as.numeric(substring(cleanedSMA2$Date, 5, 9))
# cleanedSMA2$Year <- as.numeric(substring(cleanedSMA2$Date, 1, 4))
# cleanedSMA2$Date <- as.numeric(cleanedSMA2$Date)
# head(cleanedSMA2)

# ## Test out

# #1 Alldata
# testID <- "pond_11"

# unique(cleanedSMA2$Unique_ID)
# test <- cleanedSMA2[cleanedSMA2$uniqueID==testID, ]

# #2 select year
# Year <- 2009
# SMAyear <- cleanedSMA2[cleanedSMA2$Year==Year,]
# test <- SMAyear[SMAyear$uniqueID==testID, ]

# #3 summer
# summerSMA <- cleanedSMA2[cleanedSMA2$DOY<1010,]
# summerSMA <- SMA_summer[SMA_summer$DOY>0520,]
# test2 <- summerSMA[summerSMA$uniqueID==testID, ]

# ## Plot
# tail(test2)

# plot(test2$Date, test2$water)
# lines(test2$Date, test2$water)
      
# plot(test2$Date, test2$rmse)
# lines(test2$Date, test2$rmse)

# ## Diagnostic
# plot(test$DOY, test$rmse)
# plot(test$Year, test$rmse)
# plot(cleanedSMA2$area_sqm.x, cleanedSMA2$rmse)
# plot(cleanedSMA2$Date, cleanedSMA2$rmse)
# plot(cleanedSMA2$DOY, cleanedSMA2$rmse)
# plot(cleanedSMA2$Date, cleanedSMA2$water)


# ## Export cleaned SMA data
# write.csv(cleanedSMA2, "cleaned_SMA_data_1984-2021_all.csv") #outputs based on Landsat Collection 1 (for now)
# write.csv(summerSMA, "cleaned_SMA_data_1984-2021_summer.csv") #May 20-Oct 10 data only (to reduce noise from snow)
