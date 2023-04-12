# Load required packages
library(raster)
library(rhdf5)
library(stringr)

# set working directory to ensure R can find the file we wish to import and where
# we want to save our files. Be sure to move the download into your working directory!
wd <- "J:/NEON/NEON_refl-surf-dir-ortho-mosaic/NEON.D16.ABBY.DP3.30006.001.2021-07.basic.20221028T223151Z.PROVISIONAL/" 
setwd(wd)

fileNames=list.files(path=wd, pattern=".h5", all.files=TRUE, full.names=FALSE)
fileList=strsplit(fileNames[1],'_')
filestr=toString(fileList)
siteName=substr(filestr, 19, 22)
siteName=gsub(" ","",siteName)
siteName=str_trim(siteName, "right")
siteName=str_trim(siteName, "left")

band2Raster <- function(file, band, noDataValue, extent, CRS, site){
		# first, read in the raster
		out <- h5read(file,paste('/',site,'/Reflectance/Reflectance_Data',sep = "", collapse = NULL),index=list(band,NULL,NULL))
		  # Convert from array to matrix
		out <- (out[1,,])
		  # transpose data to fix flipped row and column order 
		# depending upon how your data are formatted you might not have to perform this
		# step.
		out <- t(out)
		# assign data ignore values to NA
		# note, you might chose to assign values of 15000 to NA
		out[out == myNoDataValue] <- NA
		  
		# turn the out object into a raster
		outr <- raster(out,crs=CRS)
	   
		# assign the extents to the raster
		extent(outr) <- extent
	   
		# return the raster object
		return(outr)
	}

for (fileind in fileNames)
{

	fileName=gsub('.h5','',fileind)	
	fileName   
	
	# create path to file name
	imgf <- paste(wd,fileind,sep = "", collapse = NULL)

	# View HDF5 file structure 
	#View(h5ls(imgf,all=T))

	# define coordinate reference system from the EPSG code provided in the HDF5 file
	#myEPSG <- h5read(imgf,"/ABBY/Reflectance/Metadata/Coordinate_System/EPSG Code" )
	myEPSG <- h5read(imgf,paste('/',siteName,'/Reflectance/Metadata/Coordinate_System/EPSG Code', sep = "", collapse = NULL))
	myCRS <- crs(paste("+init=epsg:",myEPSG,sep = "", collapse = NULL))

	# get the Reflectance_Data attributes
	#reflInfo <- h5readAttributes(imgf,"/ABBY/Reflectance/Reflectance_Data" )
	reflInfo <- h5readAttributes(imgf,paste('/',siteName,'/Reflectance/Reflectance_Data', sep = "", collapse = NULL))
	nBands <- reflInfo$Dimensions[3]

	# Grab the UTM coordinates of the spatial extent
	xMin <- reflInfo$Spatial_Extent_meters[1]
	xMax <- reflInfo$Spatial_Extent_meters[2]
	yMin <- reflInfo$Spatial_Extent_meters[3]
	yMax <- reflInfo$Spatial_Extent_meters[4]

	# define the extent (left, right, top, bottom)
	rasExt <- extent(xMin,xMax,yMin,yMax)

	myNoDataValue <- as.integer(reflInfo$Data_Ignore_Value)

	# file: the hdf file
	# band: the band you want to process
	# returns: a matrix containing the reflectance data for the specific band

	

	# create a list of the bands we want in our stack, list(1,2,3...426)

	imgList <- vector(mode = "list", nBands)
	for(i in seq_along(imgList)) {
	  imgList[[i]] <- i
	}

	#rgb <- list(1,2,3,4,5,58,34,19) 
	# lapply tells R to apply the function to each element in the list
	img_rast <- lapply(imgList,FUN=band2Raster, file = imgf,
					   noDataValue=myNoDataValue, 
					   extent=rasExt,
					   CRS=myCRS,
					   site=siteName)

	# check out the properties or rgb_rast
	# note that it displays properties of 3 rasters.
	#rgb_rast

	# finally, create a raster stack from our list of rasters
	imgStack <- stack(img_rast)

	# Create a list of band names
	bandNames <- paste("Band_",unlist(imgList),sep="")

	# set the rasterStack's names equal to the list of bandNames created above
	names(imgStack) <- bandNames

	# check properties of the raster list - note the band names
	#rgbStack

	# scale the data as specified in the reflInfo$Scale Factor
	#rgbStack <- rgbStack/as.integer(reflInfo$Scale_Factor)

	# write out final raster	
	# note: if you set overwrite to TRUE, then you will overwite or lose the older
	# version of the tif file! Keep this in mind.
	writeRaster(imgStack, file=paste(wd, fileName, '.tif', sep = "", collapse = NULL), format="GTiff", overwrite=TRUE)
}



