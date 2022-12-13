# NEON

1. H5ToGeotif.r:  a batch processing of multiple h5 files into Geotiff files using R language.
2. KML_batch.ipynb: a batch editing kml files of NEON DP1 files to remove point coordinate in kml and keep polygon coordinates.
3. NEON_readmeToCsv.ipynb: convert the readme file of DP3 product in one site to a csv file with Xmin and Yim.
4. Shp2Zip.ipynb: a batch processing to convert ship file to zip for unloading to GEE assets conveniently.
5. SimHSI.ipynb: a simulating process to convert NEON hyperspectral to S2 based on S2 SRF (no angle inlcuded).
6. Site_ImgSelection.js: one site clear sky S2 selection based on the polygons uploaded to GEE assets, the output is a csv file, the code need run in Google Earth Engine code editor.
7. kml2shp_batch.R: R code to convert edited kml file (polygon only) to shp file in a batch way. 
8. SimHSI_ver2_single.ipynb: a single process to simulate NEON hyperspectral as S2 based on S2 SRF, the geomtric angles are included. Two outputs: one: 1m simulated result, the other: 10m simulated result.
9. SimHSI_ver2_batch.ipynb: a batch processing of simulating NEON hyperspectral as S2 based on S2 SRF, the geomtric angles are included. Two outputs: one: 1m simulated result, the other: 10m simulated result.
