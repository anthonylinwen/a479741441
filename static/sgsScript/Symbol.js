sg.symbols = sg.symbols || function()
{
	var simpleFillStyleImg = {
		STYLE_BACKWARD_DIAGONAL:"data/BackwardDiagonal.png",
		STYLE_CROSS:"data/Cross.png",
		STYLE_DIAGONAL_CROSS:"data/DiagonalCross.png",
		STYLE_FORWARD_DIAGONAL:"data/Diagonal.png",
		STYLE_HORIZONTAL:"data/Horizontal.png",
		STYLE_VERTICAL:"data/Vertical.png"
	};
	var componentToHex = function(c)
	{
		var hex = c.toString(16);
		return hex.length == 1 ? "0" + hex : hex;
	};
	var rgbToHex = function(r, g, b)
	{
		return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
	};
	var setOutline = function(shape, lineSym)
	{
		if (lineSym && lineSym.style != sg.symbols.SimpleLineSymbol.STYLE_NULL)
		{
			shape.attr({"stroke":lineSym.color.toHex()});
			shape.attr({"stroke-width":lineSym.width});
			shape.attr({"stroke-dasharray":strokeDashArrays[lineSym.style]});
		}
	};
	var getImageDimensions = function(path, callback)
	{
		var img = new Image;
		img.onload = function()
		{
			callback({width:img.width, height:img.height});
		};
		img.src = path;
	};
	var getExtPath = function(map, geom, tx, ty)
	{
		var lt = map.FromMapPoint(geom.xmin, geom.ymax);
		var rb = map.FromMapPoint(geom.xmax, geom.ymin);
		var str = "M" + (lt.X - tx) + " " + (lt.Y - ty);
		str += "L" + (rb.X - tx) + " " + (lt.Y - ty);
		str += "L" + (rb.X - tx) + " " + (rb.Y - ty);
		str += "L" + (lt.X - tx) + " " + (rb.Y - ty);
		str += "L" + (lt.X - tx) + " " + (lt.Y - ty);
		str += "Z";
		return str;
	};
	var getPolyPath = function(map, geom, tx, ty)
	{
		var pathStr = "";
		for (var r = 0 ; r < geom.rings.length ; r++)
		{
			var fp = map.FromMapPoint(geom.rings[r].path[0].x, geom.rings[r].path[0].y);
			pathStr += " M " + (fp.X - tx) + " " + (fp.Y - ty);
			for (var p = geom.rings[r].path.length - 1 ; p > -1 ; p--)
			{
				var mapPt = map.FromMapPoint(geom.rings[r].path[p].x, geom.rings[r].path[p].y);
				pathStr += "L" + (mapPt.X - tx) + " " + (mapPt.Y - ty);
			}
			pathStr += " Z ";
		}
		return pathStr;
	};
	var getMPolyPath = function(map, geom, tx, ty)
	{
		var pathStr = "";
		for (var k = 0 ; k < geom.parts.length ; k++)
		{
			var part = geom.parts[k];
			for (var r = 0 ; r < part.rings.length ; r++)
			{
				var fp = map.FromMapPoint(part.rings[r].path[0].x, part.rings[r].path[0].y);
				pathStr += " M " + (fp.X - tx) + " " + (fp.Y - ty);
				for (var p = part.rings[r].path.length - 1 ; p > -1 ; p--)
				{
					var mapPt = map.FromMapPoint(part.rings[r].path[p].x, part.rings[r].path[p].y);
					pathStr += "L" + (mapPt.X - tx) + " " + (mapPt.Y - ty);
				}
				pathStr += " Z ";
			}
		}
		return pathStr;
	};
	var getLinePath = function(map, geometry, tx, ty)
	{
		if (!geometry.path || geometry.path.length <= 0)
			return;
		var fp = map.FromMapPoint(geometry.path[0].x, geometry.path[0].y);
		var rStr = "M" + (fp.X - tx) + " " + (fp.Y - ty);
		for (var p = 1 ; p < geometry.path.length ; p++)
		{
			var mapPt = map.FromMapPoint(geometry.path[p].x, geometry.path[p].y);
			rStr += "L" + (mapPt.X - tx) + " " + (mapPt.Y - ty);
		}
		return rStr;
	};
	var getMLinePath = function(map, geometry, tx, ty)
	{
		var pathStr = "";
		for (var j = 0 ; j < geometry.parts.length ; j++)
		{
			var part = geometry.parts[j];
			var fp = map.FromMapPoint(part.path[0].x, part.path[0].y);
			pathStr += "M" + (fp.X - tx) + " " + (fp.Y - ty);
			for (var p = 1 ; p < part.path.length ; p++)
			{
				var mapPt = map.FromMapPoint(part.path[p].x, part.path[p].y);
				pathStr += "L" + (mapPt.X - tx) + " " + (mapPt.Y - ty);
			}
		}
		return pathStr;
	};
	var getPath = function(layer, geom)
	{
		if (!layer || !geom)
			return "";
		var trans = layer.trans;
		var tx = trans ? trans.X : 0;
		var ty = trans ? trans.Y : 0;
		var map = layer.getMap();
		
		if (!map)
			return "";
		
		if (geom instanceof sg.geometry.Extent)
			return getExtPath(map, geom, tx, ty);
		else if (geom instanceof sg.geometry.Polygon)
			return getPolyPath(map, geom, tx, ty);
		else if (geom instanceof sg.geometry.MultiPolygon)
			return getMPolyPath(map, geom, tx, ty);
		else if (geom instanceof sg.geometry.LineString)
			return getLinePath(map, geom, tx, ty);
		else if (geom instanceof sg.geometry.MultiLineString)
			return getMLinePath(map, geom, tx, ty);
		else
			return "";
	};
	var symbols = {};
	symbols.Symbol = sg.Class.extend(
	{
		type: null,
		color: null,
		setType: function()
		{
			this.type = type;
			return this;
		},
		setColor: function(color)
		{
			this.color = color;
			return this;
		}
	});
	symbols.LineSymbol = symbols.Symbol.extend(
	{
		initialize: function()
		{
			this.color = new sg.Color(50, 50, 100, .8);
		},
		width: 1,
		setWidth: function(width)
		{
			this.width = width;
			return this;
		}
	});
	symbols.FillSymbol = symbols.Symbol.extend(
	{
		initialize: function()
		{
			this.color = new sg.Color(128, 255, 128, .8);
			this.outline = new sg.symbols.SimpleLineSymbol;
		},
		outline: null,
		setOutline: function(outline)
		{
			this.outline = outline;
			return this;
		}
	});
	symbols.MarkerSymbol = symbols.Symbol.extend(
	{
		initialize: function()
		{
			this.color = new sg.Color(128, 255, 128, .8);
		},
		angle: 0,
		size: 8,
		xoffset: 0,
		yoffset: 0,
		setAngle: function(angle)
		{
			this.angle = angle;
			return this;
		},
		setOffset: function(x, y)
		{
			this.xoffset = x;
			this.yoffset = y;
			return this;
		},
		setSize: function(size)
		{
			this.size = size;
			return this;
		}
	});
	symbols.SimpleMarkerSymbol = symbols.MarkerSymbol.extend(
	{
		initialize: function(style, size, outline, color)
		{
			symbols.MarkerSymbol.prototype.initialize.call(this);
			this.type = "simpleMarkerSymbol";
			if (style)
				this.style = style;
			if (typeof size == "number")
				this.size = size;
			this.outline = outline instanceof sg.symbols.SimpleLineSymbol ? outline : new sg.symbols.SimpleLineSymbol;
			if (color instanceof sg.Color)
				this.color = color;
		},
		path: null,
		outline: null,
		style: "STYLE_CIRCLE",
		setPath: function(path)
		{
			this.path = path;
			return this;
		},
		setOutline: function(outline)
		{
			this.outline = outline;
			return this;
		},
		setStyle: function(style)
		{
			if (!(style in sg.symbols.SimpleMarkerSymbol))
				throw "Invalid SimpleMarkerSymbol Style";
			this.style = style;
			return this;
		},
		draw: function(layer, geometry)
		{
			var surface = layer.surface_;
			var pts;
			var shape;
			var trans = layer.trans;
			if (geometry instanceof sg.geometry.MultiPoint)
			{
				pts = geometry.parts;
				surface = surface.group();
			}
			else if (geometry instanceof sg.geometry.Point)
			{
				pts = [geometry];
			}
			else if (geometry instanceof sg.geometry.Polygon)
			{
				pts = [geometry.getCentroid()];
			}
			else if (geometry instanceof sg.geometry.MultiPolygon)
			{
				surface = surface.group();
				pts = [];
				for (var p = 0 ; p < geometry.parts.length ; p++)
					pts.push(geometry.parts[p].getCentroid());
			}
			for (var i = 0 ; i < pts.length ; i++)
			{
				var pt = pts[i];
				var map = layer.getMap();
				var mp = map.FromMapPoint(pt.x, pt.y);
				var px = mp.X - (trans ? trans.X : 0);
				var py = mp.Y - (trans ? trans.Y : 0);
				
				switch(this.style)
				{
					case sg.symbols.SimpleMarkerSymbol.STYLE_CIRCLE:
						var shape = surface.circle(0, 0, this.size / 2);
						shape.attr({fill:this.color.toHex(), "fill-opacity":this.color.a});
						break;
					case sg.symbols.SimpleMarkerSymbol.STYLE_SQUARE:
						var shape = surface.rect(0, 0, this.size, this.size);
						shape.attr({fill:this.color.toHex(), "fill-opacity":this.color.a});
						break;
					case sg.symbols.SimpleMarkerSymbol.STYLE_CROSS:
						var h = this.size / 2;
						var shape = surface.path("M" + 0 + " " + this.size / 2 + "L" + this.size + " " + this.size / 2 + " M" + this.size / 2 + " " + 0 + "L" + this.size / 2 + " " + this.size);
						shape.attr({stroke:this.color.toHex(), "stroke-opacity":this.color.a});
						shape.attr({"stroke-width":this.size / 4});
						break;
					case sg.symbols.SimpleMarkerSymbol.STYLE_X:
						var h = this.size / 2;
						var shape = surface.path("M" + 0 + " " + 0 + "L" + this.size + " " + this.size + " M" + this.size + " " + 0 + "L" + 0 + " " + this.size);
						shape.attr({stroke:this.color.toHex(), "stroke-opacity":this.color.a});
						shape.attr({"stroke-width":this.size / 4});
						break;
					case sg.symbols.SimpleMarkerSymbol.STYLE_DIAMOND:
						var diamondStr = "M p1x p1y L p2x p2y L p3x p3y L p4x p4y Z";
						var h = this.size / 2;
						diamondStr = diamondStr.replace("p1x", h);
						diamondStr = diamondStr.replace("p1y", 0);
						diamondStr = diamondStr.replace("p2x", this.size);
						diamondStr = diamondStr.replace("p2y", h);
						diamondStr = diamondStr.replace("p3x", h);
						diamondStr = diamondStr.replace("p3y", this.size);
						diamondStr = diamondStr.replace("p4x", 0);
						diamondStr = diamondStr.replace("p4y", h);
						var shape = surface.path(diamondStr);
						shape.attr({"fill":this.color.toHex(), "fill-opacity":this.color.a});
						break;
					case sg.symbols.SimpleMarkerSymbol.STYLE_PATH:
						var shape = surface.path(this.path);
						shape.attr({"fill":this.color.toHex(), "fill-opacity":this.color.a});
						break;
				}
				setOutline(shape, this.outline);
				var bbox = shape.getBBox(true);
				var offx = bbox.x + bbox.width / 2;
				var offy = bbox.y + bbox.height / 2;
				var tstr = "t" + (px - offx + this.xoffset) + " " + (py - offy + this.yoffset) + "r" + this.angle + " " + bbox.width / 2 + " " + bbox.height / 2;
				shape.transform(tstr);
			}
			if (geometry instanceof sg.geometry.MultiPart)
				shape = surface;
			return shape;
		},
		styleLookUp_:
		{
			STYLE_CROSS: "SGO_SPS_Cross",
			STYLE_CIRCLE:"SGO_SPS_Circle",
			STYLE_DIAMOND:"SGO_SPS_Diamond",
			STYLE_PATH:"SGO_SPS_Path",
			STYLE_SQUARE:"SGO_SPS_Square",
			STYLE_X:"SGO_SPS_X"
		},
		toXml: function(innerText)
		{
			var xml = (innerText ? "" : "<Symbol>") + "<Type>SimpleMarkerSymbol</Type>" + "<Style>" + this.styleLookUp_[this.style] + "</Style>" + "<Color>" + this.color.r + "," + this.color.g + "," + this.color.b + "," + "</Color>" + "<Size>" + this.size + "</Size>" + "<XOffset>" + this.xoffset + "</XOffset>" + "<YOffset>" + this.yoffset + "</YOffset>" + (innerText ? "" : "</Symbol>");
			return xml;
		},
		statics:
		{
			STYLE_CROSS: "STYLE_CROSS",
			STYLE_CIRCLE: "STYLE_CIRCLE",
			STYLE_DIAMOND: "STYLE_DIAMOND",
			STYLE_PATH: "STYLE_PATH",
			STYLE_SQUARE: "STYLE_SQUARE",
			STYLE_X: "STYLE_X"
		}
	});
	symbols.SimpleFillSymbol = symbols.FillSymbol.extend(
	{
		style: "STYLE_SOLID",
		initialize: function(style, outline, color)
		{
			symbols.FillSymbol.prototype.initialize.call(this);
			this.type = "simpleFillSymbol";
			if (style)
				this.style = style;
			
			if (outline instanceof sg.symbols.SimpleLineSymbol)
				this.outline = outline;
			
			if (color instanceof sg.Color)
				this.color = color;
		},
		setStyle: function(style)
		{
			if (!(style in sg.symbols.SimpleFillSymbol))
				throw "Invalid SimpleFillSymbol Style";
			this.style = style;
			return this;
		},
		draw: function(layer, geometry)
		{
			var pathStr = "";
			var map = layer.getMap();
			var surface_ = layer.surface_;
			var shape;
			pathStr = getPath(layer, geometry);
			shape = surface_.path(pathStr);
			shape.attr({"fill-rule":"evenodd", "fill-opacity":this.color.a});
			
			if (this.style == "STYLE_NULL")
				shape.attr({"fill-opacity":0});
			else if (this.style == "STYLE_SOLID")
				shape.attr({"fill":this.color.toHex()});
			else
				shape.attr({"fill":{type:"pattern", src:simpleFillStyleImg[this.style], width:16, height:16}});
			
			if (this.outline && this.outline.style != sg.symbols.SimpleLineSymbol.STYLE_NULL)
				setOutline(shape, this.outline);
			return shape;
		},
		styleLookUp_:
		{
			STYLE_BACKWARD_DIAGONAL: "SGO_SFS_BackwardDiagonal",
			STYLE_CROSS: "SGO_SFS_Cross",
			STYLE_DIAGONAL_CROSS: "SGO_SFS_DiagonalCross",
			STYLE_FORWARD_DIAGONAL: "SGO_SFS_ForwardDiagonal",
			STYLE_HORIZONTAL: "SGO_SFS_Horizontal",
			STYLE_NULL: "SGO_SFS_Null",
			STYLE_SOLID: "SGO_SFS_Solid",
			STYLE_VERTICAL: "SGO_SFS_Vertical"
		},
		toXml: function(innerText)
		{
			var xml = (innerText ? "" : "<Symbol>") + "<Type>SimpleFillSymbol</Type>" + "<Color>" + this.color.r + "," + this.color.g + "," + this.color.b + "," + this.color.a * 255 + "</Color>" + "<Style>" + this.styleLookUp_[this.style] + "</Style>" + "<Outline>" + this.outline.toXml(true) + "</Outline>" + (innerText ? "" : "</Symbol>");
			return xml;
		},
		statics:
		{
			STYLE_BACKWARD_DIAGONAL: "STYLE_BACKWARD_DIAGONAL",
			STYLE_CROSS: "STYLE_CROSS",
			STYLE_DIAGONAL_CROSS: "STYLE_DIAGONAL_CROSS",
			STYLE_FORWARD_DIAGONAL: "STYLE_FORWARD_DIAGONAL",
			STYLE_HORIZONTAL: "STYLE_HORIZONTAL",
			STYLE_NULL: "STYLE_NULL",
			STYLE_SOLID: "STYLE_SOLID",
			STYLE_VERTICAL: "STYLE_VERTICAL"
		}
	});
	symbols.SimpleLineSymbol = symbols.LineSymbol.extend(
	{
		initialize: function(style, color, width)
		{
			symbols.LineSymbol.prototype.initialize.call(this);
			this.type = "simpleLineSymbol";
			if (style)
				this.style = style;
			if (color instanceof sg.Color)
				this.color = color;
			if (typeof width == "number")
				this.width = width;
		},
		style: "STYLE_SOLID",
		setStyle: function(style)
		{
			if (!(style in sg.symbols.SimpleLineSymbol))
				throw "Invalid SimpleLineSymbol Style";
			this.style = style;
			return this;
		},
		draw: function(layer, geometry)
		{
			var shape;
			var map = layer.getMap();
			var surface_ = layer.surface_;
			var rStr = getPath(layer, geometry);
			shape = surface_.path(rStr);
			shape.attr({"fill":"none", "stroke":this.color.toHex(), "stroke-opacity":this.color.a});
			
			if (this.style != sg.symbols.SimpleLineSymbol.STYLE_NULL)
				setOutline(shape, this);
			
			return shape;
		},
		styleLookup_:
		{
			STYLE_DASH: "SGO_SLS_Dash",
			STYLE_DASHDOT: "SGO_SLS_DashDot",
			STYLE_DASHDOTDOT: "SGO_SLS_DashDotDot",
			STYLE_DOT: "SGO_SLS_Dot",
			STYLE_LONGDASH: "SGO_SLS_Solid",
			STYLE_LONGDASHDOT: "SGO_SLS_Solid",
			STYLE_NULL: "SGO_SLS_Solid",
			STYLE_SHORTDASH: "SGO_SLS_Solid",
			STYLE_SHORTDASHDOT: "SGO_SLS_Solid",
			STYLE_SHORTDASHDOTDOT: "SGO_SLS_Solid",
			STYLE_SHORTDOT: "SGO_SLS_Solid",
			STYLE_SOLID: "SGO_SLS_Solid"
		},
		toXml: function(innerText)
		{
			var xml = (innerText ? "" : "<Symbol>") + "<Type>SimpleLineSymbol</Type>" + "<Width>" + this.width + "</Width>" + "<Color>" + this.color.r + "," + this.color.g + "," + this.color.b + "," + this.color.a * 255 + "</Color>" + "<Style>" + this.styleLookup_[this.style] + "</Style>" + (innerText ? "" : "</Symbol>");
			return xml;
		},
		statics:
		{
			STYLE_DASH: "STYLE_DASH",
			STYLE_DASHDOT: "STYLE_DASHDOT",
			STYLE_DASHDOTDOT: "STYLE_DASHDOTDOT",
			STYLE_DOT: "STYLE_DOT",
			STYLE_LONGDASH: "STYLE_LONGDASH",
			STYLE_LONGDASHDOT: "STYLE_LONGDASHDOT",
			STYLE_NULL: "STYLE_NULL",
			STYLE_SHORTDASH: "STYLE_SHORTDASH",
			STYLE_SHORTDASHDOT: "STYLE_SHORTDASHDOT",
			STYLE_SHORTDASHDOTDOT: "STYLE_SHORTDASHDOTDOT",
			STYLE_SHORTDOT: "STYLE_SHORTDOT",
			STYLE_SOLID: "STYLE_SOLID"
		}
	});
	symbols.PictureFillSymbol = symbols.FillSymbol.extend(
	{
		initialize: function(url, outline, width, height)
		{
			symbols.FillSymbol.prototype.initialize.call(this);
			this.type = "pictureFillSymbol";
			this.url = url;
			this.outline = outline;
			this.width = width;
			this.height = height;
		},
		type: "pictureFillSymbol",
		url: "",
		width: 0,
		height: 0,
		xscale: 1,
		yscale: 1,
		setUrl: function(url)
		{
			this.url = url;
			return this;
		},
		setOffset: function(x, y)
		{
			this.xoffset = x;
			this.yoffset = y;
			return this;
		},
		setWidth: function()
		{
			this.width = width;
			return this;
		},
		setHeight: function(height)
		{
			this.height = height;
			return this;
		},
		setXScale: function(xscale)
		{
			this.xscale = xscale;
			return this;
		},
		setYScale: function(yscale)
		{
			this.yscale = yscale;
			return this;
		},
		draw: function(layer, geometry)
		{
			var shape;
			var map = layer.getMap();
			var surface_ = layer.surface_;
			var pathStr = getPath(layer, geometry);
			shape = surface_.path(pathStr);
			var extent = geometry.getExtent();
			var leftTop = map.FromMapPoint(extent.xmin, extent.ymax);
			var p_x = leftTop.X;
			var p_y = leftTop.Y;
			
			if (typeof this.xoffset == "number")
				p_x += this.xoffset;
			if (typeof this.yoffset == "number")
				p_y += this.yoffset;
			
			shape.attr({"fill":this.url ? {type:"pattern", src:this.url, x:p_x, y:p_y, width:typeof this.width == "number" ? this.width * this.xscale : this.width, height:typeof this.width == "number" ? this.height * this.yscale : this.height} : this.color.toHex(), "fill-opacity":this.color.a});
			
			if (this.outline && this.outline.style != sg.symbols.SimpleLineSymbol.STYLE_NULL)
				setOutline(shape, this.outline);
			return shape;
		}	
	});
	symbols.PictureMarkerSymbol = symbols.MarkerSymbol.extend(
	{
		initialize: function(url, width, height)
		{
			symbols.MarkerSymbol.prototype.initialize.call(this);
			this.url = url;
			var that = this;
			getImageDimensions(url, function(dim)
			{
				if (typeof width != "number")
					that.width = dim.width;
				if (typeof height != "number")
					that.height = dim.height;
			});
			if (typeof width == "number")
				this.width = width;
			if (typeof height == "number")
				this.height = height;
			this.type = "pictureMarkerSymbol";
		},
		width: 0,
		height: 0,
		url: "",
		setWidth: function(width)
		{
			this.width = width;
			return this;
		},
		setHeight:function(height)
		{
			this.height = height;
			return this;
		},
		setUrl: function(url)
		{
			this.url = url;
			return this;
		},
		draw: function(layer, geometry)
		{
			var surface = layer.surface_;
			var map = layer.getMap();
			var pts;
			if (geometry instanceof sg.geometry.MultiPoint)
			{
				pts = geometry.parts;
				surface = surface.group();
			}
			else if (geometry instanceof sg.geometry.Point)
			{
				pts = [geometry];
			}
			for (var i = 0 ; i < pts.length ; i++)
			{
				var mp = map.FromMapPoint(pts[i].x, pts[i].y);
				var px = mp.X - this.width / 2 + this.xoffset;
				var py = mp.Y - this.height / 2 + this.yoffset;
				shape = surface.image(this.url, px, py, this.width, this.height);
				var bbox = shape.getBBox(true);
				
				if (this.color)
					shape.attr({"opacity":this.color.a});
				
				var tstr = "r" + this.angle + " " + bbox.width / 2 + " " + bbox.height / 2;
				shape.transform(tstr);
			}
			if (geometry instanceof sg.geometry.MultiPoint)
				shape = surface;
			return shape;
		}
	});
	symbols.Font = sg.Class.extend(
	{
		initialize: function(size_or_json, style, variant, weight, family)
		{
			this.size = typeof size_or_json == "number" ? size_or_json : 12;
			this.style = typeof style == "string" ? style : "normal";
			this.variant = typeof variant == "string" ? variant : "normal";
			this.weight = typeof weight == "string" ? weight : "normal";
			this.family = typeof family == "string" ? family : "normal";
		},
		decoration: "none",
		family: "",
		size: 12,
		style: "normal",
		variant: "normal",
		weight: "normal",
		setDecoration: function(decoration)
		{
			this.decoration = decoration;
			return this;
		},
		setFamily: function(family)
		{
			this.family = family;
			return this;
		},
		setSize: function(size)
		{
			this.size = size;
			return this;
		},
		setStyle: function(style)
		{
			this.style = style;
			return this;
		},
		setVariant: function(variant)
		{
			this.variant = variant;
			return this;
		},
		setWeight: function(weight)
		{
			this.weight = weight;
			return this;
		},
		statics:
		{
			STYLE_ITALIC: "italic",
			STYLE_NORMAL: "normal",
			STYLE_OBLIQUE: "oblique",
			VARIANT_NORMAL: "normal",
			VARIANT_SMALLCAPS: "small-caps",
			WEIGHT_BOLD: "bold",
			WEIGHT_BOLDER: "bolder",
			WEIGHT_LIGHTER: "lighter",
			WEIGHT_NORMAL: "normal"
		}
	});
	symbols.TextSymbol = symbols.Symbol.extend(
	{
		initialize: function(text_or_json, font, color)
		{
			this.text = text_or_json;
			this.type = "TextSymbol";
			this.color = color instanceof sg.Color ? color : new sg.Color(0, 0, 0, 1);
			this.font = font instanceof sg.symbols.Font ? font : new sg.symbols.Font;
		},
		align: "middle",
		angle: 0,
		decoration: "none",
		font: null,
		horizontalAlignment: "center",
		kerning: true,
		rotated: false,
		text: "",
		verticalAlignment: "center",
		xoffset: 0,
		yoffset: 0,
		setAlign: function(p)
		{
			this.align = p;
		},
		setAngle: function(p)
		{
			this.angle = p;
			return this;
		},
		setColor: function(p)
		{
			this.color = p;
			return this;
		},
		setFont:function(p)
		{
			if (p instanceof sg.symbols.Font)
				this.font = p;
			return this;
		},
		setDecoration: function(p)
		{
			this.decoration = p;
			return true;
		},
		setKerning: function(p)
		{
			this.xoffset = x;
			this.yoffset = y;
			return this;
		},
		setOffset: function(x, y)
		{
			this.xoffset = x;
			this.yoffset = y;
			return this;
		},
		setRotated: function(p)
		{
			this.rotated = p;
			return this;
		},
		setText: function(p)
		{
			this.text = p;
			return this;
		},
		setVerticalAlignment: function(p)
		{
			this.verticalAlighment = p;
			return this;
		},
		toJson: function()
		{
			return "";
		},
		draw: function(layer, geometry)
		{
			var map = layer.getMap();
			var surface_ = layer.surface_;
			var shape;
			var pts;
			if (geometry instanceof sg.geometry.MultiPoint)
			{
				pts = geometry.parts;
				surface_ = surface_.group();
			}
			else if (geometry instanceof sg.geometry.Point)
			{
				pts = [geometry];
			}
			var trans = layer.trans;
			var tx = trans ? trans.X : 0;
			var ty = trans ? trans.Y : 0;
			for (var i = 0 ; i < pts.length ; i++)
			{
				var pt = pts[i];
				var mapPt = map.FromMapPoint(pt.x, pt.y);
				shape = surface_.text(mapPt.X - tx + this.xoffset, mapPt.Y - ty + this.yoffset, this.text);
				shape.attr({"fill":this.color.toHex(), "fill-opacity":this.color.a, "font-style":this.font.style, "font-variant":this.font.variant, "font-family":this.font.family, "kerning":this.kerning ? this.font.kerning : "", "font-size":this.font.size, "text-anchor":this.align, "text-decoration":this.font.decoration, "font-weight":this.font.weight, "class":this.className});
			}
			if (geometry instanceof sg.geometry.MultiPoint)
				shape = surface_;
			return shape;
		},
		statics:
		{
			ALIGN_END: "end",
			ALIGN_MIDDLE: "middle",
			ALIGN_START: "start",
			DECORATION_LINETHROUGH: "line-through",
			DECORATION_OVERLINE: "overline",
			DECORATION_UNDERLINE: "underline"
		}
	});
	var strokeDashArrays = {};
	strokeDashArrays[symbols.SimpleLineSymbol.STYLE_DASH] = "_";
	strokeDashArrays[symbols.SimpleLineSymbol.STYLE_DASHDOT] = "_.";
	strokeDashArrays[symbols.SimpleLineSymbol.STYLE_DASHDOTDOT] = "_..";
	strokeDashArrays[symbols.SimpleLineSymbol.STYLE_DOT] = ".";
	strokeDashArrays[symbols.SimpleLineSymbol.STYLE_LONGDASH] = "~";
	strokeDashArrays[symbols.SimpleLineSymbol.STYLE_LONGDASHDOT] = "~.";
	strokeDashArrays[symbols.SimpleLineSymbol.STYLE_SHORTDASH] = "-";
	strokeDashArrays[symbols.SimpleLineSymbol.STYLE_SHORTDASHDOT] = "-.";
	strokeDashArrays[symbols.SimpleLineSymbol.STYLE_SHORTDASHDOTDOT] = "-..";
	strokeDashArrays[symbols.SimpleLineSymbol.STYLE_SHORTDOT] = ".";
	strokeDashArrays[symbols.SimpleLineSymbol.STYLE_SOLID] = "";
	return symbols;
}();