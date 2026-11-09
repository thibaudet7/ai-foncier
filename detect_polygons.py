import cv2
import numpy as np
import geopandas as gpd
from shapely.geometry import Polygon
import json

# Load the image
image_path = 'image/cropped_parcel.png'
img = cv2.imread(image_path)

# Convert to grayscale
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Threshold the image to get a binary image
_, thresh = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY_INV)

# Find contours
contours, _ = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

# Define minimum and maximum area thresholds (modifiable by the user)
min_area_threshold = 1000
max_area_threshold = 100000

# Function to calculate the curvature of a contour
def has_high_curvature(contour, curvature_threshold=0.15):
    area = cv2.contourArea(contour)
    if area == 0:
        return False
    curvature = cv2.arcLength(contour, True) / area
    return curvature > curvature_threshold

# Convert contours to polygons and filter by area
def contours_to_polygons(contours):
    polygons = []
    for contour in contours:
        # Skip contours with high curvature
        if has_high_curvature(contour):
            continue

        # Approximate the contour to get polygon vertices
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.03 * peri, True)  # Reduced tolerance for more edges
        
        # Only keep convex contours
        if not cv2.isContourConvex(approx):
            continue

        # Convert the contour to a polygon
        if len(approx) >= 3:  # Allow polygons with 3 or more edges
            polygon = Polygon(approx.reshape(-1, 2))
            if min_area_threshold < polygon.area < max_area_threshold:
                polygons.append(polygon)
    return polygons

# Convert contours to polygons
polygons = contours_to_polygons(contours)

# Count and print the number of detected polygons
print(f"Number of polygons detected: {len(polygons)}")

# Create a GeoDataFrame from the polygons
gdf = gpd.GeoDataFrame({'geometry': polygons})

# Save the GeoDataFrame to a GeoJSON file
output_geojson = 'georef/polygons.geojson'
gdf.to_file(output_geojson, driver='GeoJSON')

# Optionally, visualize the polygons on the image
for poly in polygons:
    coords = np.array(poly.exterior.coords, dtype=np.int32)
    cv2.polylines(img, [coords], isClosed=True, color=(0, 255, 0), thickness=2)

# Create a named window that can be resized
cv2.namedWindow('Detected Polygons', cv2.WINDOW_NORMAL)

# Show the image in the window
cv2.imshow('Detected Polygons', img)

# Wait until a key is pressed to close the window
cv2.waitKey(0)
cv2.destroyAllWindows()

# Create a dictionary to store the results
result = {}
for i, poly in enumerate(polygons):
    result[f'Polygon_{i}'] = list(poly.exterior.coords)

# Convert the result to JSON format
result_json = json.dumps(result, indent=4)

# Save the result to a file
with open('jsonfolder/polygon_data.json', 'w') as f:
    f.write(result_json)
