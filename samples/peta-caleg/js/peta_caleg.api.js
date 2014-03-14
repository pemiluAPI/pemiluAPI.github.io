(function() {

  peta_caleg.api = function() {
    var key = "XXX",
        base = "http://api.pemiluapi.org/",
        api = {},
        cache = {},
        last;

    // get/set the API key
    api.key = function(x) {
      if (!arguments.length) return key;
      key = x;
      return api;
    };

    // get/set the API base URL
    api.base = function(x) {
      if (!arguments.length) return base;
      base = x;
      return api;
    };

    api.get = function(uri, params, callback) {
      if (arguments.length === 2) {
        callback = params;
        params = {};
      }
      params.apiKey = key;
      var url = base + uri;
      if (params) {
        url += "?" + qs.format(params);
      }
      if (cache && cache[url]) {
        return callback(null, cache[url]);
      }
      return last = d3.json(url, function(error, res) {
        if (error) return callback(error);
        if (cache) cache[url] = res.data || res;
        last = null;
        return callback(null, res.data || res);
      });
    };

    api.abort = function() {
      if (last) last.abort();
      return api;
    };

    // get/set cache capability (true/false)
    api.cache = function(x) {
      if (!arguments.length) return !!cache;
      else if (x) cache = {};
      else cache = null;
      return api;
    };

    return api;
  };

})();
