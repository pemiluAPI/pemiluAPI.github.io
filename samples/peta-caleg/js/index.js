var pc = peta_caleg,
    geo = {},
    api = pc.api()
      .key("7941b0baecd128c4de3a9ae63a85fd2c"),
    route = pc.router()
      .notfound(function(error) {
        alert("404: " + error);
      }),
    map,
    currentContext = {},
    contexts = [
      {
        lembaga: "DPD",
        hierarchy: [
          "provinsi",
          "caleg"
        ],
      },
      {
        lembaga: "DPR",
        hierarchy: [
          "provinsi",
          "dapil",
          "partai",
          "caleg"
        ],
      },
      {
        lembaga: "DPRDI",
        hierarchy: [
          "provinsi",
          "dapil",
          "kabKota",
          "partai",
          "caleg"
        ],
      }
    ],
    views = {};

contexts.forEach(function(ctx) {
  var bits = [ctx.lembaga],
      urls = [bits.join("/")];
  ctx.hierarchy.forEach(function(key) {
    bits.push(key, "{" + key + "}");
    urls.push(bits.join("/"));
  });
  urls.forEach(function(url) {
    route.match(url, function(req) {
      var data = merge({}, ctx, req.data);
      console.log("match:", req.url, data);
      setContext(data);
    });
  });
});

var win = d3.select(window)
  .on("hashchange", hashchange)
  .on("load", hashchange);

function hashchange() {
  route(location.hash.substr(1));
}

/*
 * Province list
 */
views.provinsi = function(selection, context, callback) {
  var list = selection.select("ul.provinsi");
  if (list.empty()) {
    list = selection.append("ul")
      .attr("class", "provinsi media-list");
  }

  startLoading(list);
  return getProvinsi(context, function(error, provinsi) {
    finishLoading(list, error);

    if (error) return callback(error);

    var media = list.selectAll("li.provinsi")
      .data(provinsi, getId);

    var enter = media.enter()
      .append("li")
        .attr("class", "provinsi media");

    media.exit().remove();

    enter.call(createMediaListItem);

    enter.select("a.pull-left")
      .classed("provinsi", true)
      .append("svg")
        .attr("class", "media-object peta")
        .call(createProvinsiMap);

    enter.select(".media-header")
      .append("h3")
        .append("a")
          .attr("class", "provinsi")
          .text(function(d) {
            return d.nama;
          });

    media.selectAll("a.provinsi")
      .attr("href", function(d) {
        return "#" + [context.lembaga, "provinsi", d.id].join("/");
      })
      .on("click", toggleActive);

    if (context.provinsi) {
      media.classed("active", function(d) {
        return d.id == context.provinsi;
      });
      return callback(null, media.filter(".active")
        .select(".media-body"));
    } else {
      media.classed("active", false);
    }

    return callback(null, null);
  });
};

/*
 * Candidate list
 */
views.caleg = function(selection, context, callback) {
  var list = selection.select("ul.caleg");
  if (list.empty()) {
    list = selection.append("ul")
      .attr("class", "caleg media-list");
  }

  startLoading(list);
  return getCaleg(context, function(error, caleg) {
    finishLoading(list, error);

    if (error) return callback(error);

    var media = list.selectAll("li.caleg")
      .data(caleg, getId);

    var enter = media.enter()
      .append("li")
        .attr("class", "caleg media");

    enter.call(createMediaListItem);

    media.exit().remove();

    // candidate photo
    enter.select("a.pull-left")
      .classed("caleg", true)
      .append("img")
        .attr("class", "media-object foto")
        .attr("src", function(d) {
          return d.foto_url; // TODO update with new URL
        });

    // candidate name
    enter.select(".media-header")
      .append("h3")
        .append("a")
          .attr("class", "caleg")
          .text(function(d) {
            return d.nama;
          });

    var table = enter.select(".media-body")
      .append("table")
        .attr("class", "table caleg");

    // fields to display in our table
    var fields = [
      {key: "jenis_kelamin", label: "Jenis Kelamin"},
      {key: "tanggal_lahir", label: "Tanggal Lahir"},
      {key: "tempat_lahir", label: "Tempat Lahir"},
      {key: "agama", label: "Agama"},
      {key: "tingaal", label: "Tingaal"},
    ];

    // create the fields table
    var row = table.selectAll("tr")
      .data(function(d) {
        return fields.map(function(field) {
          return merge({}, field, {
            value: d[field.key]
          });
        });
      })
      .enter()
        .append("tr");
    row.append("td")
      .text(function(d) {
        return d.value;
      });
    row.append("th")
      .text(function(d) {
        return d.label;
      });

    // update the link hrefs
    media.selectAll("a.caleg")
      .attr("href", function(d) {
        return "#" + getHierarchyHref(context, "caleg", d.id);
      })
      .on("click", toggleActive);

    // only if the context specifies a candidate
    if (context.caleg) {
      media.classed("active", function(d) {
        return d.id == context.caleg;
      });
      return callback(null, media.filter(".active")
        .select(".media-body"));
    } else {
      media.classed("active", false);
    }

    return callback(null, null);
  });
};

// lembaga-specific nav elements
var navLembaga = d3.select("#nav-provinsi")
  .selectAll("li")
    .data(contexts)
    .enter()
      .append("li");

// NOTE: navLembaga is a reference to the <li> items because
// that's where Bootstrap wants the "active" class set
navLembaga
  .append("a")
    .attr("href", function(d) {
      return "#" + d.lembaga;
    })
    .text(function(d) {
      return d.lembaga;
    });

// lembaga-specific section divs
var sectionLembaga = d3.select("#lembaga")
  .selectAll("div")
    .data(contexts)
    .enter()
      .append("div")
        .attr("class", "lembaga")
        .attr("id", function(d) {
          return "lembaga-" + d.lembaga;
        });

function setContext(data) {
  var lembaga = data.lembaga;

  // toggle the active class on the nav links
  navLembaga
    .classed("active", function(d) {
      return d.lembaga === lembaga;
    });

  // get the context object for the active lembaga
  var context = navLembaga.filter(".active")
    .datum();

  // disable all of the lembaga sections
  sectionLembaga.classed("active", false);

  if (context) {
    // get a copy of the view hierarchy, and select
    // the root node for this lembaga (then flip its active class)
    var hierarchy = context.hierarchy.slice(),
        root = d3.select("#lembaga-" + lembaga)
          .classed("active", true);

    // start descending into the hierarchy
    nextView(null, root);

    function nextView(error, selection) {
      if (error) return done(error);
      // if there are any more levels in the hierarchy...
      if (hierarchy.length) {
        // get the name of the next view
        var name = hierarchy.shift();
        // if the view exists...
        if (name in views) {
          // our next step is nextView() if there's data for that view,
          // otherwise done()
          var next = (name in data)
            ? nextView
            : done;
          // call that view on the selection
          selection.call(views[name], data, next);
        } else {
          console.warn("no such view:", name);
          return done(null, selection);
        }
      } else {
        return done(null, selection);
      }
    }
  }

  // consolidate done-ness to a single function to keep it DRY
  function done(error, selection) {
    if (error) console.error("context error:", error);
  }
}

/*
 * Get a list of admin provinces for the given context.
 */
function getProvinsi(context, callback) {
  var params = {
    lembaga: context.lembaga
  };
  return api.get("provinsi", params, function(error, res) {
    if (error) return callback(error);
    var provinsi = res.results.provinsi;
    console.log("got provinsi:", provinsi);
    return callback(null, provinsi);
  });
}

/*
 * Get a list of candidates for the given context.
 */
function getCaleg(context, callback) {
  var params = {
    lembaga:  context.lembaga,
    provinsi: context.provinsi,
    dapil:    context.dapil,
    kabKota:  context.kabKota
  };
  return api.get("caleg", params, function(error, res) {
    var caleg = res.results.caleg;
    console.log("got caleg:", caleg);
    return callback(null, caleg);
  });
}

/*
 * Get a list of parties for the given context. This just calls getCaleg()
 * and groups the resulting candidates by their party name. The callback gets
 * an array of objects that look like:
 *
 * {
 *   id: <party ID>,
 *   nama: <party name>,
 *   caleg: [<array of candidates>]
 * }
 */
function getPartai(context, callback) {
  return getCaleg(context, function(error, caleg) {
    if (error) return callback(error);

    var partai = d3.nest()
      .key(function(d) { return d.partai.id; })
      .sortKeys(d3.ascending)
      .entries(caleg)
      .map(function(d) {
        return {
          id: d.key,
          nama: d.values[0].partai.nama,
          caleg: d.values
        };
      });
    console.log("got partai:", partai);

    return callback(null, partai);
  });
}

function createProvinsiMap(selection) {
  // TODO
}

/*
 * given a context with hierarchy, get the link to this key=id combination.
 */
function getHierarchyHref(context, key, id) {
  var index = context.hierarchy.indexOf(key);
  if (index === -1) {
    console.warn("key not found in hierarchy:", key, hierarchy);
    return null;
  }
  var bits = [context.lembaga];
  for (var i = 0; i < index; i++) {
    var k = context.hierarchy[i];
    bits.push(k, context[k]);
  }
  bits.push(key, id);
  return bits.join("/");
}

/*
 * used all over the place as an id accessor function
 */
function getId(d) {
  return d.id;
}

/*
 * shallow copy the keys of an object into a new object
 */
function copy(obj) {
  var copied = {};
  for (var key in obj) {
    copied[key] = obj[key];
  }
  return copied;
}

/*
 * merge two or more objects' keys into the first object
 */
function merge(obj, other) {
  [].slice.call(arguments, 1).forEach(function(o) {
    if (!o) return;
    for (var key in o) {
      obj[key] = o[key];
    }
  });
  return obj;
}

/*
 * set up the Bootstrap media-list scaffolding for a media item
 */
function createMediaListItem(selection) {
  selection.classed("media", true);

  selection.append("a")
    .attr("class", "pull-left");

  selection.append("div")
    .attr("class", "media-header");

  selection.append("div")
    .attr("class", "media-body");
}

function selectParent(node, klass) {
  var parent = node.parentNode;
  while (!parent.classList.contains(klass)) {
    parent = parent.parentNode;
    if (!parent || !parent.classList) return null;
  }
  return d3.select(parent);
}

function toggleActive(d) {
  var parent = selectParent(this, "media");
  if (parent) {
    if (parent.classed("active")) {
      d3.event.preventDefault();
    }
    parent.classed("active", !parent.classed("active"));
  }
}

function startLoading(selection) {
  selection
    .classed("loading", true)
    .classed("error", false);
}

function finishLoading(selection, error) {
  selection
    .classed("loading", false)
    .classed("error", !!error);
  if (error) {
    selection.insert("div", "*")
      .attr("class", "alert alert-danger")
      .text(error);
  }
}
