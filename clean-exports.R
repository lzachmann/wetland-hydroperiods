# Clean Google Earth Engine SMA exports

library(tidyverse)
library(lubridate)


# Functions
get_date <- function(system_index) {
  ymd(parse_date_time(str_sub(system_index, 15, 22), 'Y!m!*d!'))
}

# Load the exports
wetland_SMA <- read_csv('exports/SMA_timeSeries.csv')
wetland_pixelcount <- read_csv("exports/Pixel_count_timeSeries.csv")
# read_csv('exports/maxExtents_export.csv')$.geo[1]
# wetland_coord <- read_csv("exports/") ## wetland centroids


# Read in the coordinates

## Add xy coordinates of pond 'maxExtent' centroids to SMA data
# wetland_SMA <- merge(wetland_SMA, wetland_coord, by="pond_ID")

# Remove any observation that had an NA. 

d1 <- wetland_SMA %>% 
  mutate(date = get_date(`system:index`)) %>% 
  filter(water > 0) %>% 
  select(-.geo)

ggplot(d1 %>% filter(pond_ID == "pond_19")) +
  geom_line(aes(x = date, y = water, group = pond_ID))

# # Rename each polygon ObjectID ### THIS WILL NEED TO BE CHANGED BASED ON WHAT IS USED AS A UNIQUE ID ###
# wetland_SMA$Unique_ID <- wetland_SMA$pond_ID # Convert to unique id 
# wetland_pixelcount$Unique_ID <- wetland_pixelcount$pond_ID # Convert  to unique id 
# head(wetland_SMA)
# head(wetland_pixelcount)


## CLEANING UP NAs and unmatched pixel counts

## Remove NAs designated as -9999
wetland_SMA <- wetland_SMA[!wetland_SMA$water<0, ]
## Merge datasets
all <- merge(wetland_SMA, wetland_pixelcount, by=c("Unique_ID","JulianDate"))
head(all)

# Convert to quantile
SMA_cleaned1 <- as.data.frame(all %>% group_by(Unique_ID) %>% mutate(quantile = quantile(water,.999)))## Find 99.9% to remove outliers
SMA_cleaned2 <- as.data.frame(SMA_cleaned1%>% group_by(Unique_ID) %>% mutate(pixelcount = max(count)))

head(SMA_cleaned2)
SMA_cleaned2 <- SMA_cleaned2[SMA_cleaned2$pixelcount==SMA_cleaned2$count,] #27634-16945(observations with bad pixel counts) = 10689
SMA_cleaned2 <- SMA_cleaned2[SMA_cleaned2$water<SMA_cleaned2$quantile,] #10689-10644
SMA_cleaned2 <- SMA_cleaned2[!SMA_cleaned2$rmse==0,] #10689-10644

SMA_cleaned2$Date <- as.Date(strptime(SMA_cleaned2$JulianDate, "%Y %m %d"))
SMA_cleaned2$DOY <- as.numeric(substring(SMA_cleaned2$JulianDate, 5, 9))
SMA_cleaned2$Year <- as.numeric(substring(SMA_cleaned2$JulianDate, 1, 4))
SMA_cleaned2$JulianDate <- as.numeric(SMA_cleaned2$JulianDate)
head(SMA_cleaned2)

## Test out

#1 Alldata
Test_ID <- "pond_11"

unique(SMA_cleaned2$Unique_ID)
test <- SMA_cleaned2[SMA_cleaned2$Unique_ID==Test_ID, ]

#2 select year
Year <- 2009
SMA_year <- SMA_cleaned2[SMA_cleaned2$Year==Year,]
test <- SMA_year[SMA_year$Unique_ID==Test_ID, ]

#3 summer
SMA_summer <- SMA_cleaned2[SMA_cleaned2$DOY<1010,]
SMA_summer <- SMA_summer[SMA_summer$DOY>0520,]
test2 <- SMA_summer[SMA_summer$Unique_ID==Test_ID, ]

## Plot
tail(test2)

plot(test2$Date,test2$water)
lines(test2$Date,test2$water)
      
plot(test2$Date,test2$rmse)
lines(test2$Date,test2$rmse)

## Diagnostic
plot(test$DOY,test$rmse)
plot(test$Year,test$rmse)
plot(SMA_cleaned2$area_sqm.x,SMA_cleaned2$rmse)
plot(SMA_cleaned2$Date,SMA_cleaned2$rmse)
plot(SMA_cleaned2$DOY,SMA_cleaned2$rmse)
plot(SMA_cleaned2$Date,SMA_cleaned2$water)


## Export cleaned SMA data
write.csv(SMA_cleaned2, "cleaned_SMA_data_1984-2021_all.csv") #outputs based on Landsat Collection 1 (for now)
write.csv(SMA_summer, "cleaned_SMA_data_1984-2021_summer.csv") #May 20-Oct 10 data only (to reduce noise from snow)
