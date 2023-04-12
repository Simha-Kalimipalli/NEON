//makes all assets in a folder readable by everyone
// var AssetList=ee.data.listAssets("users/ccrs12fy2022simha/DOWNSCALING_PROCESS/")

// var AssetList=ee.data.listAssets("users/ccrs12fy2022simha/DOWNSCALING_PROCESS/1_NEON10")
// var AssetList=ee.data.listAssets("users/ccrs12fy2022simha/DOWNSCALING_PROCESS/1_NEON10/REF")
// var AssetList=ee.data.listAssets("users/ccrs12fy2022simha/DOWNSCALING_PROCESS/1_NEON10/SOL_B")

// var AssetList=ee.data.listAssets("users/ccrs12fy2022simha/DOWNSCALING_PROCESS/2_NEON20")
// var AssetList=ee.data.listAssets("users/ccrs12fy2022simha/DOWNSCALING_PROCESS/2_NEON20/NULL")

// var AssetList=ee.data.listAssets("users/ccrs12fy2022simha/DOWNSCALING_PROCESS/3_DSEN2_S2/")
// var AssetList=ee.data.listAssets("users/ccrs12fy2022simha/DOWNSCALING_PROCESS/3_DSEN2_S2/RES_D")
// var AssetList=ee.data.listAssets("users/ccrs12fy2022simha/DOWNSCALING_PROCESS/3_DSEN2_S2/SOL_A")

// var AssetList=ee.data.listAssets("users/ccrs12fy2022simha/DOWNSCALING_PROCESS/4_S2")
// var AssetList=ee.data.listAssets("users/ccrs12fy2022simha/DOWNSCALING_PROCESS/4_S2/RES_E")
// var AssetList=ee.data.listAssets("users/ccrs12fy2022simha/DOWNSCALING_PROCESS/4_S2/RES_F")

// var AssetList=ee.data.listAssets("users/ccrs12fy2022simha/DOWNSCALING_PROCESS/5_ALR/")
// var AssetList=ee.data.listAssets("users/ccrs12fy2022simha/DOWNSCALING_PROCESS/5_ALR/SOL_C")



for(var i=0;i<AssetList.assets.length;i++) {
var assetID = ee.data.getAssetAcl(AssetList.assets[i].id)
if ( assetID.all_users_can_read !==true) {
      print(i)
      ee.data.setAssetAcl(AssetList.assets[i].name,{readers:['Gang.Hong@NRCan-RNCan.gc.ca']})
}
}

