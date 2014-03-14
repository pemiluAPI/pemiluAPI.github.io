var pc = peta_caleg,
    geo = {},
    api = pc.api()
      .key("7941b0baecd128c4de3a9ae63a85fd2c"),
    route = pc.router()
      .match("", function(req) {
        location.hash = "DPD";
      })
      .notfound(function(error) {
        alert("404: " + error);
      }),
    map,
    currentContext = {},
    contexts = [
      {
        lembaga: "DPD",
        hierarchy: [
          pc.ui.apiView.provinsi()
            .href(function(d) {
              return ["#DPD", "provinsi", d.id].join("/");
            }),
          pc.ui.apiView.caleg()
            .href(function(d) {
              return ["#DPD", "provinsi", currentContext.provinsi,
                "caleg", d.id].join("/");
            })
        ],
      },
      {
        lembaga: "DPR",
        hierarchy: [
          /*
          "provinsi",
          "dapil",
          "partai",
          "caleg"
          */
        ],
      },
      {
        lembaga: "DPRDI",
        hierarchy: [
          /*
          "provinsi",
          "dapil",
          "kabKota",
          "partai",
          "caleg"
          */
        ],
      }
    ],
    views = pc.ui.apiView;

function setupView(view) {
  return view
    .api(api);
}

contexts.forEach(function(ctx) {
  var bits = [ctx.lembaga],
      urls = [bits.join("/")];
  ctx.hierarchy.forEach(function(view) {
    var key = view.media().type();
    bits.push(key, "{" + key + "}");
    urls.push(bits.join("/"));
  });
  urls.forEach(function(url) {
    route.match(url, function(req) {
      var data = merge({}, ctx, req.data);
      console.log("route:", req.url, data);
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

// lembaga-specific nav elements
var navLembaga = d3.select("#nav-lembaga")
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
        var view = hierarchy.shift();
        // if the view exists...
        if (typeof view === "function") {
          // our next step is nextView() if there's data for that view,
          // otherwise done()
          var next = (name in data)
            ? nextView
            : done;
          setupView(view);
          // call that view on the selection
          selection.call(view, data, next);
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

function scrollIntoView(d) {
  this.scrollIntoView();
}
