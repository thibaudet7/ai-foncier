import csv
import json
from pyproj import Transformer
import sys
import argparse

# Argument parsing
parser = argparse.ArgumentParser(description='Convert coordinates from one EPSG to another.')
parser.add_argument('--input', type=str, help='Path to the input CSV file')
parser.add_argument('--output', type=str, help='Path to the output JSON file')
parser.add_argument('--conversion', type=str, help='Conversion type (nouveau-Douala or ancien-Douala)')
args = parser.parse_args()

# Transformer setup based on the conversion type
if args.conversion == "nouveau-Douala":
    transformer = Transformer.from_crs("EPSG:32632", "EPSG:4326", always_xy=True)
elif args.conversion == "ancien-Douala":
    transformer = Transformer.from_crs("Douala 1948 / AEF West", "EPSG:4326", always_xy=True)
else:
    print("Invalid conversion type.")
    sys.exit(1)

# Reading the CSV file and transforming the coordinates
converted_data = {}
with open(args.input, 'r') as csvfile:
    csvreader = csv.reader(csvfile, delimiter=';')
    next(csvreader)  # Skip the header
    for row in csvreader:
        point_name = row[0]
        x_coord = float(row[1])
        y_coord = float(row[2])
        lat, lon = transformer.transform(x_coord, y_coord)
        converted_data[point_name] = [lon, lat]

# Saving the result to a JSON file
with open(args.output, 'w') as jsonfile:
    json.dump(converted_data, jsonfile, indent=4)
