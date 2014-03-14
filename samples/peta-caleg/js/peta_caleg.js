(function(exports) {

  var pc = {
    version: "0.0.1"
  };

  // export this to window.peta_caleg
  exports.peta_caleg = pc;

  var gm;
  try {
    gm = google.maps;
  } catch (err) {
    console.warn("the Google Maps JS API is not loaded");
  }

  /*
   * shallow copy the keys of an object into a new object
   */
  pc.copy = function(obj) {
    var copied = {};
    for (var key in obj) {
      copied[key] = obj[key];
    }
    return copied;
  };

  /*
   * merge two or more objects' keys into the first object
   */
  pc.merge = function(obj, other) {
    [].slice.call(arguments, 1).forEach(function(o) {
      if (!o) return;
      for (var key in o) {
        obj[key] = o[key];
      }
    });
    return obj;
  };

  pc.geo = {
  };

  pc.geo.collection = function(topology, key) {
    if (!key) {
      key = Object.keys(topology.objects)[0];
      console.warn("using first topology key:", key);
    }

    var collection = topojson.feature(topology, topology.objects[key]);

    collection.lookup = d3.nest()
      .key(function(d) { return d.id; })
      .rollup(function(d) { return d[0]; })
      .map(collection.features);

    collection.join = function(data, idKey, type) {
      var joined = [];
      switch (type) {
        case "left":
          var rowsById = d3.nest()
            .key(function(d) { return d[idKey]; })
            .rollup(function(d) { return d[0]; })
            .map(data);
          return collection.features.map(function(feature) {
            return {
              feature: feature,
              data: rowsById[feature.id]
            };
          });

        case "right":
          return data.map(function(row) {
            return {
              feature: collection.lookup[row[idKey]],
              data: row
            };
          });

        case "inner":
        default:
          data.forEach(function(row) {
            var id = row[idKey];
            if (id in collection.lookup) {
              joined.push({
                feature: collection.lookup[id],
                data: row
              });
            }
          });
      }
      return joined;
    };

    return collection;
  };

  pc.geo.collapseTopology = function(topology) {
    var features = [];
    for (var key in topology.objects) {
      var f = topojson.feature(topology, topology.objects[key]).features;
      features = features.concat(f);
    }
    return {
      type: "FeatureCollection",
      features: features
    };
  };

  if (gm) {
    pc.geo.styles = {
      basic: new gm.StyledMapType([
        {
          "featureType": "landscape",
          "stylers": [{"visibility": "off"}]
        },
        {
          "featureType": "poi",
          "stylers": [{"visibility": "off"}]
        },
        {
          "featureType": "administrative",
          "elementType": "labels",
          "stylers": [{"visibility": "off"}]
        },
        {
          "featureType": "landscape",
          "stylers": [{"visibility": "off"}]
        },
        {
          "featureType": "road",
          "stylers": [{"visibility": "off"}]
        },
        {
          "featureType": "water",
          "elementType": "labels",
          "stylers": [{"visibility": "off"}]
        }
      ], {
        name: "Basic"
      })
    };
  }

})(this);
