// A Sentinel-2 surface reflectance image, reflectance bands selected,
// serves as the source for training and prediction in this contrived example.
var img = ee.Image('COPERNICUS/S2_SR/20210109T185751_20210109T185931_T10SEG')
              .select('B.*');
Map.setCenter(-121.87, 37.44, 9);
Map.addLayer(img);

// ESA WorldCover land cover map, used as label source in classifier training.
var lc = ee.Image('ESA/WorldCover/v100/2020');

// Remap the land cover class values to a 0-based sequential series.
var classValues = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100];
var remapValues = ee.List.sequence(0, 10);
var label = 'lc';
lc = lc.remap(classValues, remapValues).rename(label).toByte();

// Add land cover as a band of the reflectance image and sample 100 pixels at
// 10 m scale from each land cover class within a region of interest.
var roi = ee.Geometry.Rectangle(-122.347, 37.743, -122.024, 37.838);
var sample = img.addBands(lc).stratifiedSample({
  numPoints: 100,
  classBand: label,
  region: roi,
  scale: 10,
  geometries: true
});

// Add a random value field to the sample and use it to approximately split 80%
// of the features into a training set and 20% into a validation set.
sample = sample.randomColumn();
var trainingSample = sample.filter('random <= 0.8');
var validationSample = sample.filter('random > 0.8');

// Train a 10-tree random forest classifier from the training sample.
//////////////////////////////////////////////////////////////////////////
// The map() operation takes a function that works on each element independently
// and returns a value. You define a function that can be applied to the input.

// Constants
var n_trees = 10;
var regressors = ['B4','B5','B6','B7'];
var response = 'B2';

var  defVis = {
  min: -100,
};

//////////////////////////////////////////////////////////////////////////////
// trainedClassifier1 var and classifiersmileRandomForest function
var trainedClassifier1 = 
function classifiersmileRandomForest(seed_no){ 
  var trainedClassifier = ee.Classifier.smileRandomForest(1).train({
    features: trainingSample,
    classProperty: response,
    inputProperties: regressors,
    subsampling: 0.5,
    subsamplingSeed:seed_no
    });
  return trainedClassifier
}

////////////////////////////////////////////////////////
// Helper function to map a list of classifiers over an image
var classifyImg= function (img,classifier) {
  return img.classify(classifier)
}

// This returns the requested reducer over each classifier
var classifyStats = function(reducer,trainedClassifier1,n_trees,img) {

  return ee.ImageCollection(ee.List.sequence(0, n_trees-1)
                                    .map(trainedClassifier1)
                                    .map(classifyImg.bind(null,img)))
                            .reduce(reducer);
}
// RF - my current solution but this should all accept all of the args for 
// .classify and .train so trainedClassifier1 is flexible

// Get SEP value
var SEP = classifyStats(ee.Reducer.sampleStdDev(),trainedClassifier1,10,img);
print("SEP",SEP)

/// add the layer
Map.addLayer(SEP,defVis, "SEP");

////////////////////////////////////////////
// Richard SDN
// Make RF classifier

// This generates a list of numbers from 1 to n_trees.
var myList = ee.List.sequence(0, n_trees-1);

var getSDNfunc = 
function getSDNFunc(seed_no){ 
    //print("seed_no",seed_no) 

  // var seed_no =0;
  // use existing trainedclasifier function
  var trainedClassifier = ee.Classifier.smileRandomForest(1).train({
      features: trainingSample,
      classProperty: response,
      inputProperties: regressors,
      subsampling: 0.5,
      subsamplingSeed:seed_no
      }).setOutputMode("regression");  
  
  //print("trainingSample",trainingSample) 
  //print("trainingSample response",trainingSample.aggregate_array(response)) 
  //print("trainingClassifier",trainedClassifier.explain()) 
  
  // Apply the classifier to an image corresponding to the training sample
  var estimates = trainingSample.classify(trainedClassifier)
  //print("estimates",estimates)
  
  // Get unique output values
  var uniqueEstimates = estimates.aggregate_array('classification').distinct()
  //print("uniqueEstimates",uniqueEstimates)
  
  // // computes SDN of training samples that match unique estimate
  var getSDN = function(trainingSample,response,estimate) {
    var samples = trainingSample.filter(ee.Filter.eq("classification",estimate))
                        .aggregate_array(response)
    
    return ee.Number(samples.cat(samples).reduce(ee.Reducer.sampleStdDev()))
  }
  
  // print("check", estimates.filter(ee.Filter.eq("classification",189)))
  // Get the trainingSample values for each unique estimate
  var sdnUniqueEstimates = uniqueEstimates.map( getSDN.bind(null,estimates,response))
                                          // .removeAll(ee.List([null]))
  //print("sdnUniqueEstimates",sdnUniqueEstimates)
  
  // Apply the classifer to image
  var imgEstimate = img.classify(trainedClassifier);
  //print(sdnUniqueEstimates)
  var imgSDNEstimate = imgEstimate.remap(uniqueEstimates,sdnUniqueEstimates,0);
  // Map.addLayer(imgEstimate)
  // Map.addLayer(imgSDNEstimate)
  // print("SDN",imgSDNEstimate)
  // Map.addLayer(SDN,defVis,"imgSDNEstimate");
  return imgSDNEstimate
}

var getSDNfunc2 = 
function getSDNFunc(seed_no){ 
    print("seed_no",seed_no) 

  // var seed_no =0;
  // use existing trainedclasifier function
  var trainedClassifier = ee.Classifier.smileRandomForest(1).train({
      features: trainingSample,
      classProperty: response,
      inputProperties: regressors,
      subsampling: 0.5,
      subsamplingSeed:seed_no
      }).setOutputMode("regression");  
  
  print("trainingSample",trainingSample) 
  print("trainingSample response",trainingSample.aggregate_array(response)) 
  print("trainingClassifier",trainedClassifier.explain()) 
  
  // Apply the classifier to an image corresponding to the training sample
  var estimates = trainingSample.classify(trainedClassifier)
  print("estimates",estimates)
  
  // Get unique output values
  var uniqueEstimates = estimates.aggregate_array('classification').distinct()
  print("uniqueEstimates",uniqueEstimates)
  
  // // computes SDN of training samples that match unique estimate
  var getSDN = function(trainingSample,response,estimate) {
    var samples = trainingSample.filter(ee.Filter.eq("classification",estimate))
                        .aggregate_array(response)
    
    return ee.Number(samples.cat(samples).reduce(ee.Reducer.sampleStdDev()))
  }
  
  // print("check", estimates.filter(ee.Filter.eq("classification",189)))
  // Get the trainingSample values for each unique estimate
  var sdnUniqueEstimates = uniqueEstimates.map( getSDN.bind(null,estimates,response))
                                          // .removeAll(ee.List([null]))
  print("sdnUniqueEstimates",sdnUniqueEstimates)
  
  // Apply the classifer to image
  var imgEstimate = img.classify(trainedClassifier);
  print(sdnUniqueEstimates)
  var imgSDNEstimate = imgEstimate.remap(uniqueEstimates,sdnUniqueEstimates,0);
  Map.addLayer(imgEstimate,defVis,"imgEstimate")
  Map.addLayer(imgSDNEstimate,defVis,"imgSDNEstimate")
  print("SDN",imgSDNEstimate)
  // Map.addLayer(SDN,defVis,"imgSDNEstimate");
  return imgSDNEstimate
}
// Apply your function to each item in the list by using the map() function.
var squares = myList.map(getSDNfunc);
print(squares); 

// //apply function to firsttree
// var square1 = getSDNfunc2(myList.get(0))
// print(square1); 

// // Turn list to image collection
// var colPred1 = ee.ImageCollection(square1);
// //print("colPred",colPred)
// var SDN1 = colPred1.reduce(ee.Reducer.mean());
// print("SDN1",SDN1)
// Map.addLayer(SDN1,defVis,"SDN1");

// Turn list to image collection
var colPred = ee.ImageCollection(squares).toBands();
print("colPred",colPred)
Map.addLayer(colPred,defVis,"colpred")
var SDN = colPred.reduce(ee.Reducer.mean());

print("SDN",SDN)
Map.addLayer(SDN,defVis,"SDN");

//////////////////////////////////////////////////////////
var SEP_2 = ee.Image(SEP).multiply(ee.Image(SEP));
// Map.addLayer(SEP_2,defVis,"SEP_2");

var SDN_2 = ee.Image(SDN).multiply(ee.Image(SDN));
// Map.addLayer(SDN_2, defVis,"SDN_2" );

var U = ee.Image(SEP_2).add(ee.Image(SDN_2));
Map.addLayer(U,defVis,"U");
print("U", U)

//////////////////////////////////////////////////////////

var trainedClassifier = ee.Classifier.smileRandomForest(n_trees).train({
      features: trainingSample,
      classProperty: response,
      inputProperties: regressors,
      subsampling: 0.5,
      subsamplingSeed:0
      }).setOutputMode("regression"); 
      
print(trainedClassifier)     

var image_classified = img.classify(trainedClassifier);
var keys = ['SEP', 'SDN', 'U'];
var values = [SEP, SDN, U];

var dict_of_pops = ee.Dictionary.fromLists(keys, values)
print(dict_of_pops);
image_classified.set(dict_of_pops)
print(image_classified)
