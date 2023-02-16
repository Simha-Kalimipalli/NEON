library(rgdal) 
library(raster) 
#library('sf')
site='ABBY'

library(rgdal) #load package
dir_name="K:\\neon\\ABBY\\NEON.D16.ABBY.DP1.30006.001.2019-07.basic.20221114T164907Z.RELEASE-2022\\kml_updated\\"  
kmlfiles=list.files(dir_name, pattern=".kml", all.files=TRUE,full.names=TRUE)
dir_shp="K:\\neon\\ABBY\\NEON.D16.ABBY.DP1.30006.001.2019-07.basic.20221114T164907Z.RELEASE-2022\\shp"
for(kml in kmlfiles)
  {
   # print(kml)
    kmlfile=readOGR(kml) #load KML
    shpname=gsub(pattern = "\\.kml$", "", basename(kml))
    split <- "_"
    result <- strsplit(basename(kml), split )
    kmlfile$Name<-paste(site, '_',result[[1]][1],'_',result[[1]][2])
	#shp$Time<-result[[1]][1]
    kmlfile$Time<- as.Date(result[[1]][1], format = "%Y%m%d")
   # print (shpname)
    writeOGR(kmlfile,dir_shp,layer=shpname, driver="ESRI Shapefile") #save shape
}