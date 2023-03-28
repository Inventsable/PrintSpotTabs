/**
 * PrintSpotTabs.jsx by https://github.com/Inventsable
 * For revisions email: tom@inventsable.cc
 *
 * Script to produce organized swatch tabs from designated layer for CMYK and Spot Colors
 *
 * See demonstration here:
 * https://gfycat.com/wellinformeddifferentdungenesscrab
 */

// All options below are configurable. Numbers are in pixel dimensions, "name" keys are what appear in Layers panel
var options = {
  origin: [200, 200], // The [x,y] position of the first swatch. This is relative to your currently active Artboard (x+ is right, y+ is up)
  //
  swatch: {
    height: 100, // Main dimensions for the swatch object
    width: 100,
    padding: 10, // Padding included on all sides (swatch size + padding = Tab dimensions)
    name: "Swatch",
  },
  //
  text: {
    height: 30, // Amount of pixels added to bottom of Tab to make room for text
    size: 12, // Size of font
    font: "ACaslonPro-Bold", // Name of fontface used
    // ^ Fonts in AI use metadata name, not what appears in the menu. You can run a script containing this to see the string required here when you have text with the desired font selected:
    // alert(app.selection[0].textRange.characterAttributes.textFont)
    name: "Label",
    forceUppercase: true, // When true, Tab text is always UPPERCASE
  },
  //
  // Tabs will appear with pure white fill and pure black stroke by default
  tab: {
    suffix: " Tab", // Syntax for Spot Colors in Layers panel is "[SPOT] [SUFFIX]"
    name: "Tab",
    strokeWidth: 2, // Size of stroke around Tab
  },
  //
  spacing: 10, // Amount of pixels between each Tab/Color
  layerName: "Artwork", // Name of layer to target for Tab creation
  layerDestinationName: "Tabs", // Name of layer to create and place Tabs in when script is run
};

/**
 * Polyfills and utilites for making JSX more like modern ES6
 */
Array.prototype.forEach = function (callback) {
  for (var i = 0; i < this.length; i++) callback(this[i], i, this);
};
Array.prototype.filter = function (callback) {
  var filtered = [];
  for (var i = 0; i < this.length; i++)
    if (callback(this[i], i, this)) filtered.push(this[i]);
  return filtered;
};
Array.prototype.map = function (callback) {
  var mappedParam = [];
  for (var i = 0; i < this.length; i++)
    mappedParam.push(callback(this[i], i, this));
  return mappedParam;
};
CMYKColor.prototype.create = function (values) {
  this.cyan = values[0];
  this.magenta = values[1];
  this.yellow = values[2];
  this.black = values[3];
  return this;
};
function get(type, parent, deep) {
  if (arguments.length == 1 || !parent) {
    parent = app.activeDocument;
    deep = false;
  }
  var result = [];
  if (!parent[type]) return [];
  for (var i = 0; i < parent[type].length; i++) {
    result.push(parent[type][i]);
    if (parent[type][i][type] && deep)
      result = [].concat(result, get(type, parent[type][i], deep));
  }
  return result || [];
}

/**
 * Utility functions
 */
var doc = app.activeDocument;
function createSwatchTabGroup(xOrigin, yOrigin, item) {
  try {
    var layer = findLayerByName(options.layerDestinationName);
    if (!layer) {
      layer = doc.layers.add();
      layer.name = options.layerDestinationName;
    }
    var tab = createSwatchTabBox(xOrigin, yOrigin);
    var swatch = createSwatchBox(xOrigin, yOrigin);
    var group = doc.groupItems.add();
    var text = createSwatchLabel(xOrigin, yOrigin);
    tab.move(group, ElementPlacement.INSIDE);
    swatch.move(group, ElementPlacement.INSIDE);
    text.move(group, ElementPlacement.INSIDE);
    if (/CMYK/.test(item.type)) {
      text.contents = "CMYK";
      var quads = createQuadrantInside(swatch);
      var subgroup = doc.groupItems.add();
      swatch.move(subgroup, ElementPlacement.INSIDE);
      quads.move(subgroup, ElementPlacement.INSIDE);
      subgroup.name = options.swatch.name;
      subgroup.move(group, ElementPlacement.INSIDE);
      group.name = "CMYK Tab";
    } else {
      swatch.fillColor = item.color;
      text.contents = item.color.spot.name.replace(/pantone\s/i, "PANTONE\r\n");
      if (options.text.forceUppercase)
        text.contents = text.contents.toUpperCase();
      group.name = item.color.spot.name + " " + options.tab.name;
    }
    group.move(layer, ElementPlacement.INSIDE);
  } catch (err) {
    alert(err);
  }
}
function createSwatchTabBox(xOrigin, yOrigin) {
  var offsets = [
    { x: options.swatch.width + options.swatch.padding * 2, y: 0 },
    {
      x: options.swatch.width + options.swatch.padding * 2,
      y: (options.swatch.height + options.swatch.padding * 3) * -1,
    },
    {
      x: options.swatch.width,
      y:
        (options.swatch.height +
          options.text.height +
          options.swatch.padding * 2) *
        -1,
    },
    {
      x: 0,
      y:
        (options.swatch.height +
          options.text.height +
          options.swatch.padding * 2) *
        -1,
    },
    { x: 0, y: 0 },
    { x: options.swatch.width + options.swatch.padding * 2, y: 0 },
  ];
  var points = offsets.map(function (anchor) {
    return [anchor.x + xOrigin, anchor.y + yOrigin];
  });
  var item = doc.pathItems.add();
  item.setEntirePath(points);
  item.name = options.tab.name;
  item.fillColor = new CMYKColor().create([0, 0, 0, 0]);
  item.strokeColor = new CMYKColor().create([0, 0, 0, 100]);
  item.strokeWidth = options.tab.strokeWidth;
  item.closed = true;
  return item;
}
function createSwatchBox(xOrigin, yOrigin) {
  var offsets = [
    {
      x: options.swatch.width + options.swatch.padding,
      y: (options.swatch.height + options.swatch.padding) * -1,
    },
    {
      x: options.swatch.padding,
      y: (options.swatch.height + options.swatch.padding) * -1,
    },
    { x: options.swatch.padding, y: options.swatch.padding * -1 },
    {
      x: options.swatch.width + options.swatch.padding,
      y: options.swatch.padding * -1,
    },
    {
      x: options.swatch.width + options.swatch.padding,
      y: (options.swatch.height + options.swatch.padding) * -1,
    },
  ];
  var points = offsets.map(function (anchor) {
    return [anchor.x + xOrigin, anchor.y + yOrigin];
  });
  var item = doc.pathItems.add();
  item.setEntirePath(points);
  item.name = options.swatch.name;
  return item;
}
function createSwatchLabel(xOrigin, yOrigin) {
  var offsets = [
    {
      x: options.swatch.padding,
      y: (options.swatch.height + options.swatch.padding * 1.5) * -1,
    },
  ].map(function (anchor) {
    return [anchor.x + xOrigin, anchor.y + yOrigin];
  });
  var item = doc.textFrames.add();
  item.left = offsets[0][0];
  item.top = offsets[0][1];
  item.contents = "Lorem ipsum".toUpperCase();
  item.textRange.characterAttributes.size = options.text.size;
  item.textRange.characterAttributes.textFont = findFontFromString(
    options.text.font
  );
  item.strokeColor = new NoColor();
  item.closed = true;
  return item;
}
function findLayerByName(name, useRegex) {
  if (arguments.length < 2) useRegex = false;
  for (var i = 0; i < app.activeDocument.layers.length; i++) {
    var layer = app.activeDocument.layers[i];
    if (!useRegex && layer.name == name) return layer;
    else if (useRegex && new RegExp(name, "i").test(layer.name)) return layer;
  }
  return false;
}
function getArtworkItemColors() {
  var layer = findLayerByName("Artwork", true);
  var list = get("pathItems", layer)
    .filter(function (item) {
      return (
        !/no\s?color/i.test(item.fillColor + "") &&
        /CMYK|Spot/i.test(item.fillColor + "")
      );
    })
    .map(function (item) {
      return {
        type: (item.fillColor + "").replace(/[\[\]]/gm, ""),
        color: item.fillColor,
      };
    });
  list = cleanUpColorList(list);
  return list;
}
function cleanUpColorList(list) {
  var res = [],
    hasCMYK = false;
  for (var i = 0; i < list.length; i++) {
    if (/CMYK/.test(list[i].type) && !hasCMYK) {
      res.push(list[i]);
      hasCMYK = true;
    } else if (/spot/i.test(list[i].type)) res.push(list[i]);
  }
  return res.sort(function (a, b) {
    if (/CMYK/.test(a.type)) return -1;
    else if (/CMYK/.test(b.type)) return 1;
    else return 0;
  });
}
function findFontFromString(string) {
  for (var i = 0; i < app.textFonts.length; i++) {
    var item = app.textFonts[i];
    if (item.name == string) return item;
  }
  return null;
}
function createQuadrantInside(item) {
  var subgroup = doc.groupItems.add();
  var b = getObjectiveBounds(item);
  var centerX = item.geometricBounds[0] + b.width / 2;
  var centerY = item.geometricBounds[1] + (b.height / 2) * -1;
  var quads = [
    {
      section: "C",
      path: [
        [b.left, b.bottom],
        [b.left, b.top],
        [centerX, centerY],
        [b.left, b.bottom],
      ],
      color: [100, 0, 0, 0],
    },
    {
      section: "M",
      path: [
        [b.left, b.top],
        [b.right, b.top],
        [centerX, centerY],
        [b.left, b.top],
      ],
      color: [0, 100, 0, 0],
    },
    {
      section: "Y",
      path: [
        [b.right, b.top],
        [b.right, b.bottom],
        [centerX, centerY],
        [b.right, b.top],
      ],
      color: [0, 0, 100, 0],
    },
    {
      section: "K",
      path: [
        [b.left, b.bottom],
        [b.right, b.bottom],
        [centerX, centerY],
        [b.left, b.bottom],
      ],
      color: [0, 0, 0, 100],
    },
  ];
  quads.forEach(function (quad) {
    var shape = doc.pathItems.add();
    shape.setEntirePath(quad.path);
    shape.fillColor = new CMYKColor().create(quad.color);
    shape.name = quad.section;
    shape.move(subgroup, ElementPlacement.INSIDE);
    shape.strokeColor = new NoColor();
    shape.closed = true;
  });
  subgroup.name = "CMYK quadrants";
  return subgroup;
}
function getObjectiveBounds(item) {
  var b = item.geometricBounds;
  return {
    left: b[0],
    top: b[1],
    right: b[2],
    bottom: b[3],
    width: b[2] - b[0],
    height: (b[3] - b[1]) * -1,
  };
}

// Main function and auto-execution section
function main() {
  var items = getArtworkItemColors();
  if (!items.length) {
    alert("There are no Spot or CMYK Colors in this document");
    return null;
  }
  items.forEach(function (item, i) {
    createSwatchTabGroup(
      options.origin[0] +
        (options.swatch.width + options.swatch.padding * 2 + options.spacing) *
          i,
      options.origin[1],
      item
    );
  });
}
main();
