(function() {

  peta_caleg.router = function() {
    var routes = {},
        redirects = {},
        notfound = function(req) {
          console.error("404:", req.url, req.error);
        },
        router = function(url) {
          var data;
          for (var pattern in routes) {
            if (data = router.matches(url, pattern)) {
              var callback = routes[pattern];
              return callback({
                url: url,
                route: pattern,
                data: data
              });
            } else {
            }
          }
          return notfound({
            url: url,
            code: 404,
            error: "not found",
            data: null
          });
        };

    router.match = function(pattern, callback) {
      routes[pattern] = callback;
      return router;
    };

    router.notfound = function(callback) {
      notfound = callback;
      return router;
    };

    router.matches = function(url, pattern) {
      var keys = [],
          re = new RegExp("^" + pattern.replace(/{(\w+)}/g, function(str, key) {
            keys.push(key);
            return "([^/]+)";
          }) + "$"),
          match = url.match(re);
      // console.log("re:", re, "->", match);
      if (match) {
        var data = {};
        for (var i = 1, len = match.length; i < len; i++) {
          var key = keys[i - 1];
          data[key] = match[i];
        }
        return data;
      }
      return false;
    };

    return router;
  };

})();
