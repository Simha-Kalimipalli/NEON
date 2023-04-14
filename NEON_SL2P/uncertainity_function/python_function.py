#// A Sentinel-2 surface reflectance image, reflectance bands selected,
# // serves as the source for training and prediction in this contrived example.
img = (ee.Image('COPERNICUS/S2_SR/20210109T185751_20210109T185931_T10SEG').select('B.*'))

#// ESA WorldCover land cover map, used as label source in classifier training.
lc = ee.Image('ESA/WorldCover/v100/2020')

#// Remap the land cover class values to a 0-based sequential series.
classValues = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100]
remapValues = ee.List.sequence(0, 10)
label = 'lc'
lc = (lc.remap(classValues, remapValues).rename(label).toByte())

# // Add land cover as a band of the reflectance image and sample 100 pixels at
# // 10 m scale from each land cover class within a region of interest.
roi = ee.Geometry.Rectangle(-122.347, 37.743, -122.024, 37.838)
sample = img.addBands(lc).stratifiedSample(
  numPoints= ee.Number(100),
  classBand= label,
  region= roi,
  scale= ee.Number(10),
  geometries= True
)

# // Add a random value field to the sample and use it to approximately split 80%
# // of the features into a training set and 20% into a validation set.
sample = sample.randomColumn()
trainingSample = sample.filter('random <= 0.8')
validationSample = sample.filter('random > 0.8')

# // Train a 10-tree random forest classifier from the training sample.
# //////////////////////////////////////////////////////////////////////////
# // The map() operation takes a function that works on each element independently
# // and returns a value. You define a function that can be applied to the input.

# // Constants
n_trees = 10
regressors = ['B4','B5','B6','B7']
response = 'B2'

defVis = {
  min: -100,
}


def smileRandomForestU(n_trees,regressors,response,defVis):
  trainedClassifier = ee.Classifier.smileRandomForest(n_trees).train(
        features= trainingSample,
        classProperty= response,
        inputProperties= regressors,
        subsampling= 0.5,
        subsamplingSeed=0
        ).setOutputMode("regression") 
        
  #print(trainedClassifier)     

  image_classified = img.classify(trainedClassifier)



    # //////////////////////////////////////////////////////////////////////////////
  # // trainedClassifier1  and classifiersmileRandomForest function
  def trainedClassifier1(seed_no):
    trainedClassifier = ee.Classifier.smileRandomForest(1).train(
      features= trainingSample,
      classProperty= response,
      inputProperties= regressors,
      subsampling= 0.5,
      subsamplingSeed=seed_no
      )
    return trainedClassifier


  # ////////////////////////////////////////////////////////
  # // Helper function to map a list of classifiers over an image
  def classifyImg(img,classifier):
    return img.classify(classifier)


  # // This returns the requested reducer over each classifier
  def classifyStats(reducer,trainedClassifier1,n_trees,img):

      return (ee.ImageCollection(ee.List.sequence(0, n_trees-1)
                                      .map(trainedClassifier1)
                                      .map(lambda classifier: classifyImg(img,classifier)))
                              .reduce(reducer))

  # SL2P = ee.List.sequence(1,ee.Number(collectionOptions.get("numVariables")),1).map(lambda netNum: wn.makeNetVars(collectionOptions.get("Collection_SL2P"),numNets,netNum))
  # // RF - my current solution but this should all accept all of the args for 
  # // .classify and .train so trainedClassifier1 is flexible

  # // Get SEP value
  SEP = classifyStats(ee.Reducer.sampleStdDev(),trainedClassifier1,10,img)
  #print("SEP",SEP)

  # /// add the layer
  # Map.addLayer(SEP,defVis, "SEP")

  # ////////////////////////////////////////////
  # // Richard SDN
  # // Make RF classifier

  # // This generates a list of numbers from 1 to n_trees.
  myList = ee.List.sequence(0, n_trees-1)

  def getSDNfunc(seed_no): 
      # //print("seed_no",seed_no) 
      # //  seed_no =0
    # // use existing trainedclasifier function
      trainedClassifier = ee.Classifier.smileRandomForest(1).train(
        features= trainingSample,
        classProperty=response,
        inputProperties= regressors,
        subsampling= 0.5,
        subsamplingSeed=seed_no
        ).setOutputMode("regression")  
    
    # //print("trainingSample",trainingSample) 
    # //print("trainingSample response",trainingSample.aggregate_array(response)) 
    # //print("trainingClassifier",trainedClassifier.explain()) 
    
    # // Apply the classifier to an image corresponding to the training sample
      estimates = trainingSample.classify(trainedClassifier)
    # //print("estimates",estimates)
    
    # // Get unique output values
      uniqueEstimates = estimates.aggregate_array('classification').distinct()
    # //print("uniqueEstimates",uniqueEstimates)
    
    # // // computes SDN of training samples that match unique estimate
      def getSDN(trainingSample,response,estimate):
        samples = (trainingSample.filter(ee.Filter.eq("classification",estimate)).aggregate_array(response))
      
        return (ee.Number(samples.cat(samples).reduce(ee.Reducer.sampleStdDev())))
    
    
    # // print("check", estimates.filter(ee.Filter.eq("classification",189)))
    # // Get the trainingSample values for each unique estimate
      sdnUniqueEstimates = uniqueEstimates.map(lambda uniqueEstimate: getSDN(estimates,response,uniqueEstimate))
                                          # // .removeAll(ee.List([None]))
    # //print("sdnUniqueEstimates",sdnUniqueEstimates)
    
    # // Apply the classifer to image
      imgEstimate = img.classify(trainedClassifier)
    # //print(sdnUniqueEstimates)
      imgSDNEstimate = imgEstimate.remap(uniqueEstimates,sdnUniqueEstimates,0)
    # // Map.addLayer(imgEstimate)
    # // Map.addLayer(imgSDNEstimate)
    # // print("SDN",imgSDNEstimate)
    # // Map.addLayer(SDN,defVis,"imgSDNEstimate")
      return imgSDNEstimate

  # // Apply your function to each item in the list by using the map() function.
  squares = myList.map(getSDNfunc)
  #print(squares.get(0).getInfo()) 

  # # //apply function to firsttree
  #  square1 = getSDNfunc2(myList.get(0))
  # print(square1) 

  # # // Turn list to image collection
  #  colPred1 = ee.ImageCollection(square1)
  # //print("colPred",colPred)
  #  SDN1 = colPred1.reduce(ee.Reducer.mean())
  # print("SDN1",SDN1)
  # Map.addLayer(SDN1,defVis,"SDN1")

  # // Turn list to image collection
  colPred = ee.ImageCollection(squares).toBands()
  #print("colPred",colPred)
  # Map.addLayer(colPred,defVis,"colpred")
  SDN = colPred.reduce(ee.Reducer.mean())

  # print("SDN",SDN)
  # Map.addLayer(SDN,defVis,"SDN")

  # //////////////////////////////////////////////////////////
  SEP_2 = ee.Image(SEP).multiply(ee.Image(SEP))
  # // Map.addLayer(SEP_2,defVis,"SEP_2")

  SDN_2 = ee.Image(SDN).multiply(ee.Image(SDN))
  # // Map.addLayer(SDN_2, defVis,"SDN_2" )

  U = ee.Image(SEP_2).add(ee.Image(SDN_2))
  # Map.addLayer(U,defVis,"U")
  #print("U", U)

  # //////////////////////////////////////////////////////////
  keys = ['SEP', 'SDN', 'U']
  values = [SEP, SDN, U]

  dict_of_pops = ee.Dictionary.fromLists(keys, values)
  #print(dict_of_pops)
  image_classified.set(dict_of_pops)
  #print(image_classified)
