##Clean-up code for SMA outputs from GEE.

## Load libraries
library("dplyr")
library("reshape2")


## Set working directory
setwd("C:/CSP-backup/NCPN_NPS_drought_monitoring/time_series_data/")
list.files()


## Upload SMA files and extract data
Wetland_indices <- read.csv("Indices_unmasked_NA-9999_p40cloud_allyear.csv")#[-7]
Wetland_pixelcount <- read.csv("pixelcount_unmasked_NA-9999_p40cloud_allyear.csv")
Wetland_coord <- read.csv("pond_centroids.csv") ## wetland centroids
Wetland_SMA <- read.csv("SMA_900m2_unmasked_NA-9999_p40cloud_allyear.csv") ## Remove columns that are confusing.
Wetland_SMA <- Wetland_SMA[,-c(2:3,13)]
Wetland_pixelcount <- Wetland_pixelcount[,-7]

## Add xy coordinates of pond 'maxExtent' centroids to SMA data
Wetland_SMA <- merge(Wetland_SMA, Wetland_coord, by="pond_ID")

## Create a field of julian dates
Wetland_SMA$JulianDate <- substring(Wetland_SMA$system.index, 15, 22)
#Wetland_indices$JulianDate <- substring(Wetland_indices$system.index, 15, 22)
Wetland_pixelcount$JulianDate <- substring(Wetland_pixelcount$system.index, 15, 22)
#$Date <- as.Date(strptime(Wetland_SMA$JulianDate, "%Y %m %d"))
#Wetland_pixelcount$Date <- as.Date(strptime(Wetland_pixelcount$JulianDate, "%Y %m %d"))
#Wetland_indices$Date <- as.Date(strptime(Wetland_indices$JulianDate, "%Y %m %d"))

## Check out data
head(Wetland_SMA)


# Rename each polygon ObjectID ### THIS WILL NEED TO BE CHANGED BASED ON WHAT IS USED AS A UNIQUE ID ###
Wetland_SMA$Unique_ID <- Wetland_SMA$pond_ID # Convert to unique id 
Wetland_pixelcount$Unique_ID <- Wetland_pixelcount$pond_ID # Convert  to unique id 
head(Wetland_SMA)
head(Wetland_pixelcount)


## CLEANING UP NAs and unmatched pixel counts

## Remove NAs designated as -9999
Wetland_SMA <- Wetland_SMA[!Wetland_SMA$water<0, ]
## Merge datasets
all <- merge(Wetland_SMA, Wetland_pixelcount, by=c("Unique_ID","JulianDate"))
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
