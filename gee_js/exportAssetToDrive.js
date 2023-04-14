var assetList = ee.data.listAssets("users/GangHong2/DSen2_result/")['assets']
                    .map(function(d) { return d.name })
print (assetList)
var test=ee.Image(assetList[0])
print (test)

var img2=ee.Image(assetList[3])
var id2 = ee.Image(img2).get('system:id').getInfo()
var name2=id2.split('/')
print (name2[3])
print(img2.projection())

var proj2=img2.projection()
print (proj2.nominalScale())
print (proj2.crs())


Export.image.toDrive({
  image: img2,
  description: name2[3],
  folder: 'asset',
  crs:  proj2.crs().getInfo(),
  scale: proj2.nominalScale().getInfo()
});