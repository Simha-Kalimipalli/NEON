
//print (flightBox)

var flightBox = ee.FeatureCollection("projects/ee-ganghong2/assets/AOP_flightBoxes");
var site=flightBox.filterMetadata("siteID","equals","ABBY") 
print (site, 'site')

// mask cloud based on QA60
function maskS2clouds(image) {
  var qa = image.select('QA60');

  // Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask);
  
}

/// function for generating a property of cloud
function get_cloud_cover(feat){
  var wrap=function(image) { 
    // get the pixel number with mask on
    var allpixelscount = image.select('B1').reduceRegion({
      reducer: ee.Reducer.count(),
      geometry: feat.geometry(),
      scale: 20,
      maxPixels: 1e9
    }).get('B1')
  // get all pixles through unmask 
    var mask_pix = image.select('B1').unmask().reduceRegion({
      reducer: ee.Reducer.count(),
      geometry: feat.geometry(),
      scale: 20,
      maxPixels: 1e9
    }).get('B1')
    
    //get cloud cover percentage
    var cloud_cover = ee.Number(1).subtract(ee.Number(allpixelscount).divide(mask_pix)).multiply(100)
    return image.set('cloud_cover', cloud_cover); //add cloud cover as a property to the image
  }
  return wrap
}

// get a colletion of image id
function item_list(item) {
      return ee.Image(item).id();
  }


function img_list(ft){
  var feat=ee.FeatureCollection(ft).first()  // convert from the list to feature through Featurecolleciton
  //var sitename=feat.get("system:id")
  var sitename=feat.get('Name')
  var interestedDate=ee.Date(feat.get('Time'))
  var dayRange=5
  var dateRange = ee.DateRange(interestedDate.advance(-(dayRange/2), 'day'),interestedDate.advance(dayRange/2, 'day'))
  var dataset = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                  .filterBounds(feat.geometry())
                  .filterDate(dateRange)
                  // Pre-filter to get less cloudy granules.
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',90))
                  .map(maskS2clouds)
                  
  var dataset2= dataset.map(get_cloud_cover(feat)); // add percentage of cloud as property
  var dataset3= dataset2.filter(ee.Filter.lt('cloud_cover',5)) //filter image through cloud cover
  var imgid=ee.Algorithms.If(dataset3.size(),dataset3.toList(dataset3.size()).map(item_list), 'null')
 
  return ee.Feature(null, {'kmlName':sitename, 'Images':imgid})
}


var assetList_2021 = ee.data.listAssets("projects/ee-ganghong2/assets/ABBY/2021/")['assets']
                    .map(function(ind) { return ind.name }) // get 2021 flight shp file from asset
var assetList_2019 = ee.data.listAssets("projects/ee-ganghong2/assets/ABBY/2019/")['assets']
                    .map(function(ind) { return ind.name })  // get 2019 flight shp file from asset
                    
var assetList= assetList_2021.concat(assetList_2019) // merge two years flight ship files
print (assetList)

var result=ee.FeatureCollection(assetList.map(img_list))
print (result)
// export result to csv file in Google drive
Export.table.toDrive({
  collection: result,
  description:'kmlwithImages',
  fileFormat: 'csv',
  selectors: ['kmlName', 'Images']
});
