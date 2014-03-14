(function(exports) {

  var pc = peta_caleg,
      ui = pc.ui = {};

  ui.mediaList = function() {
    var titleElement = "h3",
        type = "item",
        icon,
        body,
        href = function(d) {
          return null;
        },
        name = function(d) {
          return d.nama;
        };

    var mediaList = function(selection) {
      selection
        .classed("media", true);

      if (icon) {
        selection.append("a")
          .attr("class", "pull-left icon")
          .classed(type, true)
          .call(icon);
      }

      var header = selection.append("div")
        .attr("class", "media-header");

      header.append(titleElement)
        .attr("class", "title")
        .append("a")
          .attr("class", type)
          .text(name);

      selection.append("div")
        .attr("class", "media-body")
        .call(body || noop);
    };

    mediaList.update = function(selection, data, key) {
      var items = selection.selectAll("li." + type)
            .data(data, key),
          enter = items.enter()
            .append("li")
              .attr("class", type)
              .call(mediaList);
      items.exit().remove();
      items.selectAll("a." + type)
        .attr("href", href);
      return items
        .classed("selected", false);
    };

    mediaList.activate = function(selection, active) {
      return selection
        .classed("active", active)
        .filter(active);
    };

    mediaList.titleElement = function(el) {
      if (!arguments.length) return titleElement;
      titleElement = el;
      return mediaList;
    };

    mediaList.itemName = function(fn) {
      if (!arguments.length) return name;
      name = fn;
      return mediaList;
    };

    mediaList.icon = function(fn) {
      if (!arguments.length) return icon;
      icon = fn;
      return mediaList;
    };

    mediaList.body = function(fn) {
      if (!arguments.length) return body;
      body = fn;
      return mediaList;
    };

    mediaList.href = function(fn) {
      if (!arguments.length) return href;
      href = fn;
      return mediaList;
    };

    mediaList.type = function(str) {
      if (!arguments.length) return type;
      type = str;
      return mediaList;
    };

    return mediaList;
  };

  ui.mapIcon = function() {
    var bg,
        margin = 5,
        proj = d3.geo.mercator(),
        path = d3.geo.path()
          .projection(proj),
        feature = function(d) {
          return d;
        };

    var icon = function(selection) {
      var svg = selection.append("svg")
        .attr("class", "icon media-object")
        .datum(feature)
        .filter(function(d) {
          return d;
        });

      svg.attr("viewBox", viewBox);

      if (bg) {
        svg.append("g")
          .attr("class", "bg")
          .call(bg);
      }

      svg.append("g")
        .attr("class", "fg")
        .append("path")
          .attr("d", path);
    };

    icon.bg = function(fn) {
      if (!arguments.length) return bg;
      bg = fn;
      return icon;
    };

    icon.proj = function(p) {
      if (!arguments.length) return proj;
      proj = p;
      return icon;
    };

    icon.feature = function(m) {
      if (!arguments.length) return feature;
      feature = d3.functor(m);
      return icon;
    };

    icon.margin = function(m) {
      if (!arguments.length) return margin;
      margin = m;
      return icon;
    };

    icon.path = function(p) {
      if (!arguments.length) return path;
      path = p;
      proj = path.projection();
      return icon;
    };

    function viewBox(d) {
      var bounds = path.bounds(d),
          x = bounds[0][0],
          y = bounds[0][1],
          w = bounds[1][0] - x,
          h = bounds[1][1] - y,
          ew = this.offsetWidth,
          eh = this.offsetHeight,
          scale = Math.max(w, h) / Math.min(ew, eh),
          m = margin * scale;
      return [x - m, y - m, w + m * 2, h + m * 2].join(" ");
    }

    return icon;
  };

  ui.mediaList.geo = function() {
    var icon = ui.mapIcon(),
        list = ui.mediaList()
          .type("geo")
          .itemName(function(d) {
            return d.nama;
          })
          .icon(icon);

    list.feature = function(f) {
      if (!arguments.length) return icon.feature();
      icon.feature(f);
      return list;
    };

    return list;
  };

  ui.mediaList.caleg = function() {
    var df = d3.time.format("%Y-%m-%d"),
        now = new Date(),
        jenisMap = {
          "L": "laki-laki",
          "P": "perempuan"
        },
        tinggalFields = [
          "provinsi",
          "kab_kota",
          "kecamatan",
          "kelurahan"
        ],
        fields = [
          // gender
          {label: "jenis kelamin", key: function(d) {
            return (d.jenis_kelamin in jenisMap)
              ? jenisMap[d.jenis_kelamin]
              : d.jenis_kelamin;
          }},
          // age
          {label: "usia", key: function(d) {
            var date = df.parse(d.tanggal_lahir);
            if (date) {
              var years = now.getFullYear() - date.getFullYear();
              return years + " thn";
            }
            return null;
          }},
          // place of birth
          {label: "tempat lahir", key: "tempat_lahir"},
          // religion
          {label: "agama", key: "agama"},
          // place of residence
          {label: "tempat tinggal", key: function(d) {
            var bits = tinggalFields.map(function(f) {
                  return d[f + "_tinggal"];
                })
                .filter(function(d) {
                  return d;
                });
            return bits.join(", ");
          }},
          // party
          {label: "partai", key: function(d) {
             return d.partai ? d.partai.nama : null;
          }}
        ],
        list = ui.mediaList()
          .type("caleg")
          .itemName(function(d) {
            return [d.urutan + ".", d.nama].join(" ");
          })
          .icon(function(selection) {
            selection.append("img")
              .attr("src", function(d) {
                return d.foto_url;
              });
          })
          .body(function(selection) {
            var tbody = selection.append("table")
              .attr("class", "caleg fields")
              .append("tbody");

            var tr = tbody.selectAll("tr")
              .data(function(d) {
                return fields.map(function(field) {
                  var value = (typeof field.key === "function")
                    ? field.key(d)
                    : d[field.key];
                  return {
                    d: d,
                    label: field.label,
                    value: value
                  };
                })
                .filter(function(d) {
                  return d.value;
                });
              })
              .enter()
                .append("tr");

            tr.append("th")
              .text(function(d) {
                return d.label;
              });

            tr.append("td")
              .text(function(d) {
                return d.value;
              });

          });

    return list;
  };

  ui.mediaList.partai = function() {
    var list = ui.mediaList()
      .type("partai")
      .itemName(function(d) {
        return d.nama;
      })
      .icon(function(selection) {
        selection.append("img")
          .attr("src", function(d) {
            return d.foto_url; // FIXME logo_small?
          });
      });

    return list;
  };

  ui.apiView = function() {
    var media = ui.mediaList(),
        type = "generic",
        api = pc.api(),
        url = function() {
          // TODO implement
          return null;
        },
        active = function(d, context) {
          return d.id === context;
        },
        fetch = function(context, callback) {
          callback("no fetch() specified", context);
        },
        view = function(selection, context, callback) {
          console.log("view:", selection, context, callback);
          var list = selection.select("ul." + type);
          if (list.empty()) {
            list = selection.append("ul")
              .attr("class", "media-list " + type);
          }

          var req = fetch.call(api, context, function(error, data) {
            if (error) return callback(error);
            var items = media.update(list, data, getId),
                selected = media.activate(items, function(d) {
                  return active(d, context);
                });
            return callback(null, selected.empty() ? null : selected);
          });

          if (req) {
            list.call(loading, req);
          }

          return req;
        };

    function loading(selection, req) {
      console.info("loading:", req);
      var progress = selection
            .classed("loading", true)
            .classed("error", false)
            .append("div")
              .attr("class", "progress"),
          bar = progress.append("div")
            .attr("class", "progress-bar")
            .attr("role", "progressbar")
            .style("width", "0%");
      req.on("progress", function() {
        var e = d3.event,
            total = e.total || 1024 * 1024;
        bar.transition()
          .duration(200)
          .style("width", Math.round(e.loaded / total * 100) + "%");
      });
      req.on("load.progress", function(e) {
        progress.remove();
        selection
          .classed("loading", false);
      });
      req.on("error.progress", function(e) {
        console.warn("error:", req);
        progress.remove();
        selection
          .classed("loading", false)
        .classed("error", true);
      });
    }

    view.href = function(x) {
      if (!arguments.length) return media.href();
      media.href(x);
      return view;
    };

    view.api = function(x) {
      if (!arguments.length) return api;
      api = x;
      return view;
    };

    view.fetch = function(fn) {
      if (!arguments.length) return fetch;
      fetch = fn;
      return view;
    };

    view.media = function(list) {
      if (!arguments.length) return media;
      media = list;
      return view;
    };

    view.type = function(str) {
      if (!arguments.length) return type;
      type = str;
      return view;
    };

    view.active = function(fn) {
      if (!arguments.length) return active;
      active = fn;
      return view;
    };

    return view;
  };

  ui.apiView.provinsi = function() {
    var collection,
        view = ui.apiView()
          .fetch(function(context, callback) {
            return this.get("candidate/api/provinsi", {}, function(error, res) {
              return error
                ? callback(error)
                : callback(null, res.results.provinsi);
            });
          })
          .type("provinsi")
          .active(function(d, context) {
            return d.id == context.provinsi;
          })
          .media(ui.mediaList.geo()
            .type("provinsi")
            .feature(function(d) {
              return collection
                ? collection.lookup[d.id]
                : null;
            }));

    view.collection = function(x) {
      if (!arguments.length) return collection;
      collection = x;
      return view;
    };

    view.path = function(path) {
      if (!arguments.length) return view.media().icon().path();
      view.media().icon().path(path);
      return view;
    };

    return view;
  };

  ui.apiView.caleg = function() {
    var view = ui.apiView()
      .fetch(function(context, callback) {
        return this.get("candidate/api/caleg", {
            lembaga: context.lembaga,
            provinsi: context.provinsi,
            partai: context.partai,
            dapil: context.dapil
            // TODO: other params
          }, function(error, res) {
            return error
              ? callback(error)
              : callback(null, res.results.caleg);
          });
      })
      .active(function(d, context) {
        return d.id == context.caleg;
      })
      .type("caleg")
      .media(ui.mediaList.caleg());

    return view;
  };

  function getId(d) {
    return d.id;
  }

  function noop() {
  }

})(this);
