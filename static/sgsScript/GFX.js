(function()
{
	var ns = "http://www.w3.org/2000/svg";
	var xlinks = "http://www.w3.org/1999/xlink";
	var pattern = /((t)([\d\.]*)[\s,]*([-\d\.]*))|((r)([\d\.]*)[\s,]*([-\d\.]*)[\s,]*([\d\.]*))/gi;
	
	var parseTransform = function(tstr)
	{
		var result = "";
		var indices = [];
		
		for (var i = 0 ; i < tstr.length ; i++)
		{
			var w = tstr[i];
			if (w == "t" || w == "r")
				indices.push(i);
		}
		for (var j = 0 ; j < indices.length ; j++)
		{
			var nums = tstr.slice(indices[j] + 1, indices[j + 1]);
			if (tstr[indices[j]] == "t")
			{
				var str = "translate(" + nums + ") ";
				result += str;
			}
			else if (tstr[indices[j]] == "r")
			{
				var str = "rotate(" + nums + ") ";
				result += str;
			}
		}
		return result;
	};
	var preload = function(src, f)
	{
		var img = document.createElement("img");
		img.style.cssText = "position:absolute;left:-9999em;top:-9999em";
		
		img.onload = function()
		{
			f.call(this);
			this.onload = null;
			document.body.removeChild(this);
		};
		img.onerror = function()
		{
			document.body.removeChild(this);
		};
		document.body.appendChild(img);
		img.src = src;
	};
	var createUUID = function(uuidRegEx, uuidReplacer)
	{
		return function()
		{
			return "xxxxxxxx-sxxx-gxxx-xxxx-xxxxxxxxxxxx".replace(uuidRegEx, uuidReplacer).toUpperCase();
		};
	}(/[xy]/g, function(c)
	{
		var r = Math.random() * 16 | 0, v = c == "x" ? r : r & 3 | 8;
		return v.toString(16);
	});
	ISURL = /^url\(['"]?([^\)]+?)['"]?\)$/i;
	
	sg.gfxSurface = function(svgElem)
	{
		var s_ = svgElem;
		this.shapes = [];
		this.sets = [];
		this.defs = document.createElementNS(ns, "defs");
		s_.appendChild(this.defs);
		
		this.getDefID_ = function()
		{
			this.defs.childNodes.length;
		};
		this.element = function()
		{
			return s_;
		};
		this.rect = function(x, y, width, height)
		{
			var elem = document.createElementNS(ns, "rect");
			elem.setAttribute("width", width);
			elem.setAttribute("height", height);
			elem.setAttribute("x", x);
			elem.setAttribute("y", y);
			s_.appendChild(elem);
			var elem = new sg.gfxElement(elem);
			this.shapes.push(elem);
			elem.surfacnode = this;
			return elem;
		};
		this.image = function(src, x, y, width, height)
		{
			var elem = document.createElementNS(ns, "image");
			elem.setAttribute("width", width);
			elem.setAttribute("height", height);
			elem.setAttribute("x", x);
			elem.setAttribute("y", y);
			elem.setAttributeNS(xlinks, "href", src);
			s_.appendChild(elem);
			var elem = new sg.gfxElement(elem, "image");
			this.shapes.push(elem);
			elem.surfacnode = this;
			elem.type = "image";
			return elem;
		};
		this.text = function(x, y, text)
		{
			var elem = document.createElementNS(ns, "text");
			elem.setAttribute("x", x);
			elem.setAttribute("y", y);
			elem.textContent = text;
			s_.appendChild(elem);
			var elem = new sg.gfxElement(elem);
			this.shapes.push(elem);
			elem.surfacnode = this;
			return elem;
		};
		this.circle = function(x, y, r)
		{
			var elem = document.createElementNS(ns, "circle");
			elem.setAttribute("cx", x);
			elem.setAttribute("cy", y);
			elem.setAttribute("r", r);
			s_.appendChild(elem);
			var elem = new sg.gfxElement(elem);
			this.shapes.push(elem);
			elem.surfacnode = this;
			return elem;
		};
		this.path = function(path)
		{
			var elem = document.createElementNS(ns, "path");
			elem.setAttributeNS(null, "d", path);
			s_.appendChild(elem);
			var elem = new sg.gfxElement(elem);
			this.shapes.push(elem);
			elem.surfacnode = this;
			return elem;
		};
		this.clear = function()
		{
			return ""; //none
		};
		this.group = function()
		{
			var elem = document.createElementNS(ns, "g");
			elem.style.display = "block";
			s_.appendChild(elem);
			var elem = new sg.gfxElement(elem, "group");
			this.shapes.push(elem);
			elem.surfacnode = this;
			return elem;
		};
	};
	
	sg.gfxElement = function(elem, type)
	{
		this.node = elem;
		this.type = type;
		if (this.type == "group")
			this.shapes = [];
	};
	sg.gfxElement.prototype.node = null;
	sg.gfxElement.prototype.surfacnode = null;
	sg.gfxElement.prototype.patternId = null;
	sg.gfxElement.prototype.type = null;
	sg.gfxElement.prototype.getBBox = function(raw)
	{
		if (raw)
			return this.node.getBBox();
		else
			return this.node.getBoundingClientRect();
	};
	sg.gfxElement.prototype.element = function()
	{
		return this.node;
	};
	sg.gfxElement.prototype.hide = function()
	{
		return this.node.style.visibility = "hidden";
	};
	sg.gfxElement.prototype.show = function()
	{
		return this.node.style.visibility = "visible";
	};
	sg.gfxElement.prototype.attr = function(value)
	{
		for (var item in value)
		{
			switch(item)
			{
				case "path":
					this.node.setAttribute("d", value[item]);
					break;
				case "fill":
					if (typeof value[item] == "object")
					{
						var type = value[item].type;
						if (type == "pattern")
						{
							var url = value[item].src;
							if (this.pattern)
								this.pattern.parentNode.removeChild(this.pattern);
							var pattern_ = document.createElementNS(ns, "pattern");
							this.pattern = pattern_;
							if (value[item].width == "100%" && value[item].height == "100%")
							{
								pattern_.setAttribute("patternContentUnits", "objectBoundingBox");
								pattern_.setAttribute("width", 1);
								pattern_.setAttribute("height", 1);
								pattern_.setAttribute("x", 0);
								pattern_.setAttribute("y", 0);
								this.patternId = createUUID();
								pattern_.setAttribute("id", this.patternId);
								var imgPat = document.createElementNS(ns, "image");
								pattern_.img = imgPat;
								var node = this.node;
								var patternId = this.patternId;
								var surface = this.surfacnode;
								imgPat.setAttribute("x", "0");
								imgPat.setAttribute("y", "0");
								imgPat.setAttribute("width", "1");
								imgPat.setAttribute("height", "1");
								imgPat.setAttribute("preserveAspectRatio", "none");
								pattern_.appendChild(imgPat);
								surface.defs.appendChild(pattern_);
							}
							else
							{
								pattern_.setAttribute("patternUnits", "userSpaceOnUse");
								pattern_.setAttribute("width", value[item].width);
								pattern_.setAttribute("height", value[item].height);
								pattern_.setAttribute("x", value[item].x ? value[item].x : 0);
								pattern_.setAttribute("y", value[item].y ? value[item].y : 0);
								this.patternId = createUUID();
								pattern_.setAttribute("id", this.patternId);
								var imgPat = document.createElementNS(ns, "image");
								pattern_.appendChild(imgPat);
								pattern_.img = imgPat;
								var node = this.node;
								var patternId = this.patternId;
								var surface = this.surfacnode;
								surface.defs.appendChild(pattern_);
								imgPat.setAttribute("x", "0");
								imgPat.setAttribute("y", "0");
								imgPat.setAttribute("width", value[item].width);
								imgPat.setAttribute("height", value[item].height);
							}
							imgPat.setAttributeNS(xlinks, "href", url);
							node.setAttribute("fill", "url(#" + patternId + ")");
						}
					}
					else
						this.node.setAttribute(item, value[item]);
					break;
				case "stroke-dasharray":
					var array = "";
					var lineWidth = parseInt(this.node.getAttributeNS(null, "stroke-width"));
					for (var c = 0 ; c < value[item].length ; c++)
					{
						if (value[item][c] === "_")
							array += lineWidth * 4 + ",";
						else if (value[item][c] === ".")
							array += lineWidth + ",";
						else if (value[item][c] === "~")
							array += lineWidth * 8 + ",";
						else if (value[item][c] === "-")
							array += lineWidth * 2 + ",";
						array += lineWidth + ",";
					}
					if (array[array.length - 1] == ",")
						array = array.substring(0, array.length - 1);
					this.node.setAttribute("stroke-dasharray", array);
					break;
				default:
					this.node.setAttribute(item, value[item]);
			}
		}
	};
	sg.gfxElement.prototype.setRotate = function(deg, rx, ry)
	{
		var currTransform = this.node.getAttributeNS(null, "transform");
		
		if (rx === undefined && ry === undefined)
			rot = " rotate(" + deg + ")";
		else
			rot = " rotate(" + deg + " " + rx + " " + ry + ")";
		
		var rotMatch = /rotate\(*.\)/;
		currTransform = currTransform.replace(rotMatch, rot);
		this.node.setAttributeNS(null, "transform", currTransform);
	};
	sg.gfxElement.prototype.setTranslate = function(x, y)
	{
		var currTransform = this.node.getAttributeNS(null, "transform");
		var transMatch = /translate\(*.\)/;
		var trans = "translate(" + x + " " + y + ")";
		currTransform = currTransform.replace(transMatch, trans);
		this.node.setAttributeNS(null, "transform", currTransform);
	};
	sg.gfxElement.prototype.transform = function(transStr)
	{
		this.node.setAttributeNS(null, "transform", parseTransform(transStr));
	};
	sg.gfxElement.prototype.translate = function(x, y)
	{
		var currTransform = this.node.getAttributeNS(null, "transform");
		currTransform += " translate(" + x + " " + y + ")";
		this.node.setAttributeNS(null, "transform", currTransform);
	};
	sg.gfxElement.prototype.rotate = function(deg, x, y)
	{
		var currTransform = this.node.getAttributeNS(null, "transform");
		
		if (x === undefined && y === undefined)
			currTransform += " rotate(" + deg + ")";
		else
			currTransform += " rotate(" + deg + " " + x + " " + y + ")";
		this.node.setAttributeNS(null, "transform", currTransform);
	};
	sg.gfxElement.prototype.scale = function(sx, sy)
	{
		var currTransform = this.node.getAttributeNS(null, "transform");
		
		if (sy === undefined)
			currTransform += " scale(" + sx + ")";
		else
			currTransform += " scale(" + sx + " " + sy + ")";
		this.node.setAttributeNS(null, "transform", currTransform);
	};
	sg.gfxElement.prototype.remove = function()
	{
		if (this.pattern && this.pattern.parentNode)
			this.pattern.parentNode.removeChild(this.pattern);
		if (this.node && this.node.parentNode)
			this.node.parentNode.removeChild(this.node);
	};
	sg.gfxElement.prototype.insertBefore = function(elem)
	{
		this.surfacnode.element().insertBefore(this.node, elem.node);
	};
	sg.gfxElement.prototype.rect = function(x, y, width, height)
	{
		var elem = document.createElementNS(ns, "rect");
		elem.setAttribute("width", width);
		elem.setAttribute("height", height);
		elem.setAttribute("x", x);
		elem.setAttribute("y", y);
		this.node.appendChild(elem);
		var elem = new sg.gfxElement(elem);
		this.shapes.push(elem);
		elem.surfacnode = this.surfacnode;
		return elem;
	};
	sg.gfxElement.prototype.image = function(src, x, y, width, height)
	{
		var elem = document.createElementNS(ns, "image");
		elem.setAttribute("width", width);
		elem.setAttribute("height", height);
		elem.setAttribute("x", x);
		elem.setAttribute("y", y);
		elem.setAttributeNS(xlinks, "href", src);
		this.node.appendChild(elem);
		var elem = new sg.gfxElement(elem, "image");
		this.shapes.push(elem);
		elem.surfacnode = this.surfacnode;
		return elem;
	};
	sg.gfxElement.prototype.text = function(x, y, text)
	{
		var elem = document.createElementNS(ns, "text");
		elem.setAttribute("x", x);
		elem.setAttribute("y", y);
		elem.textContent = text;
		this.node.appendChild(elem);
		var elem = new sg.gfxElement(elem);
		this.shapes.push(elem);
		elem.surfacnode = this.surfacnode;
		return elem;		
	};
	sg.gfxElement.prototype.circle = function(x, y, r)
	{
		var elem = document.createElementNS(ns, "circle");
		elem.setAttribute("cx", x);
		elem.setAttribute("cy", y);
		elem.setAttribute("r", r);
		this.node.appendChild(elem);
		var elem = new sg.gfxElement(elem);
		this.shapes.push(elem);
		elem.surfacnode = this.surfacnode;
		return elem;
	};
	sg.gfxElement.prototype.path = function(path)
	{
		var elem = document.createElementNS(ns, "path");
		elem.setAttributeNS(null, "d", path);
		this.node.appendChild(elem);
		var elem = new sg.gfxElement(elem);
		this.shapes.push(elem);
		elem.surfacnode = this.surfacnode;
		return elem;
	};
	sg.gfxElement.prototype.clear = function()
	{
		return "";//none
	};
	sg.gfxElement.prototype.group = function()
	{
		var elem = document.createElementNS(ns, "g");
		this.node.appendChild(elem);
		var elem = new sg.gfxElement(elem, "group");
		this.shapes.push(elem);
		elem.surfacnode = this.surfacnode;
		return elem;
	};
	sg.createSurface = function(elem, width, height)
	{
		if (!sg.features.svg)
			return;
		var svgElem = document.createElementNS(ns, "svg");
		var width = typeof width == "number" ? width : "100%";
		var height = typeof height == "number" ? height : "100%";
		svgElem.setAttribute("width", width);
		svgElem.setAttribute("height", height);
		svgElem.setAttribute("overflow", "hidden");
		svgElem.style.position = "absolute";
		elem.appendChild(svgElem);
		return new sg.gfxSurface(svgElem);
	};
})();