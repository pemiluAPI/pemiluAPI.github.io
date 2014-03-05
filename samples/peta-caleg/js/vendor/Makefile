all: GeoJSON.min.js

%.min.js: %.js
	uglifyjs $< > $@

clean:
	rm -f GeoJSON.min.js
