sg.geometry = sg.geometry || function()
{
	var stringStartsWith = function(string, prefix)
	{
		return string.slice(0, prefix.length) == prefix;
	};
	var geom = {};
	var trimParens = /^\s*\(?(.*?)\)?\s*$/;
	var spaces = /\s+/;
	var commaSplit = /\s*,\s*/;
	var parentSplit = /\)\s*,\s*\(/;
	var doubleParenComma = /\)\s*\)\s*,\s*\(\s*\(/;
	var typeStr = /^\s*(\w+)\s*\(\s*(.*)\s*\)\s*$/;
	
	var trim = function(str)
	{
		return str.replace(/^\s+|\s+$/gm, "");
	};
	var parseLineString = function(lineStrStr)
	{
		var lineStr = new sg.geometry.LineString;
		var ptsStr = lineStrStr.split(commaSplit);
		var plength = ptsStr.length;
		for (var i = 0 ; i < plength ; i++)
		{
			var pt = [];
			var xyStr = ptsStr[i].split(spaces);
			lineStr.path.push(new sg.geometry.Point(parseFloat(xyStr[0]), parseFloat(xyStr[1])));
		}
		lineStr.update();
		return lineStr;
	};
	var parsePolygon = function(polyStr)
	{
		var polygon = new sg.geometry.Polygon;
		var ringsStr = trimParens.exec(polyStr)[1].split(parentSplit);
		
		var rlength = ringsStr.length;
		for (var r = 0 ; r < rlength ; r++)
		{
			var ring = new sg.geometry.LinearRing;
			var ptsStr = ringsStr[r].split(commaSplit);
			var plength = ptsStr.length;
			for (var i = 0 ; i < plength ; i++)
			{
				var pt = [];
				var xyStr = ptsStr[i].split(spaces);
				ring.path.push(new sg.geometry.Point(parseFloat(xyStr[0]), parseFloat(xyStr[1])));
			}
			polygon.rings.push(ring);
		}
		polygon.update();
		return polygon;
	};
	geom.Geometry = sg.Class.extend(
	{
		type: null,
		extent: null,
		spatialReference: null,
		getExtent: function()
		{
			return this.extent;
		},
		statics:
		{
			fromWKT: function(wkt)
			{
				var geoms = [];
				var result = typeStr.exec(wkt);
				if (!result || result.length <= 0)
					throw "Invalid WKT : " + wkt;
				
				var prefix = result[1].toUpperCase();
				var content = result[2];
				if (stringStartsWith(prefix, "POINT"))
				{
					var pt = [];
					var xyStr = content.split(spaces);
					return {"type":"POINT", "geometry":new sg.geometry.Point(parseFloat(xyStr[0]), parseFloat(xyStr[1]))};
				}
				else if (stringStartsWith(prefix, "LINESTRING"))
				{
					var path = parseLineString(content);
					if (path)
						return {"type": "LINESTRING", "geometry": path};
				}
				else if (stringStartsWith(prefix, "POLYGON"))
				{
					var poly = parsePolygon(content);
					if (poly)
						return {"type": "POLYGON", "geometry": poly};
				}
				else if (stringStartsWith(prefix, "MULTIPOINT"))
				{
					var multiPt = new sg.geometry.MultiPoint;
					var pointsStr = content.split(commaSplit);
					var plength = pointsStr.length;
					for (var i = 0 ; i < plength ; i++)
					{
						var pt = [];
						var xyStr = trimParens.exec(pointsStr[i])[1].split(spaces);
						multiPt.parts.push(new sg.geometry.Point(parseFloat(xyStr[0]), parseFloat(xyStr[1])));
					}
					multiPt.update();
					return {"type": "MULTIPOINT", "geometry": multiPt};
				}
				else if (stringStartsWith(prefix, "MULTILINESTRING"))
				{
					var multiLineStr = new sg.geometry.MultiLineString;
					var pathsStr = trimParens.exec(content)[1].split(parentSplit);
					var plength = pathsStr.length;
					for (var p = 0 ; p < plength ; p++)
					{
						var path = parseLineString(pathsStr[p]);
						if (path)
							multiLineStr.parts.push(path);
					}
					multiLineStr.update();
					return {"type": "MULTILINESTRING", "geometry": multiLineStr};
				}
				else if (stringStartsWith(prefix, "MULTIPOLYGON"))
				{
					var multiPolygon = new sg.geometry.MultiPolygon;
					var polysStr = trimParens.exec(content)[1].split(doubleParenComma);
					var plength = polysStr.length;
					for (var pi = 0 ; pi < plength ; pi++)
					{
						var poly = parsePolygon(polysStr[pi]);
						if (poly)
							multiPolygon.parts.push(poly);
					}
					multiPolygon.update();
					return {"type": "MULTIPOLYGON", "geometry": multiPolygon};
				}
				else if (stringStartsWith(prefix, "GEOMETRYCOLLECTION"))
				{
					return null;
				}
				else
					throw "Unknown WKT geometry type : " + prefix;
			},
			toWkt: function(geom)
			{
				if (geom.toWkt)
					return geom.toWkt();
			}
		}
	});
	geom.Polygon = geom.Geometry.extend(
	{
		initialize: function(coordinates)
		{
			this.rings = [];
		},
		type: "polygon",
		area: 0,
		rings: null,
		addRing: function(ring)
		{
			this.rings.push(ring);
			this.update();
		},
		clone: function()
		{
			var o = new sg.geometry.Polygon;
			var rings = [];
			var length = this.rings.length;
			for (var r = 0 ; r < length ; r++)
			{
				var ring = this.rings[r];
				rings.push(this.rings[r].clone());
			}
			o.rings = rings;
			o.update();
			return o;
		},
		transform: function(a, b, c, d, e, f, g, h, i)
		{
			var matrix;
			if (a instanceof sg.math.Matrix)
				matrix = a;
			else
				matrix = sg.math.Matrix([[a, b, c], [d, e, f], [g, h, i]]);
			
			var length = this.rings.length;
			for (var r = 0 ; r < length ; r++)
			{
				var ring = this.rings[r];
				ring.transform(matrix);
			}
			this.update();
		},
		forEachVertex: function(callback, context)
		{
			if (!callback)
				return;
			var length = this.rings.length;
			for (var r = 0 ; r < length ; r++)
			{
				var ring = this.rings[r];
				var plength = ring.path.length;
				for (var v = 0 ; v < plength ; v++)
					callback.call(context, {point:ring.path[v], ringIndex:r, pointIndex:v});
			}
		},
		update: function()
		{
			var area = 0;
			var rlength = this.rings.length;
			for (var r = 0 ; r < rlength ; r++)
			{
				var ring = this.rings[r];
				var t = 0;
				var plength = ring.path.length;
				var j = plength - 1;
				for (var p = 0 ; p < plength ; p++)
				{
					var pt = ring.path[p];
					var pt2 = ring.path[j];
					t += (pt2.x + pt.x) * (pt2.y - pt.y);
					j = p;
				}
				area += t / 2;
			}
			this.area = Math.abs(area);
			
			var xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
			var rlength = this.rings.length;
			for (var r = 0 ; r < rlength ; r++)
			{
				var fRing = this.rings[r];
				var glength = fRing.path.length;
				for (var p = 0 ; p < glength ; p++)
				{
					var pt = fRing.path[p];
					xmin = Math.min(pt.x, xmin);
					xmax = Math.max(pt.x, xmax);
					ymin = Math.min(pt.y, ymin);
					ymax = Math.max(pt.y, ymax);
				}
			}
			this.extent = new sg.geometry.Extent(xmin, ymin, xmax, ymax);
		},
		getArea: function()
		{
			return this.area;
		},
		contains: function(pt)
		{
			var result = false;
			var length = this.rings.length;
			for (var r = 0 ; r < length ; r++)
			{
				var poly = this.rings[r];
				for (var c = false, i = -1, l = poly.path.length, j = l - 1 ; ++i < l ; j = i)
				{
					(poly.path[i].y <= pt.y && pt.y < poly.path[j].y || poly.path[j].y <= pt.y && pt.y < poly.path[i].y) && pt.x < (poly.path[j].x - poly.path[i].x) * (pt.y - poly.path[i].y) / (poly.path[j].y - poly.path[i].y) + poly.path[i].x && (c = !c);
				}
				if (this.isClockwise(poly))
					result = result | c;
				else
					result = result & !c;
			}
			return result;
		},
		isClockwise: function(ring)
		{
			var t = 0;
			var rlength = ring.path.length;
			var j = rlength - 1;
			for (var p = 0 ; p < rlength ; p++)
			{
				var pt = ring.path[p];
				var pt2 = ring.path[j];
				t += (pt2.x + pt.x) * (pt2.y - pt.y);
				j = p;
			}
			return t >= 0;
		},
		getExtent: function()
		{
			return this.extent;
		},
		getCentroid: function()
		{
			if (!this.rings)
				return;
			var ring = this.rings[0];
			var x = 0;
			var y = 0;
			var rlength = ring.path.length;
			for (var r = 0 ; r < rlength - 1 ; r++)
			{
				var p = ring.path[r + 1];
				var np = ring.path[r];
				x += (p.x + np.x) * (p.x * np.y - np.x * p.y);
				y += (p.y + np.y) * (p.x * np.y - np.x * p.y);
			}
			var cx = x / (this.getArea() * 6);
			var cy = y / (this.getArea() * 6);
			return new sg.geometry.Point(cx, cy);
		},
		getFirstPoint_: function()
		{
			return this.rings[0].path[0];
		},
		toWkt: function()
		{
			var wkt = "POLYGON(";
			var rlength = this.rings.length;
			for (var i = 0 ; i < rlength ; i++)
			{
				wkt += "(";
				var plength = this.rings[i].path.length;
				for (var j = 0 ; j < plength ; j++)
					wkt += this.rings[i].path[j].x + " " + this.rings[i].path[j].y + ",";
				if (wkt[wkt.length - 1] == ",")
					wkt = wkt.substring(0, wkt.length - 1);
				wkt += "),";
			}
			if (wkt[wkt.length - 1] == ",")
				wkt = wkt.substring(0, wkt.length - 1);
			wkt += ")";
			return wkt;
		}
	});
	geom.MultiPart = geom.Geometry.extend(
	{
		parts: null,
		initialize: function()
		{
			this.parts = [];
		},
		addPart: function(part)
		{
			this.parts.push(part);
			this.update();
		},
		clone: function()
		{
			var o;
			var parts = [];
			
			if (this instanceof sg.geometry.MultiPoint)
				o = new sg.geometry.MultiPoint;
			else if (this instanceof sg.geometry.MultiPolygon)
				o = new sg.geometry.MultiPolygon;
			else if (this instanceof sg.geometry.MultiLineString)
				o = new sg.geometry.MultiLineString;
			
			var plength = this.parts.length;
			for (var p = 0 ; p < plength ; p++)
			{
				var part = this.parts[p];
				parts.push(part.clone());
			}
			o.parts = parts;
			o.update();
			return o;
		},
		transform: function(a, b, c, d, e, f, g, h, i)
		{
			var matrix;
			if (a instanceof sg.math.Matrix)
				matrix = a;
			else
				matrix = sg.math.Matrix([[a, b, c], [d, e, f], [g, h, i]]);
			
			var length = this.parts.length;
			for (var p = 0 ; p < length ; p++)
			{
				var part = this.parts[p];
				part.transform(matrix);
			}
			this.update();
		},
		forEachVertex: function(callback, context)
		{
			if (!callback)
				return;
			var plength = this.parts.length;
			for (var p = 0 ; p < plength ; p++)
			{
				var part = this.parts[p];
				if (part.forEachVertex)
				{
					part.forEachVertex(function(e)
					{
						e.partIndex = p;
						callback.call(context, e);
					}, context);
				}
			}
		},
		update: function(updatePart)
		{
			if (updatePart)
			{
				var plength = this.parts.length;
				for (var i = 0 ; i < plength ; i++)
				{
					if (this.parts[i].update)
						this.parts[i].update();
				}
			}
			var minx = Infinity;
			var miny = Infinity;
			var maxx = -Infinity;
			var maxy = -Infinity;
			var plength = this.parts.length;
			for (var i = 0 ; i < plength ; i++)
			{
				var partExt = this.parts[i].getExtent();
				minx = Math.min(minx, partExt.xmin);
				miny = Math.min(miny, partExt.ymin);
				maxx = Math.max(maxx, partExt.xmax);
				maxy = Math.max(maxy, partExt.ymax);
			}
			this.extent = new sg.geometry.Extent(minx, miny, maxx, maxy);
		}
	});
	geom.MultiPolygon = geom.MultiPart.extend(
	{
		initialize: function()
		{
			sg.geometry.MultiPart.prototype.initialize.call(this);
		},
		type: "multipolygon",
		contains: function(geom)
		{
			if (this.parts)
			{
				for (var p = 0 ; p < this.parts.length ; p++)
				{
					if (this.parts[p].contains(geom))
						return true;
				}
				return false;
			}
		},
		getCentroid: function()
		{
			var x = 0;
			var y = 0;
			for (var p = 0 ; p < this.parts.length ; p++)
			{
				var part = this.parts[p];
				var centroid = part.getCentroid();
				x += centroid.x;
				y += centroid.y;
			}
			var cx = x / this.parts.length;
			var cy = y / this.parts.length;
			return new sg.geometry.Point(cx, cy);
		},
		getFirstPoint_: function()
		{
			return this.parts[0].rings[0].path[0];
		},
		toWkt: function()
		{
			var wkt = "MULTIPOLYGON(";
			for (var k = 0 ; k < this.parts.length ; k++)
			{
				wkt += "(";
				for (var i = 0 ; i < this.parts[k].rings.length ; i++)
				{
					wkt += "(";
					for (var j = 0 ; j < this.parts[k].rings[i].path.length ; j++)
						wkt += this.parts[k].rings[i].path[j].x + " " + this.parts[k].rings[i].path[j].y + ",";
					if (wkt[wkt.length - 1] == ",")
						wkt = wkt.substring(0, wkt.length - 1);
					wkt += "),";
				}
				if (wkt[wkt.length - 1] == ",")
					wkt = wkt.substring(0, wkt.length - 1);
				wkt += "),";
			}
			if (wkt[wkt.length - 1] == ",")
				wkt = wkt.substring(0, wkt.length - 1);
			wkt += ")";
			return wkt;
		}
	});
	geom.MultiLineString = geom.MultiPart.extend(
	{
		initilize: function()
		{
			sg.geometry.MultiPart.prototype.initialize.call(this);
		},
		type: "multilinestring",
		getCentroid: function()
		{
			var x = 0;
			var y = 0;
			for (var p = 0 ; p < this.parts.length ; p++)
			{
				var part = this.parts[p];
				var centroid = part.getCentroid();
				x += centroid.x;
				y += centroid.y;
			}
			var cx = x / this.parts.length;
			var cy = y / this.parts.length;
			return new sg.geometry.Point(cx, cy);
		},
		getFirstPoint_: function()
		{
			return this.parts[0].path[0];
		},
		toWkt: function()
		{
			var wkt = "MULTILINESTRING(";
			for (var j = 0 ; j < this.parts.length ; j++)
			{
				wkt += "(";
				for (var i = 0 ; i < this.parts[j].path.length ; i++)
					wkt += this.parts[j].path[i].x + " " + this.parts[j].path[i].y + ",";
				if (wkt[wkt.length - 1] == ",")
					wkt = wkt.substring(0, wkt.length - 1);
				wkt += "),";
			}
			if (wkt[wkt.length - 1] == ",")
				wkt = wkt.substring(0, wkt.length - 1);
			wkt += ")";
			return wkt;
		}
	});
	geom.MultiPoint = geom.MultiPart.extend(
	{
		initilize: function()
		{
			sg.geometry.MultiPart.prototype.initialize.call(this);
		},
		type: "multipoint",
		getCentroid: function()
		{
			var x = 0;
			var y = 0;
			for (var p = 0 ; p < this.parts.length ; p++)
			{
				var part = this.parts[p];
				x += part.x;
				y += part.y;
			}
			var cx = x / this.parts.length;
			var cy = y / this.parts.length;
			return new sg.geometry.Point(cx, cy);
		},
		toWkt: function()
		{
			var wkt = "MULTIPOINT(";
			for (var i = 0 ; i < this.parts.length ; i++)
				wkt += this.parts[i].x + " " + this.parts[i].y + ",";
			if (wkt[wkt.length - 1] == ",")
				wkt = wkt.substring(0, wkt.length - 1);
			wkt += ")";
			return wkt;
		}
	});
	geom.Circle = geom.Polygon.extend(
	{
		initialize: function(center, options)
		{
			this.rings = [];
			this.center = center;
			if (options)
			{
				if (typeof options.radius == "number")
					this.radius = options.radius;
				if (typeof options.numberOfPoints == "number")
					this.numberOfPoints = options.numberOfPoints;
			}
			this.updateCircle_();
			this.update();
		},
		type: "circle",
		updateCircle_: function()
		{
			this.rings[0] = new sg.geometry.LinearRing;
			var nop = this.numberOfPoints + 2;
			var cx = this.center.x;
			var cy = this.center.y;
			var da = 360 / this.numberOfPoints;
			
			while (--nop)
			{
				var rad = da * nop / 180 * Math.PI;
				var px = cx + this.radius * Math.cos(rad);
				var py = cy + this.radius * Math.sin(rad);
				this.rings[0].path.push(new sg.geometry.Point(px, py));
			}
		},
		radius: 1E3,
		numberOfPoints: 60
	});
	geom.Envelope = geom.Geometry.extend(
	{
		initialize: function(x, y)
		{
			this.type = "envelope";
		}
	});
	geom.LineString = geom.Geometry.extend(
	{
		path: null,
		length: 0,
		initialize: function()
		{
			this.path = [];
		},
		type: "linestring",
		setPath: function(path)
		{
			this.path = path;
			this.update();
		},
		addPoint: function(pt)
		{
			this.path.push(pt);
			this.update();
		},
		clone: function()
		{
			var o = new sg.geometry.LineString;
			var path = [];
			for (var p = 0 ; p < this.path.length ; p++)
			{
				var pt = this.path[p];
				var npt = new sg.geometry.Point(pt.x, pt.y);
				path.push(npt);
			}
			o.path = path;
			o.update();
			return o;
		},
		transform: function(a, b, c, d, e, f, g, h, i)
		{
			var matrix;
			if (a instanceof sg.math.Matrix)
				matrix = a;
			else
				matrix = sg.math.Matrix([[a, b, c], [d, e, f], [g, h, i]]);
			
			for (var p = 0 ; p < this.path.length ; p++)
			{
				var pt = this.path[p];
				pt.transform(matrix);
			}
			this.update();
		},
		forEachVertex: function(callback, context)
		{
			if (!callback)
				return;
			for (var p = 0 ; p < this.path.length ; p++)
			{
				var pt = this.path[p];
				callback.call(context, {point:pt, pointIndex:p});
			}
		},
		getCentroid: function()
		{
			if (!this.path)
				return;
			var x = 0;
			var y = 0;
			for (var p = 0 ; p < this.path.length ; p++)
			{
				var pt = this.path[p];
				x += pt.x;
				y += pt.y;
			}
			var cx = x / this.path.length;
			var cy = y / this.path.length;
			return new sg.geometry.Point(cx, cy);
		},
		getMidPoint: function()
		{
			var halfLength = this.getLength() / 2;
			var mLength = 0;
			var pidx = 0;
			var p1, p2;
			
			for (var i = 1 ; i < this.path.length ; i++)
			{
				p1 = this.path[i - 1];
				p2 = this.path[i];
				var segLength = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
				mLength += segLength;
				
				if (mLength >= halfLength)
				{
					var ratio = (mLength - halfLength) / segLength;
					var cp = new sg.geometry.Point(p1.x + (p2.x - p1.x) * ratio, p1.y + (p2.y - p1.y) * ratio);
					return cp;
				}
			}
		},
		update: function()
		{
			var xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
			var path = this.path;
			for (var p = 0 ; p < path.length ; p++)
			{
				var pt = path[p];
				xmin = Math.min(pt.x, xmin);
				xmax = Math.max(pt.x, xmax);
				ymin = Math.min(pt.y, ymin);
				ymax = Math.max(pt.y, ymax);
			}
			this.extent = new sg.geometry.Extent(xmin, ymin, xmax, ymax);
			var length = 0;
			for (var i = 1 ; i < this.path.length ; i++)
			{
				var p1 = this.path[i - 1];
				var p2 = this.path[i];
				length += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
			}
			this.length = length;
		},
		getFirstPoint_: function()
		{
			return this.path[0];
		},
		getLength: function()
		{
			return this.length;
		},
		toWkt: function()
		{
			var wkt = "LINESTRING(";
			for (var i = 0 ; i < this.path.length ; i++)
				wkt += this.path[i].x + " " + this.path[i].y + ",";
			if (wkt[wkt.length - 1] == ",")
				wkt = wkt.substring(0, wkt.length - 1);
			wkt += ")";
			return wkt
		}
	});
	geom.LinearRing = geom.LineString.extend(
	{
		initialize: function()
		{
			geom.LineString.prototype.initialize.call(this);
		},
		type: "linearring"
	});
	geom.Point = geom.Geometry.extend(
	{
		initialize: function(x, y)
		{
			this.x = x ? x : 0;
			this.y = y ? y : 0;
		},
		type: "point",
		x: 0,
		y: 0,
		setX: function(x)
		{
			this.x = x;
			return this;
		},
		setY: function(y)
		{
			this.y = y;
			return this;
		},
		update: function(x, y)
		{
			if (sg.isNumber(x))
				this.x = x;
			if (sg.isNumber(y))
				this.y = y;
		},
		getFirstPoint_: function()
		{
			return this;
		},
		clone: function()
		{
			return new sg.geometry.Point(this.x, this.y);
		},
		transform: function(a, b, c, d, e, f, g, h, i)
		{
			var matrix;
			if (a instanceof sg.math.Matrix)
				matrix = a;
			else
				matrix = sg.math.Matrix([[a, b, c], [d, e, f], [g, h, i]]);
			var out = matrix.transform(this.x, this.y);
			this.x = out.x;
			this.y = out.y;
		},
		forEachVertex: function(call)
		{
			if (!callback)
				return;
			callback.call(context, {point:this});
		},
		toWkt: function()
		{
			return "POINT(" + this.x + " " + this.y + ")";
		},
		getExtent: function()
		{
			return new sg.geometry.Extent(this.x, this.y, this.x, this.y);
		}
	});
	geom.Extent = geom.Geometry.extend(
	{
		initialize: function(xmin, ymin, xmax, ymax, sr)
		{
			this.xmin = xmin;
			this.ymin = ymin;
			this.xmax = xmax;
			this.ymax = ymax;
			
			if (sr)
				this.spatialReference = new sg.SpatialReference(sr);
		},
		xmin: null,
		ymin: null,
		xmax: null,
		getCenter: function()
		{
			return new sg.geometry.Point((this.xmax - this.xmin) / 2, (this.ymax - this.ymin) / 2);
		},
		getWidth: function()
		{
			return Math.abs(this.xmax - this.xmin);
		},
		getHeight: function()
		{
			return Math.abs(this.ymax - this.ymin);
		},
		intersect: function(extent)
		{
			var leftSide = this.xmin > extent.xmax;
			var rightSide = this.xmax < extent.xmin;
			var topSise = this.ymax < extent.ymin;
			var downSide = this.ymin > extent.ymax;
			return!(leftSide || rightSide || topSise || downSide);
		},
		getExtent: function()
		{
			return this;
		},
		getFirstPoint_: function()
		{
			return new sg.geometry.Point(this.minx, this.maxy);
		},
		union: function(p)
		{
			if (!(p instanceof sg.geometry.Extent))
				return;
			this.xmin = Math.min(this.xmin, p.xmin);
			this.ymin = Math.min(this.ymin, p.ymin);
			this.xmax = Math.min(this.xmax, p.xmax);
			this.ymax = Math.min(this.ymax, p.ymax);
			return this;
		},
		toWkt: function()
		{
			return "POLYGON((" + this.xmin + " " + this.ymax + "," + this.xmax + " " + this.ymax + "," + this.xmax + " " + this.ymin + "," + this.xmin + " " + this.ymin + "," + this.xmin + " " + this.ymax + "))";
		}
	});
	geom.webMercatorUtils = {};
	geom.webMercatorUtils.geographicToWebMercator = function(p)
	{
		if (!p)
			return;
		
		if (p instanceof sg.geometry.Point)
		{
			var xy = geom.webMercatorUtils.lngLatToXY(p.x, p.y);
			return new geom.Point(xy.x, xy.y);
		}
		else if (p instanceof sg.geometry.LineString)
		{
			var line = new geom.LineString;
			for (var l = 0 ; l < p.path.length ; l++)
			{
				var tpt = p.path[l];
				var xy = geom.webMercatorUtils.lngLatToXY(tpt.x, tpt.y);
				var pt = new geom.Point(xy.x, xy.y);
				line.path.push(pt);
			}
			line.update();
			return line;
		}
		else if (p instanceof sg.geometry.Polygon)
		{
			var polygon = new geom.Polygon;
			for (var r = 0 ; r < p.rings.length ; r++)
			{
				var ring = p.rings[r];
				var nRing = new geom.LinearRing;
				for (var l = 0;l < ring.path.length;l++)
				{
					var tpt = ring.path[l];
					var xy = geom.webMercatorUtils.lngLatToXY(tpt.x, tpt.y);
					var pt = new geom.Point(xy.x, xy.y);
					nRing.path.push(pt);
				}
				polygon.rings.push(nRing);
			}
			polygon.update();
			return polygon;
		}
		else if (p instanceof sg.geometry.MultiPoint)
		{
			var result = new geom.MultiPoint;
			for (var i = 0 ; i < p.parts.length ; i++)
			{
				var xy = geom.webMercatorUtils.lngLatToXY(p.parts[i].x, p.parts[i].y);
				result.parts.push(new geom.Point(xy.x, xy.y));
			}
			return result;
		}
		else if (p instanceof sg.geometry.MultiLineString)
		{
			var result = new geom.MultiLineString;
			for (var i = 0 ; i < p.parts.length ; i++)
			{
				var line = new geom.LineString;
				for (var l = 0 ; l < p.parts[i].path.length ; l++)
				{
					var tpt = p.parts[i].path[l];
					var xy = geom.webMercatorUtils.lngLatToXY(tpt.x, tpt.y);
					var pt = new geom.Point(xy.x, xy.y);
					line.path.push(pt);
				}
				line.update();
				result.parts.push(line);
			}
			return result;
		}
		else if (p instanceof sg.geometry.MultiPolygon)
		{
			var result = new geom.MultiPolygon;
			for (var i = 0 ; i < p.parts.length ; i++)
			{
				var polygon = new geom.Polygon;
				for (var r = 0 ; r < p.parts[i].rings.length ; r++)
				{
					var ring = p.parts[i].rings[r];
					var nRing = new geom.LinearRing;
					for (var l = 0 ; l < ring.path.length ; l++)
					{
						var tpt = ring.path[l];
						var xy = geom.webMercatorUtils.lngLatToXY(tpt.x, tpt.y);
						var pt = new geom.Point(xy.x, xy.y);
						nRing.path.push(pt);
					}
					polygon.rings.push(nRing);
				}
				polygon.update();
				result.parts.push(polygon)
			}
			return result;
		}
	};
	geom.webMercatorUtils.lngLatToXY = function(lon, lat, isLinear)
	{
		 var x = lon * 2.003750834E7 / 180;
		 var y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
		 y = y * 2.003750834E7 / 180;
		 return {x: x, y: y};
	};
	geom.webMercatorUtils.webMercatorToGeographic = function(p)
	{
		if (!p)
			return;
		if (p instanceof sg.geometry.Point)
		{
			var lonlat = geom.webMercatorUtils.xyToLngLat(p.x, p.y);
			return new geom.Point(lonlat.lon, lonlat.lat);
		}
		else if (p instanceof sg.geometry.LineString)
		{
			var line = new geom.LineString;
			for (var l = 0 ; l < p.path.length ; l++)
			{
				var tpt = p.path[l];
				var lonlat = geom.webMercatorUtils.xyToLngLat(tpt.x, tpt.y);
				var pt = new geom.Point(lonlat.lon, lonlat.lat);
				line.path.push(pt);
			}
			line.update();
			return line;
		}
		else if (p instanceof sg.geometry.Polygon)
		{
			var polygon = new geom.Polygon;
			for (var r = 0 ; r < p.rings.length ; r++)
			{
				var ring = p.rings[r];
				var nRing = new geom.LinearRing;
				for (var l = 0 ; l < ring.path.length ; l++)
				{
					var tpt = ring.path[l];
					var lonlat = geom.webMercatorUtils.xyToLngLat(tpt.x, tpt.y);
					var pt = new geom.Point(lonlat.lon, lonlat.lat);
					nRing.path.push(pt);
				}
				polygon.rings.push(nRing);
			}
			polygon.update();
			return polygon;
		}
		else if (p instanceof sg.geometry.MultiPoint)
		{
			var result = new geom.MultiPoint;
			for (var i = 0 ; i < p.parts.length ; i++)
			{
				var lonlat = geom.webMercatorUtils.xyToLngLat(p.parts[i].x, p.parts[i].y);
				result.parts.push(new geom.Point(lonlat.lon, lonlat.lat));
			}
			return result;
		}
		else if (p instanceof sg.geometry.MultiLineString)
		{
			var result = new geom.MultiLineString;
			for (var i = 0 ; i < p.parts.length ; i++)
			{
				var line = new geom.LineString;
				for (var l = 0 ; l < p.parts[i].path.length ; l++)
				{
					var tpt = p.parts[i].path[l];
					var lonlat = geom.webMercatorUtils.xyToLngLat(tpt.x, tpt.y);
					var pt = new geom.Point(lonlat.lon, lonlat.lat);
					line.path.push(pt);
				}
				line.update();
				result.parts.push(line);
			}
			return result;
		}
		else if (p instanceof sg.geometry.MultiPolygon)
		{
			var result = new geom.MultiPolygon;
			for (var i = 0 ; i < p.parts.length ; i++)
			{
				var polygon = new geom.Polygon;
				for (var r = 0 ; r < p.parts[i].rings.length ; r++)
				{
					var ring = p.parts[i].rings[r];
					var nRing = new geom.LinearRing;
					for (var l = 0 ; l < ring.path.length ; l++)
					{
						var tpt = ring.path[l];
						var lonlat = geom.webMercatorUtils.xyToLngLat(tpt.x, tpt.y);
						var pt = new geom.Point(lonlat.lon, lonlat.lat);
						nRing.path.push(pt);
					}
					polygon.rings.push(nRing);
				}
				polygon.update();
				result.parts.push(polygon);
			}
			return result;
		}
	};
	geom.webMercatorUtils.xyToLngLat = function(x, y)
	{
		var lon = x / 2.003750834E7 * 180;
		var lat = y / 2.003750834E7 * 180;
		lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
		return{lon: lon, lat: lat};
	};
	return geom;
}();
try
{
	if (document.namespaces)
	{
		document.namespaces.add("vml", "urn:schemas-microsoft-com:vml", "#default#VML");
		document.createStyleSheet().addRule("vml\\:*", "behavior:url(#default#VML)");
	}
}
catch(e)
{}
function LineSide(fpt, tpt, pt)
{
	function dot(v1, v2)
	{
		return v1.X * v2.X + v1.Y * v2.Y;
	}
	function distance(p1, p2)
	{
		return Math.sqrt(Math.pow(p1.X - p2.X, 2) + Math.pow(p1.Y - p2.Y, 2));
	}
	var len13 = distance(fpt, pt);
	var len12 = distance(fpt, tpt);
	var len23 = distance(pt, tpt);
	if (dot(pt.Diff(fpt), tpt.Diff(fpt)) > 0 && dot(pt.Diff(tpt), fpt.Diff(tpt)) > 0)
	{
		var p = (len13 + len12 + len23) / 2;
		var s = Math.sqrt(p * (p - len13) * (p - len12) * (p - len23));
		var H = s / len12 * 2;
		
		if (H < 3)
			return 0;
		else
			return -1;
	}
	else
		return -1;
}
function PointNode()
{
	this.m_Point = new Array;
	this.m_Div = new Array;
}
function Point(pMap)
{
	var pNode = pMap.getHPackage();
	var m_hObj = null;
	var pThis = this;
	this.m_bEditable = null;
	var m_Color = "#0033cc";
	var m_NodeColor = "#FFFF00";
	var m_Size = 10;
	var m_Point = null;
	var m_LineWidth = 1;
	var m_LineColor = "#000000";
	var m_IcoPath = "";
	var m_HotSopt = null;
	
	this.SetPoint = function(addpt)
	{
		m_Point = addpt;
		this.RebuildElement();
	};
	this.MovePoint = function()
	{
		m_Point = ptPos;
		this.RebuildElement();
	};
	this.RemovePoint = function()
	{
		pNode.removeChild(m_hObj);
		m_Point = null;
	};
	this.putIcoPath = function(IcoPath)
	{
		m_IcoPath = IcoPath;
	};
	this.putHotSopt = function(HotSopt)
	{
		m_HotSopt = HotSopt;
	};
	this.putFillColor = function(color)
	{
		m_Color = color;
	};
	this.putNodeColor = function(nodecolor)
	{
		m_NodeColor = nodecolor;
	};
	this.putSize = function(size)
	{
		m_Size = size;
	};
	this.putLineColor = function(LineColor)
	{
		m_LineColor = LineColor;
	};
	this.putLineWidth = function(LineWeight)
	{
		m_LineWidth = LineWeight;
	};
	this.toString = function()
	{
		var wkt = m_Point.X + " " + m_Point.Y;
		if (!isNaN(m_Point.Z))
			wkt += " " + m_Point.Z;
		if (!isNaN(m_Point.M))
			wkt += " " + m_Point.M;
		return wkt;
	};
	this.WellKnownText = function()
	{
		if (m_Point == null)
			return "";
		var prefix = "POINT";
		if (this.withZ)
			prefix += "Z";
		if (this.withM)
			prefix += "M";
		var str = prefix + " (" + this.toString() + ")";
		return str;
	};
	if (DeviceTest() == "MSIE")
		m_hObj = pNode.ownerDocument.createElement("vml:oval");
	else
		m_hObj = pNode.ownerDocument.createElement("canvas");
	pNode.appendChild(m_hObj);
	m_hObj.style.position = "absolute";
	this.RebuildElement = function()
	{
		if (m_hObj == null || m_Point == null)
			return;
		var pt = pMap.FromMapPoint(m_Point.X, m_Point.Y);
		if (m_IcoPath != "")
		{
			this.Destroy();
			m_hObj = pNode.ownerDocument.createElement("img");
			pNode.appendChild(m_hObj);
			m_hObj.style.position = "absolute";
			m_hObj.src = m_IcoPath;
			m_hObj.alt = "Marker";
			
			if (m_HotSopt == null)
				m_HotSopt = new MapPoint(0, 0);
		}
		else if (DeviceTest() == "MSIE")
		{
			m_hObj.fillcolor = m_Color;
			m_hObj.strokecolor = m_LineColor;
			m_hObj.strokeweight = m_LineWidth;
		}
		else
		{
			m_hObj.width = parseInt(m_Size, 10) + parseInt(m_LineWidth, 10) * 2;
			m_hObj.height = parseInt(m_Size, 10) + parseInt(m_LineWidth, 10) * 2;
			var ctx = m_hObj.getContext("2d");
			var radius = m_Size / 2;
			ctx.beginPath();
			ctx.arc(m_Size / 2 + parseInt(m_LineWidth, 10), m_Size / 2 + parseInt(m_LineWidth, 10), radius, 0, Math.PI * 2, true);
			ctx.fillStyle = m_Color;
			ctx.fill();
			ctx.lineWidth = m_LineWidth;
			ctx.strokeStyle = m_LineColor;
			ctx.stroke();
		}
		this.UpdateElement();
	};
	this.UpdateElement = function()
	{
		if (m_hObj == null || m_Point == null)
			return;
		var pt = pMap.FromMapPoint(m_Point.X, m_Point.Y);
		if (m_HotSopt)
		{
			var nX = pt.X;
			var nY = pt.Y;
			nX -= m_HotSopt.X;
			nY -= m_HotSopt.Y;
			m_hObj.style.left = nX + "px";
			m_hObj.style.top = nY + "px";
		}
		else
		{
			m_hObj.style.left = pt.X - parseInt(m_Size, 10) / 2 + "px";
			m_hObj.style.top = pt.Y - parseInt(m_Size, 10) / 2 + "px";
			m_hObj.style.width = parseInt(m_Size, 10) + "px";
			m_hObj.style.height = parseInt(m_Size, 10) + "px";
		}
	};
	this.RebuildElement();
	function pDownFunc()
	{
		return function(pEvent)
		{
			var bRemove = true;
			var pMoveFunc = function(pEvent)
			{
				var ptPos = pMap.getCursorPosition(pEvent);
				ptPos = pMap.ToMapPoint(ptPos.X, ptPos.Y);
				pThis.MovePoint(ptPos);
				pThis.RebuildElement();
				bRemove = false;
			};
			var pUpFunc = function(pEvent)
			{
				DetachEvent(m_hObj, "mousemove", pMoveFunc, true);
				DetachEvent(m_hObj, "mouseup", pUpFunc, true);
				return false;
			};
			var pClickFunc = function()
			{
				return function(pEvent)
				{
					if (bRemove)
						pThis.RemovePoint();
					DetachEvent(m_hObj, "click", pClickFunc(), false);
				};
			};
			AttachEvent(m_hObj, "click", pClickFunc(), false);
			AttachEvent(m_hObj, "mouseup", pUpFunc, true);
			AttachEvent(m_hObj, "mousemove", pMoveFunc, true);
		};
	}
	var m_Div = null;
	this.Editable = function(v)
	{
		m_bEditable = v;
		if (v == true)
		{
			this.putFillColor(m_NodeColor);
			this.putLineColor(m_NodeColor);
			this.RebuildElement();
			AttachEvent(m_hObj, "mousedown", pDownFunc(), false);
		}
		else
		{
			this.putFillColor(m_Color);
			this.putLineColor(m_LineColor);
			this.RebuildElement();
		}
	};
	this.Destroy = function()
	{
		if (!m_hObj)
			return false;
		pNode.removeChild(m_hObj);
		pMap.RemoveLayer(this);
	};
	this.ParseWKT = function(strPts, withZ, withM)
	{
		var sss = trimParent(trimTypeStr(strPts)).split(" ");
		if (isNaN(sss[0]) || isNaN(sss[1]))
			return false;
		this.SetPoint(new MapPoint(parseFloat(sss[0]), parseFloat(sss[1])));
		if (withZ && withM)
		{
			if (!isNaN(sss[2]))
				m_Point.Z = parseFloat(sss[2]);
			if (!isNaN(sss[3]))
				m_Point.M = parseFloat(sss[3]);
		}
		else if (withZ && !isNaN(sss[2]))
		{
			m_Point.Z = parseFloat(sss[2]);
		}
		else if (withM && !isNaN(sss[2]))
		{
			m_Point.M = parseFloat(sss[2]);
		}
	};
	pMap.AddElement(this);
}
function Polyline(pMap)
{
	var pNode = pMap.getHPackage();
	var m_hObj = null;
	var pThis = this;
	var m_ptNode = new PointNode;
	var mapMaxX = null;
	var mapMaxY = null;
	var mapMinX = null;
	var mapMinY = null;
	
	this.getExtent = function()
	{
		if (m_ptNode.m_Point.length == 0)
			return;
		mapMaxX = m_ptNode.m_Point[0].X;
		mapMaxY = m_ptNode.m_Point[0].Y;
		mapMinX = m_ptNode.m_Point[0].X;
		mapMinY = m_ptNode.m_Point[0].Y;
		for (var i = 1 ; i < m_ptNode.m_Point.length ; i++)
		{
			if (m_ptNode.m_Point[i].X > mapMaxX)
				mapMaxX = m_ptNode.m_Point[i].X;
			if (m_ptNode.m_Point[i].Y > mapMaxY)
				mapMaxY = m_ptNode.m_Point[i].Y;
			if (m_ptNode.m_Point[i].X < mapMinX)
				mapMinX = m_ptNode.m_Point[i].X;
			if (m_ptNode.m_Point[i].Y < mapMinY)
				mapMinY = m_ptNode.m_Point[i].Y;
		}
		var mapExtent = new sg.geometry.Extent(mapMinX, mapMinY, mapMaxX, mapMaxY);
		return mapExtent;
	};
	this.getExtent();
	this.m_bEditable = false;
	var m_LineColor = "#0033cc";
	var m_NodeColor = "#FF0000";
	var m_LineWidth = 2;
	
	this.AddPoint = function(addpt)
	{
		m_ptNode.m_Point.push(addpt);
	};
	this.InsertPoint = function(index, addpt)
	{
		m_ptNode.m_Point.splice(index, 0, addpt);
	};
	this.MovePoint = function(index, ptPos)
	{
		if (index >= 0)
			m_ptNode.m_Point[index] = ptPos;
		else
			m_ptNode.m_Point[m_ptNode.m_Point.length - 1] = ptPos;
	};
	this.RemovePoint = function(nIndex)
	{
		if (m_ptNode.m_Point.length > 2)
		{
			pNode.removeChild(m_ptNode.m_Div[nIndex]);
			m_ptNode.m_Point.splice(nIndex, 1);
			m_ptNode.m_Div.splice(nIndex, 1);
		}
	};
	this.putLineColor = function(linecolor)
	{
		m_LineColor = linecolor;
	};
	this.putNodeColor = function(nodecolor)
	{
		m_NodeColor = nodecolor;
	};
	this.putLineWidth = function(linesize)
	{
		m_LineWidth = linesize;
	};
	this.toString = function()
	{
		return m_ptNode.m_Point.join(",");
	};
	this.WellKnownText = function()
	{
		if (m_ptNode.m_Point.length == 0)
			return;
		var fp = m_ptNode.m_Point[0];
		var prefix = "LINESTRING";
		if (this.withZ)
			prefix += "Z";
		if (this.withM)
			prefix += "M";
		return prefix + " (" + this.toString() + ")";
	};
	this.getLength = function()
	{
		var nLength = 0;
		var pt1 = m_ptNode.m_Point[0];
		for (var i = 1 ; i < m_ptNode.m_Point.length ; i++)
		{
			var pt2 = m_ptNode.m_Point[i];
			nLength += Math.sqrt(Math.pow(pt1.X - pt2.X, 2) + Math.pow(pt1.Y - pt2.Y, 2));
			pt1 = pt2;
		}
		return nLength;
	};
	if (DeviceTest() == "MSIE")
	{
		m_hObj = pNode.ownerDocument.createElement("vml:polyline");
		m_hObj.filled = false;
	}
	else
		m_hObj = pNode.ownerDocument.createElement("canvas");
	
	m_hObj.style.position = "absolute";
	pNode.appendChild(m_hObj);
	var OrgPt = null;
	var OrgPt2 = null;
	
	this.RebuildElement = function()
	{
		if (m_hObj == null || m_ptNode.m_Point.length == 0)
			return;
		this.getExtent();
		var Minpt = pMap.FromMapPoint(mapMinX, mapMaxY);
		var Maxpt = pMap.FromMapPoint(mapMaxX, mapMinY);
		
		if (DeviceTest() == "MSIE")
		{
			OrgPt = new MapPoint(mapMinX, mapMaxY);
			OrgPt2 = new MapPoint(mapMaxX, mapMinY);
			m_hObj.style.left = Minpt.X + "px";
			m_hObj.style.top = Minpt.Y + "px";
			m_hObj.style.width = Maxpt.X - Minpt.X + "px";
			m_hObj.style.height = Maxpt.Y - Minpt.Y + "px";
			m_hObj.strokecolor = m_LineColor;
			m_hObj.strokeweight = m_LineWidth;
			var pt = pMap.FromMapPoint(m_ptNode.m_Point[0].X, m_ptNode.m_Point[0].Y).Diff(Minpt);
			var strPath = pt;
			for (var i = 1 ; i < m_ptNode.m_Point.length ; i++)
			{
				pt = pMap.FromMapPoint(m_ptNode.m_Point[i].X, m_ptNode.m_Point[i].Y).Diff(Minpt);
				strPath += "," + pt;
			}
			if (m_hObj.Points != null) 
				m_hObj.Points.value = strPath;
			else
				m_hObj.Points = strPath;
		}
		else
		{
			var HelfSize = new MapPoint(m_LineWidth / 2, m_LineWidth / 2);
			var opt = Minpt.Diff(HelfSize);
			var pt2 = Maxpt.Plus(HelfSize);
			OrgPt = pMap.ToMapPoint(opt.X, opt.Y);
			OrgPt2 = pMap.ToMapPoint(pt2.X, pt2.Y);
			var pDif = pt2.Diff(opt);
			m_hObj.width = pDif.X;
			m_hObj.height = pDif.Y;
			var ctx = m_hObj.getContext("2d");
			ctx.beginPath();
			ctx.lineJoin = "round";
			ctx.strokeStyle = m_LineColor;
			ctx.lineWidth = m_LineWidth;
			var pt = pMap.FromMapPoint(m_ptNode.m_Point[0].X, m_ptNode.m_Point[0].Y).Diff(opt);
			ctx.moveTo(pt.X, pt.Y);
			
			for (var i = 1 ; i < m_ptNode.m_Point.length ; i++)
			{
				pt = pMap.FromMapPoint(m_ptNode.m_Point[i].X, m_ptNode.m_Point[i].Y).Diff(opt);
				ctx.lineTo(pt.X, pt.Y);
			}
			ctx.stroke();
		}
		this.UpdateElement();
	};
	function UpdateNode()
	{
		if (m_ptNode.m_Div)
		{
			for (var i = 0 ; i < m_ptNode.m_Div.length ; i++)
			{
				pt = pMap.FromMapPoint(m_ptNode.m_Point[i].X, m_ptNode.m_Point[i].Y);
				m_ptNode.m_Div[i].style.left = pt.X - 5 + "px";
				m_ptNode.m_Div[i].style.top = pt.Y - 5 + "px";
			}
		}
	}
	this.UpdateElement = function()
	{
		if (m_hObj == null || OrgPt == null || OrgPt2 == null)
			return;
		var Minpt = pMap.FromMapPoint(OrgPt.X, OrgPt.Y);
		var Maxpt = pMap.FromMapPoint(OrgPt2.X, OrgPt2.Y);
		m_hObj.style.left = Minpt.X + "px";
		m_hObj.style.top = Minpt.Y + "px";
		m_hObj.style.width = Maxpt.X - Minpt.X + "px";
		m_hObj.style.height = Maxpt.Y - Minpt.Y + "px";
		UpdateNode();
	};
	this.RebuildElement();
	function pAddPtFunc(pEvent)
	{
		if (m_ptNode.m_Point.length == 0)
			return false;
		var ptPos = pMap.getCursorPosition(pEvent);
		var mptPos = pMap.ToMapPoint(ptPos.X, ptPos.Y);
		var bNoRemove = true;
		
		for (var i = 0 ; i < m_ptNode.m_Point.length ; i++)
		{
			var pt1 = pMap.FromMapPoint(m_ptNode.m_Point[i].X, m_ptNode.m_Point[i].Y);
			if (Math.abs(pt1.X - ptPos.X) < 10 && Math.abs(pt1.Y - ptPos.Y) < 10)
			{
				var pMoveFunc = function(pEvent)
				{
					var ptPos = pMap.getCursorPosition(pEvent);
					ptPos = pMap.ToMapPoint(ptPos.X, ptPos.Y);
					pThis.MovePoint(i, ptPos);
					pThis.RebuildElement();
					bNoRemove = false;
					return false;
				};
				var pUpFunc = function(pEvent)
				{
					DetachEvent(m_hObj, "mousemove", pMoveFunc, true);
					DetachEvent(m_hObj, "mouseup", pUpFunc, true);
					if (bNoRemove)
						pThis.RemovePoint(i);
					return false;
				};
				AttachEvent(m_hObj, "mouseup", pUpFunc, true);
				AttachEvent(m_hObj, "mousemove", pMoveFunc, true);
				return false;
			}
		}
		var pt1 = pMap.FromMapPoint(m_ptNode.m_Point[0].X, m_ptNode.m_Point[0].Y);
		for (var i = 1 ; i < m_ptNode.m_Point.length ; i++)
		{
			var pt2 = pMap.FromMapPoint(m_ptNode.m_Point[i].X, m_ptNode.m_Point[i].Y);
			var pos = LineSide(pt1, pt2, ptPos);
			
			if (pos == 0)
			{
				pThis.InsertPoint(i == 0 ? -1 : i, mptPos);
				pThis.Editable(pThis.m_bEditable);
				return false;
			}
			pt1 = pt2;
		}
		return false;
	}
	this.Editable = function(v)
	{
		if (this.m_bEditable != v)
		{
			if (v == true)
				AttachEvent(pNode, "mousedown", pAddPtFunc, false);
			else
				DetachEvent(pNode, "mousedown", pAddPtFunc, false);
		}
		this.m_bEdotable = v;
		
		if (v == true)
		{
			if (m_ptNode.m_Div)
			{
				for (var i = 0 ; i < m_ptNode.m_Div.length ; i++)
					pNode.removeChild(m_ptNode.m_Div[i]);
			}
			var Minpt = pMap.FromMapPoint(mapMinX, mapMaxY);
			var Maxpt = pMap.FromMapPoint(mapMaxX, mapMinY);
			m_ptNode.m_Div = new Array;
			for (var i = 0 ; i < m_ptNode.m_Point.length ; i++)
			{
				var node = pNode.ownerDocument.createElement("DIV");
				pNode.appendChild(node);
				pt = pMap.FromMapPoint(m_ptNode.m_Point[i].X, m_ptNode.m_Point[i].Y);
				node.style.position = "absolute";
				node.style.overflow = "hidden";
				node.style.left = pt.X - 5 + "px";
				node.style.top = pt.Y - 5 + "px";
				node.style.width = "10px";
				node.style.height = "10px";
				node.style.background = m_NodeColor;
				m_ptNode.m_Div[i] = node;
			}
		}
		else
		{
			if (m_ptNode.m_Div)
			{
				for (var i = 0 ; i < m_ptNode.m_Div.length ; i++)
					pNode.removeChild(m_ptNode.m_Div[i]);
			}
			m_ptNode.m_Div = new Array;
		}
	};
	this.Destroy = function()
	{
		if (m_hObj == null)
			return false;
		pNode.removeChild(m_hObj);
		if (m_ptNode.m_Div)
		{
			for (var i = 0 ; i < m_ptNode.m_Div.length ; i++)
				m_ptNode.m_Div[i].parentNode.removeChild(m_ptNode.m_Div[i]);
		}
		m_hObj = null;
		m_ptNode = new PointNode;
		pMap.RemoveLayer(this);
	};
	this.ParseWKT = function(strPts, withZ, withM)
	{
		var ss = trimParent(trimTypeStr(strPts)).split(",");
		for (var k = 0 ; k < ss.length ; k++)
		{
			var sss = ss[k].split(" ");
			if (isNaN(sss[0]) || isNaN([1]))
				return false;
			var mp = new MapPoint(parseFloat(sss[0]), parseFloat(sss[1]));
			
			if (withZ && withM)
			{
				if (!isNaN(sss[2]))
					mp.Z = parseFloat(sss[2]);
				if (!isNaN(sss[3]))
					mp.M = parseFloat(sss[3]);
			}
			else if (withZ && !isNaN(sss[2]))
				mp.Z = parseFloat(sss[2]);
			else if (withM && !isNaN(sss[2]))
				mp.M = parseFloat(sss[2]);
			
			m_ptNode.m_Point.push(mp);
		}
		this.RebuildElement();
		this.Editable(this.m_bEditable);
		return true;
	};
	pMap.AddElement(this);
}
function Polygon(pMap)
{
	var pNode = pMap.getHPackage();
	var m_hObj;
	var pThis = this;
	var pOrd = pMap.ToMapPoint(0, 0);
	var mapMaxX = null;
	var mapMaxY = null;
	var mapMinX = null;
	var mapMinY = null;
	var m_ptNode = new PointNode;
	this.m_bEditable = false;
	var m_FillColor = "#0033cc";
	var m_LineWidth = 2;
	var m_LineColor = "#0000ff";
	var m_NodeColor = "#ff0000";
	var m_Transparency = .5;
	
	this.getPoints = function()
	{
		return m_ptNode.m_Point;
	};
	this.getExtent = function()
	{
		if (m_ptNode.m_Point.length == 0)
			return;
		mapMaxX = m_ptNode.m_Point[0][0].X;
		mapMaxY = m_ptNode.m_Point[0][0].Y;
		mapMinX = m_ptNode.m_Point[0][0].X;
		mapMinY = m_ptNode.m_Point[0][0].Y;
		for (var i = 0 ; i < m_ptNode.m_Point[0].length ; i++)
		{
			if (m_ptNode.m_Point[0][i].X > mapMaxX)
				mapMaxX = m_ptNode.m_Point[0][i].X;
			if (m_ptNode.m_Point[0][i].Y > mapMaxY)
				mapMaxY = m_ptNode.m_Point[0][i].Y;
			if (m_ptNode.m_Point[0][i].X < mapMinX)
				mapMinX = m_ptNode.m_Point[0][i].X;
			if (m_ptNode.m_Point[0][i].Y < mapMinY)
				mapMinY = m_ptNode.m_Point[0][i].Y;
		}
		var mapExtent = new sg.geometry.Extent(mapMinX, mapMinY, mapMaxX, mapMaxY);
		return mapExtent;
	};
	this.getExtent();
	this.AddPoint = function(part, addpt)
	{
		this.InsertPoint(part, -1, addpt);
	};
	this.InsertPoint = function(part, index, addpt)
	{
		if (part < 0)
			return false;
		if (m_ptNode.m_Point[part] == null)
			m_ptNode.m_Point[part] = new Array;
		if (index >= 0)
			m_ptNode.m_Point[part].splice(index, 0, addpt);
		else
			m_ptNode.m_Point[part].push(addpt);
	};
	this.MovePoint = function(part, index, ptPos)
	{
		if (index >= 0 && part >= 0)
			m_ptNode.m_Point[part][index] = ptPos;
	};
	this.RemovePoint = function(part, index)
	{
		if (m_ptNode.m_Point[part].length > 3)
		{
			pNode.removeChild(m_ptNode.m_Div[part][index]);
			m_ptNode.m_Point[part].splice(index, 1);
			m_ptNode.m_Div[part].splice(index, 1);
		}
	};
	this.putFillColor = function(fillcolor)
	{
		m_FillColor = fillcolor;
	};
	this.putNodeColor = function(nodecolor)
	{
		m_NodeColor = nodecolor;
	};
	this.putTransparency = function(Transparency)
	{
		m_Transparency = Transparency;
	};
	this.putLineColor = function(LineColor)
	{
		m_LineColor = LineColor;
	};
	this.putLineWidth = function(LineWeight)
	{
		m_LineWidth = LineWeight;
	};
	this.toString = function()
	{
		var str = "";
		for (var i = 0 ; i < m_ptNode.m_Point.length ; i++)
		{
			str += "(" + m_ptNode.m_Point[i].join(",") + "," + m_ptNode.m_Point[i][0] + ")";
		}
		return str;
	};
	this.WellKnownText = function()
	{
		if (m_ptNode.m_Point.length <= 0 || m_ptNode.m_Point[0].length <= 0)
			return null;
		var fp = m_ptNode.m_Point[0][0];
		var prefix = "POLYGON";
		if (this.withZ)
			prefix += "Z";
		if (this.withM)
			prefix += "M";
		return prefix + " (" + this.toString() + ")";
	};
	
	if (DeviceTest() == "MSIE")
	{
		m_hObj = pNode.ownerDocument.createElement("vml:shape");
		m_hObj.filled = true;
	}
	else
		m_hObj = pNode.ownerDocument.createElement("canvas");
	
	m_hObj.style.position = "absolute";
	pNode.appendChild(m_hObj);
	var OrgPt = null;
	var OrgPt2 = null;
	this.RebuildElement = function()
	{
		if (m_hObj == null || m_ptNode.m_Point.length == 0)
			return;
		this.getExtent();
		var Minpt = pMap.FromMapPoint(mapMinX, mapMaxY);
		var Maxpt = pMap.FromMapPoint(mapMaxX, mapMinY);
		if (DeviceTest() == "MSIE")
		{
			OrgPt = new MapPoint(mapMinX, mapMaxY);
			OrgPt2 = new MapPoint(mapMaxX, mapMinY);
			var pDif = Maxpt.Diff(Minpt);
			m_hObj.coordorigin = "0 0";
			m_hObj.coordsize = pDif.X + " " + pDif.Y;
			m_hObj.fillcolor = m_FillColor;
			var fill = m_hObj.ownerDocument.createElement("vml:fill");
			m_hObj.appendChild(fill);
			fill.opacity = m_Transparency;
			m_hObj.strokeweight = m_LineWidth;
			m_hObj.strokecolor = m_LineColor;
			var strPath = "";
			var pt = null;
			for (var i = 0 ; i < m_ptNode.m_Point.length ; i++)
			{
				var tPoints = m_ptNode.m_Point[i];
				pt = pMap.FromMapPoint(tPoints[0].X, tPoints[0].Y).Diff(Minpt);
				if (tPoints.length < 2)
					continue;
				strPath += " m " + Math.round(pt.X) + " " + Math.round(pt.Y) + " l ";
				for (var j = 1 ; j < tPoints.length ; j++)
				{
					var pt2 = pMap.FromMapPoint(tPoints[j].X, tPoints[j].Y).Diff(Minpt);
					strPath += Math.round(pt2.X) + " " + Math.round(pt2.Y) + ",";
				}
				var pt2 = pMap.FromMapPoint(tPoints[0].X, tPoints[0].Y).Diff(Minpt);
				strPath += Math.round(pt2.X) + " " + Math.round(pt2.Y);
			}
			strPath += " e";
			m_hObj.Path = strPath;
		}
		else
		{
			var HelfSize = new MapPoint(m_LineWidth / 2, m_LineWidth / 2);
			var opt = Minpt.Diff(HelfSize);
			var pt2 = Maxpt.Plus(HelfSize);
			OrgPt = pMap.ToMapPoint(opt.X, opt.Y);
			OrgPt2 = pMap.ToMapPoint(pt2.X, pt2.Y);
			var pDif = pt2.Diff(opt);
			m_hObj.width = pDif.X;
			m_hObj.height = pDif.Y;
			var ctx = m_hObj.getContext("2d");
			function HexToR(h)
			{
				return parseInt(cutHex(h).substring(0, 2), 16);
			}
			function HexToG(h)
			{
				return parseInt(cutHex(h).substring(2, 4), 16);
			}
			function HexToB(h)
			{
				return parseInt(cutHex(h).substring(4, 6), 16);
			}
			function cutHex(h)
			{
				return h.charAt(0) == "#" ? h.substring(1, 7) : h;
			}
			var R = HexToR(m_FillColor);
			var G = HexToG(m_FillColor);
			var B = HexToB(m_FillColor);
			ctx.fillStyle = "rgba(" + R + "," + G + "," + B + ", " + m_Transparency + ")";
			ctx.lineJoin = "round";
			ctx.strokeStyle = m_LineColor;
			ctx.lineWidth = m_LineWidth;
			ctx.beginPath();
			var pt = null;
			for (var i = 0 ; i < m_ptNode.m_Point.length ; i++)
			{
				var tPoints = m_ptNode.m_Point[i];
				pt = pMap.FromMapPoint(tPoints[0].X, tPoints[0].Y).Diff(opt);
				ctx.moveTo(pt.X, pt.Y);
				for (var j = 1 ; j < tPoints.length ; j++)
				{
					pt = pMap.FromMapPoint(tPoints[j].X, tPoints[j].Y).Diff(opt);
					ctx.lineTo(pt.X, pt.Y);
				}
				pt = pMap.FromMapPoint(tPoints[0].X, tPoints[0].Y).Diff(opt);
				ctx.lineTo(pt.X, pt.Y);
			}
			ctx.stroke();
			ctx.msFillRule = "evenodd";
			ctx.fill("evenodd");
			ctx.closePath();
		}
		this.UpdateElement();
	};
	function UpdateNode()
	{
		if (m_ptNode.m_Div)
		{
			for (var i = 0 ; i < m_ptNode.m_Div.length ; i++)
			{
				for (var j = 0 ; j < m_ptNode.m_Div[i].length ; j++)
				{
					pt = pMap.FromMapPoint(m_ptNode.m_Point[i][j].X, m_ptNode.m_Point[i][j].Y);
					m_ptNode.m_Div[i][j].style.left = pt.X - 5 + "px";
					m_ptNode.m_Div[i][j].style.top = pt.Y - 5 + "px";
				}
			}
		}
	}
	this.UpdateElement = function()
	{
		if (m_hObj == null || OrgPt == null || OrgPt2 == null)
			return;
		var Minpt = pMap.FromMapPoint(OrgPt.X, OrgPt.Y);
		var Maxpt = pMap.FromMapPoint(OrgPt2.X, OrgPt2.Y);
		m_hObj.style.left = Minpt.X + "px";
		m_hObj.style.top = Minpt.Y + "px";
		m_hObj.style.width = Maxpt.X - Minpt.X + "px";
		m_hObj.style.height = Maxpt.Y - Minpt.Y + "px";
		UpdateNode();
	};
	this.RebuildElement();
	this.getArea = function()
	{
		var nArea = 0;
		var nCnt = m_ptNode.m_Point[0].length;
		var pt1 = m_ptNode.m_Point[0][nCnt - 1];
		for (var i = 0 ; i < nCnt ; i++)
		{
			var pt2 = m_ptNode.m_Point[0][i];
			nArea += pt2.X * pt1.Y - pt1.X * pt2.Y;
			pt1 = pt2;
		}
		return nArea * .5;
	};
	function pAddPtFunc(pEvent)
	{
		var ptPos = pMap.getCursorPosition(pEvent);
		var mptPos = pMap.ToMapPoint(ptPos.X, ptPos.Y);
		var insert = -1;
		var part = -1;
		var bNoRemove = true;
		for (var i = 0 ; i < m_ptNode.m_Point.length ; i++)
		{
			for (var j = 0 ; j < m_ptNode.m_Point[i].length ; j++)
			{
				var pt1 = pMap.FromMapPoint(m_ptNode.m_Point[i][j].X, m_ptNode.m_Point[i][j].Y);
				if (Math.abs(pt1.X - ptPos.X) < 10 && Math.abs(pt1.Y - ptPos.Y) < 10)
				{
					var pMoveFunc = function(pEvent)
					{
						var ptPos = pMap.getCursorPosition(pEvent);
						ptPos = pMap.ToMapPoint(ptPos.X, ptPos.Y);
						pThis.MovePoint(i, j, ptPos);
						pThis.RebuildElement();
						bNoRemove = false;
						return false;
					};
					var pUpFunc = function(pEvent)
					{
						DetachEvent(m_hObj, "mousemove", pMoveFunc, true);
						DetachEvent(m_hObj, "mouseup", pUpFunc, true);
						if (bNoRemove)
							pThis.RemovePoint(i, j);
						return false;
					};
					AttachEvent(m_hObj, "mouseup", pUpFunc, true);
					AttachEvent(m_hObj, "mousemove", pMoveFunc, true);
					return false;
				}
			}
		}
		var insert = -1;
		var part = -1;
		for (var i = 0 ; i < m_ptNode.m_Point.length ; i++)
		{
			var pt = m_ptNode.m_Point[i][m_ptNode.m_Point[i].length - 1];
			for (var j = 0 ; j < m_ptNode.m_Point[i].length ; j++)
			{
				var ptc = m_ptNode.m_Point[i][j];
				var pt1 = pMap.FromMapPoint(pt.X, pt.Y);
				var pt2 = pMap.FromMapPoint(ptc.X, ptc.Y);
				var pos = LineSide(pt1, pt2, ptPos);
				if (pos == 0)
				{
					pThis.InsertPoint(i, j == 0 ? -1 : j, mptPos);
					pThis.Editable(pThis.m_bEditable);
					return false;
				}
				pt = ptc;
			}
		}
		return false;
	}
	this.Verify = function()
	{
		var len = m_ptNode.m_Point.length;
		if (m_ptNode.m_Point[len - 1].length < 3)
		{
			m_ptNode.m_Point.splice(len - 1, 1);
			return false;
		}
		else
			return false;
	};
	this.Editable = function(v)
	{
		if (this.m_bEditable != v)
		{
			if (v == true)
				AttachEvent(pNode, "mousedown", pAddPtFunc, false);
			else
				DetachEvent(pNode, "mousedown", pAddPtFunc, false);
		}
		this.m_bEditable = v;
		if (v == true)
		{
			if (m_ptNode.m_Div != null)
			{
				for (var i = 0 ; i < m_ptNode.m_Div.length ; i++)
				{
					for (var j = 0 ; j < m_ptNode.m_Div[i].length ; j++)
						m_ptNode.m_Div[i][j].parentNode.removeChild(m_ptNode.m_Div[i][j]);
				}
			}
			m_ptNode.m_Div = new Array;
			for (var i = 0 ; i < m_ptNode.m_Point.length ; i++)
			{
				for (var j = 0 ; j < m_ptNode.m_Point[i].length ; j++)
				{
					pt = pMap.FromMapPoint(m_ptNode.m_Point[i][j].X, m_ptNode.m_Point[i][j].Y);
					if (m_ptNode.m_Div[i] == null)
						m_ptNode.m_Div[i] = new Array;
					var node = CreateDiv(pNode, pt, m_NodeColor);
					m_ptNode.m_Div[i].push(node);
				}
			}
		}
		else
		{
			if (m_ptNode.m_Div)
			{
				for (var i = 0 ; i < m_ptNode.m_Div.length ; i++)
				{
					for (var j = 0 ; j < m_ptNode.m_Div[i].length ; j++)
						m_ptNode.m_Div[i][j].parentNode.removeChild(m_ptNode.m_Div[i][j]);
				}
				m_ptNode.m_Div = null;
			}
			m_ptNode.m_Div = new Array;
		}
	};
	this.Destroy = function()
	{
		if (m_hObj == null)
			return false;
		pNode.removeChild(m_hObj);
		if (m_ptNode.m_Div)
		{
			for (var i = 0 ; i < m_ptNode.m_Div.length ; i++)
			{
				for (var j = 0 ; j < m_ptNode.m_Div[i].length ; j++)
					m_ptNode.m_Div[i][j].parentNode.removeChild(m_ptNode.m_Div[i][j]);
			}
		}
		m_hObj = null;
		m_ptNode = new PointNode;
		pMap.RemoveLayer(this);
	};
	var ParseWKTPart = function(strPts, withZ, withM)
	{
		var pArr = new Array;
		var ss = trimParent(strPts).split(",");
		for (var k = 0 ; k < ss.length ; k++)
		{
			var sss = ss[k].split(" ");
			if (isNaN(sss[0]) || isNaN(sss[1]))
				return false;
			var pt = new MapPoint(parseFloat(sss[0]), parseFloat(sss[1]));
			if (withZ && withM)
			{
				if (!isNaN(sss[2]))
					pt.Z = parseFloat(sss[2]);
				if (!isNaN(sss[3]))
					pt.M = parseFloat(sss[3]);
			}
			else if (withZ)
			{
				if (!isNaN(sss[2]))
					pt.Z = parseFloat(sss[2]);
			}
			else if (withM)
			{
				if (!isNaN(sss[2]))
					pt.M = parseFloat(sss[2]);
			}
			pArr.push(pt);
		}
		m_ptNode.m_Point.push(pArr);
		return true;
	};
	this.ParseWKT = function(strPts, withZ, withM)
	{
		m_ptNode.m_Point = new Array;
		var parentSplit = /\)\s*,\s*\(/;
		var pts = [];
		var rings = [];
		var ringStrs = trimParent(trimTypeStr(strPts)).split(parentSplit);
		for (var r = 0 ; r < ringStrs.length ; r++)
			ParseWKTPart(ringStrs[r], withZ, withM);
		this.RebuildElement();
		return true;
	};
	pMap.AddElement(this);
}
function trimTypeStr(instr)
{
	return instr.replace(/^\s*(\w+)\s*\(\s*(.*)\s*\)\s*$/, "$2");
}
function trimParent(instr)
{
	return instr.replace(/^\s*\(?(.*?)\)?\s*$/, "$1");
}
function ltrim(instr)
{
	return instr.replace(/^[\s]*/gi, "");
}
function rtrim(instr)
{
	return instr.replace(/[\s]*$/gi, "");
}
function trim(instr)
{
	return rtrim(ltrim(instr));
}
function MultiGeometry(pMapBase, prefix)
{
	var m_Geomertrys = new Array;
	this.putFillColor = function(FillColor)
	{
		for (var i = 0 ; i < m_Geomertrys.length ; i++)
		{
			if (m_Geomertrys[i].putFillColor)
				m_Geomertrys[i].putFillColor(FillColor);
		}
	};
	this.putLineColor = function(LineColor)
	{
		for (var i = 0 ; i < m_Geomertrys.length ; i++)
		{
			if (m_Geomertrys[i].putLineColor)
				m_Geomertrys[i].putLineColor(LineColor);
		}
	};
	this.putLineWidth = function(LineWidth)
	{
		for (var i = 0 ; i < m_Geomertrys.length ; i++)
		{
			if (m_Geomertrys[i].putLineWidth)
				m_Geomertrys[i].putLineWidth(LineWidth);
		}
	};
	this.Editable = function(v)
	{
		for (var i = 0 ; i < m_Geomertrys.length ; i++)
			m_Geomertrys[i].Editable(v);
	};
	this.Destroy = function()
	{
		for (var i = 0 ; i < m_Geomertrys.length ; i++)
			m_Geomertrys[i].Destroy();
	};
	this.ParseWKT = function(strPts, withZ, withM)
	{
		var trimParens = /^\s*\(?(.*?)\)?\s*$/;
		var spaces = /\s+/;
		var commaSplit = /\s*,\s*/;
		var parentSplit = /\)\s*,\s*\(/;
		var doubleParenComma = /\)\s*\)\s*,\s*\(\s*\(/;
		var typeStr = /^\s*(\w+)\s*\(\s*(.*)\s*\)\s*$/;
		var pGeomertry = null;
		var geomStrs = "";
		
		switch(prefix)
		{
			case "MULTIPOINT":
				geomStrs = trimTypeStr(strPts).split(",");
				for (var geom = 0 ; geom < geomStrs.length ; geom++)
				{
					pGeomertry = new Point(pMapBase);
					pGeomertry.ParseWKT(geomStrs[geom], withZ, withM);
					m_Geomertrys.push(pGeomertry);
				}
				break;
			case "MULTILINESTRING":
				geomStrs = trimTypeStr(trimParent(strPts)).split(parentSplit);
				for (var geom = 0 ; geom < geomStrs.length ; geom++)
				{
					pGeomertry = new Polyline(pMapBase);
					pGeomertry.ParseWKT(geomStrs[geom], withZ, withM);
					m_Geomertrys.push(pGeomertry);
				}
			case "MULTIPOLYGON":
				geomStrs = trimTypeStr(strPts).split(doubleParenComma);
				for (var geom = 0;geom < geomStrs.length;geom++)
				{
					pGeomertry = new Polygon(pMapBase);
					pGeomertry.ParseWKT(geomStrs[geom], withZ, withM);
					m_Geomertrys.push(pGeomertry);
				}
				break;
			default:
				break;
		}
		return true;
	};
	this.toString = function ()
	{
		if (prefix == "GEOMETRYCOLLECTION")
		{
			var ss = new Array;
			for (var i = 0 ; i < m_Geomertrys.length ; i++)
				ss.push(m_Geomertrys[i].WellKnownText());
			return ss.join(",");
		}
		return "(" + m_Geomertrys.join("),(") + ")";
	};
	this.WellKnownText = function()
	{
		if (m_Geomertrys == null)
			return "";
		return prefix + " (" + this.toString() + ")";
	};
	this.getExtent = function()
	{
		var f = m_Geomertrys[0].getExtent();
		var mapMaxX = f.xmax;
		var mapMaxY = f.ymax;
		var mapMinX = f.xmin;
		var mapMinY = f.ymin;
		for (var i = 0 ; i < m_Geomertrys.length ; i++)
		{
			var temp = m_Geomertrys[i].getExtent();
			if (temp.xmax > mapMaxX)
				mapMaxX = temp.xmax;
			if (temp.ymax > mapMaxY)
				mapMaxY = temp.ymax;
			if (temp.xmin < mapMinX)
				mapMinX = temp.xmin;
			if (temp.ymin < mapMinY)
				mapMinY = temp.ymin;
		}
		var mapExtent = new sg.geometry.Extent(mapMinX, mapMinY, mapMaxX, mapMaxY);
		return mapExtent;
	};
}
function getNodeValue(node)
{
	if (node && node.hasChildNodes())
	{
		var s = "";
		for (var j = 0 ; j < node.childNodes.length ; j++)
			s += new String(node.childNodes.item(j).nodeValue);
		return s;
	}
	else
		return "";
}
function ImportGeometryXML(pMapBase, pGeomXML)
{
	var pGeomertry = null;
	var str = "";
	
	if (DeviceTest() == "Firefox")
		str = getNodeValue(pGeomXML);
	else
		str = pGeomXML.firstChild.nodeValue;
	
	var sIdx = str.indexOf("(");
	var prefix = trim(str.substr(0, sIdx).toUpperCase());
	var withZ = false;
	var withM = false;
	if (prefix[prefix.length - 2] + prefix[prefix.length - 1] == "ZM")
	{
		withZ = true;
		withM = true;
	}
	else if (prefix[prefix.length - 1] == "Z")
		withZ = true;
	else if (prefix[prefix.length - 1] == "M")
		withM = true;
	
	if (prefix.indexOf("MULTI") != -1)
		pGeomertry = new MultiGeometry(pMapBase, prefix);
	else if (prefix.indexOf("POINT") >= 0)
		pGeomertry = new Point(pMapBase);
	else if (prefix.indexOf("LINESTRING") >= 0)
		pGeomertry = new Polyline(pMapBase);
	else if (prefix.indexOf("POLYGON") >= 0)
		pGeomertry = new Polygon(pMapBase);
	
	pGeomertry.withZ = withZ;
	pGeomertry.withM = withM;
	pGeomertry.ParseWKT(str, withZ, withM);
	return pGeomertry;
}