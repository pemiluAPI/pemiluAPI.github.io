NEARBY_SHAPEFILES ?= ../shapefiles/nearby_countries/*/*.shp

all: data/nearby_countries.topojson

data/nearby_countries.topojson:
	topojson --simplify 1e-7 $(NEARBY_SHAPEFILES) > $@

clean:
	rm -f data/nearby_countries.topojson
