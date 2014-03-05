(function(qs) {

  /**
   * Query string parse and format
   */
  qs.version = "0.1.0";

    // strings that are typically okay to include in the hash
  qs.replacements = {
    "%20": "+",
    "%2C": ","
  };

  qs.encode = function(val) {
    var replace = qs.replacements;
    return encodeURIComponent(val)
      .replace(/(\%[A-F0-9]{2})/g, function(_, hex) {
        return hex in replace
          ? replace[hex]
          : hex;
      });
  };

  qs.decode = function(str) {
    return decodeURIComponent(str.replace(/\+/g, " "));
  };

  // querystring.parse("?foo=a&baz=1") -> {foo: "a", baz: 1}
  qs.parse = function(str, separator) {
    if (str.charAt(0) === "?") {
      str = str.substr(1);
    }

    var query = {};
    str.split(separator || "&").forEach(function(bit) {
      var parts = bit.split("=", 2),
          key = qs.decode(parts[0]),
          value = parts.length > 1
            ? qs.decode(parts[1])
            : true;
      switch (value) {
        case "true":
          value = true;
          break;
        case "false":
          value = false;
          break;
        case "":
          break;
        default:
          var num = +value;
          if (!isNaN(num)) value = num;
      }
      query[key] = value;
    });

    return query;
  };

  // querystring.format({foo: "a", baz: 1}) -> "?foo=a&baz=1"
  qs.format = function(obj, separator, sortKeys) {
    var entries = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key) && typeof obj[key] !== "function" && typeof obj[key] !== "undefined") {
        entries.push({key: key, value: String(obj[key])});
      }
    }
    if (sortKeys) {
      entries.sort(function(a, b) {
        return a.key > b.key ? 1 : a.key < b.key ? -1 : 0;
      });
    }
    return entries.length
      ? entries.map(function(e) {
          return [qs.encode(e.key), qs.encode(e.value)].join("=");
        }).join(separator || "&")
      : "";
  };

})(typeof module === "object" ? module.exports : this.qs = {});
