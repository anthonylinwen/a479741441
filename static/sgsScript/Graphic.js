sg.Graphic = sg.Graphic || function()
{
	var patterng = /\${[\w:]*}/g;
	var pattern = /\${(\w*)}/;
	var handlerPattern = /\${((\w*):(\w*))}/;
	var mobile = CheckDevice();
	var defaultTemplateHandler = function(graphic)
	{
		var content = "";
		var idx = 0;
		for (var key in graphic.attributes)
		{
			if (idx % 2 == 0)
				content += "<div class='even-attribute'><span class='attribute-name'>" + key + " : </span><div class='attribute-value'>" + graphic.attributes[key] + "</div></div>";
			else
				content += "<div class='odd-attribute'><span class='attribute-name'>" + key + " : </span><div class='attribute-value'>" + graphic.attributes[key] + "</div></div>";
			
			idx++;
		}
		return content;
	};
	var templateReplace = function(g, tmpl)
	{
		var idx = 0;
		while (idx < tmpl.length)
		{
			var c = tmpl[idx];
			if (c == "$")
			{
				var idx2 = idx;
				while (idx2 < tmpl.length)
				{
					if (tmpl[idx2] == "}")
					{
						var attr = tmpl.substring(idx + 2, idx2);
						var sub = attr.split(":");
						var value = "";
						
						if (sub.length <= 1)
							value = g.attributes[sub[0]] ? g.attributes[sub[0]] : "";
						else if (window[sub[1]])
							value = window[sub[1]].call(g, g.attributes[sub[0]], sub[0], g.attributes);
						
						var repStr = tmpl.substring(idx, idx2 + 1);
						tmpl = tmpl.replace(repStr, value);
						idx = idx2;
						break;
					}
					idx2++;
				}
			}
			idx++;
		}
		return tmpl;
	};
	var templateReplace_bak = function(g, template)
	{
		var matches = template.match(patterng);
		if (matches)
		{
			for (var i = 0 ; i < matches.length ; i++)
			{
				var sub = matches[i].replace("{", "").replace("$", "").replace("}", "").split(":");
				var value = "";
				
				if (sub.length <= 1)
					value = g.attributes[sub[0]] ? g.attributes[sub[0]] : "";
				else if (window[sub[1]])
					value = window[sub[1]].call(this, g.attributes[sub[0]], sub[0], g.attributes);
				
				template = template.replace(matches[i], value);
			}
		}
		return template;
	};
	var triggerMouseDown = function(e)
	{
		e.preventDefault();
		e.graphic = this.g_;
		e.graphic.trigger("mouse-down", e);
		if (this.g_.layer && this.g_.layer.mouseEventEnabled)
			this.g_.layer.trigger("mouse-down", e);
	};
	var triggerMouseMove = function(e)
	{
		e.preventDefault();
		e.graphic = this.g_;
		e.graphic.trigger("mouse-move", e);
		if (this.g_.layer && this.g_.layer.mouseEventEnabled)
			this.g_.layer.trigger("mouse-move", e);
	};
	var triggerMouseOver = function(e)
	{
		e.preventDefault();
		e.graphic = this.g_;
		e.graphic.trigger("mouse-over", e);
		if (this.g_.layer && this.g_.layer.mouseEventEnabled)
			this.g_.layer.trigger("mouse-over", e);
	};
	var triggerMouseOut = function(e)
	{
		e.preventDefault();
		e.graphic = this.g_;
		e.graphic.trigger("mouse-out", e);
		if (this.g_.layer && this.g_.layer.mouseEventEnabled)
			this.g_.layer.trigger("mouse-out", e);
	};
	var triggerMouseUp = function(e)
	{
		e.preventDefault();
		e.graphic = this.g_;
		e.graphic.trigger("mouse-up", e);
		if (this.g_.layer && this.g_.layer.mouseEventEnabled)
			this.g_.layer.trigger("mouse-up", e);
	};
	var triggerDblClick = function(e)
	{
		e.preventDefault();
		e.graphic = this.g_;
		e.graphic.trigger("dbl-click", e);
		if (this.g_.layer && this.g_.layer.mouseEventEnabled)
			this.g_.layer.trigger("dbl-click", e);
	};
	var triggerTouchStart = function(e)
	{
		e.preventDefault();
		e.graphic = this.g_;
		e.graphic.trigger("touch-start", e);
		if (this.g_.layer && this.g_.layer.mouseEventEnabled)
			this.g_.layer.trigger("touch-start", e);
	};
	var triggerTouchEnd = function(e)
	{
		e.preventDefault();
		e.graphic = this.g_;
		e.graphic.trigger("touch-end", e);
		if (this.g_.layer && this.g_.layer.mouseEventEnabled)
			this.g_.layer.trigger("touch-end", e);
	};
	var triggerTouchMove = function(e)
	{
		e.preventDefault();
		e.graphic = this.g_;
		e.graphic.trigger("touch-move", e);
		if (this.g_.layer && this.g_.layer.mouseEventEnabled)
			this.g_.layer.trigger("touch-move", e);
	};
	var dragStart;
	if (!mobile)
	{
		dragStart = function(e)
		{
			var g = this.g_;
			var layer = this.g_.layer;
			var enableMouse = this.g_.layer.mouseEventEnabled;
			e.graphic = this.g_;
			var moved = false;
			var scrX = e.screenX;
			var scrY = e.screenY;
			e.graphic.trigger("drag-start", e);
			
			if (enableMouse)
				layer.trigger("drag-start", e);
			
			var drag = function(e)
			{
				e.preventDefault();
				if (!moved && e.screenX === scrX && e.screenY === scrY)
				{
					moved = true;
					return;
				}
				e.graphic = g;
				e.graphic.trigger("drag", e);
				
				if (enableMouse)
					layer.trigger("drag", e);
			};
			
			var dragEnd = function(e)
			{
				e.preventDefault();
				e.graphic = g;
				DetachEvent(document.documentElement, "mousemove", drag);
				DetachEvent(document.documentElement, "mouseup", dragEnd);
				
				if (e.screenX === scrX && e.screenY === scrY)
				{
					e.graphic.trigger("click", e);
					if (enableMouse)
						layer.trigger("click", e);
					
					if (g.layer.map_)
					{
						var tem = g.infoTemplate || g.layer.infoTemplate;
						if (!tem)
							return;
						
						var iw = g.layer.map_.infoWindow;
						var cpt = g.layer.map_.getCursorPosition(e);
						var pt = g.layer.map_.ToMapPoint(cpt.X, cpt.Y);
						pt = new sg.geometry.Point(pt.X, pt.Y);
						var content = "";
						var title = "";
						
						if (typeof tem.content == "function")
							content = tem.content.call(this, g);
						else
						{
							var wildcardIdx = tem.content.indexOf("${*}");
							if (wildcardIdx >= 0)
								var content = defaultTemplateHandler(g)
							else
								content = templateReplace(g, tem.content);
						}
						title = templateReplace(g, tem.title);
						iw.setContent(content);
						iw.setTitle(title);
						iw.show(pt);
					}
				}
				else
				{
					e.graphic.trigger("drag-end", e);
					if (enableMouse)
						layer.trigger("drag-end", e);
				}
			};
			AttachEvent(document.documentElement, "mousemove", drag);
			AttachEvent(document.documentElement, "mouseup", dragEnd);
		};
	}
	else
	{
		dragStart = function(e)
		{
			var g = this.g_;
			var layer = this.g_.layer;
			var enableMouse = this.g_.layer.mouseEventEnabled;
			e.graphic = this.g_;
			var moved = false;
			var scrX = e.touches[0].screenX;
			var scrY = e.touches[0].screenY;
			e.graphic.trigger("touchstart", e);
			e.graphic.trigger("drag-start", e);
			if (enableMouse)
			{
				layer.trigger("touchstart", e);
				layer.trigger("drag-start", e);
			}
			var drag = function(e)
			{
				e.preventDefault();
				if (!moved && e.changedTouches[0].screenX === scrX && e.changedTouches[0].screenY === scrY)
				{
					moved = true;
					return;
				}
				e.graphic = g;
				e.graphic.trigger("drag", e);
				if (enableMouse)
					layer.trigger("drag", e);
			};
			var dragEnd = function(e)
			{
				e.preventDefault();
				e.graphic = g;
				DetachEvent(e.target, "touchmove", drag);
				DetachEvent(e.target, "touchend", dragEnd);
				if (scrX === e.changedTouches[0].screenX && scrY === e.changedTouches[0].screenY)
				{
					e.graphic.trigger("click", e);
					if (enableMouse)
						layer.trigger("click", e);
					if (g.layer.map_)
					{
						var tem = g.infoTemplate || g.layer.infoTemplate;
						if (!tem)
							return;
						var iw = g.layer.map_.infoWindow;
						var cpt = g.layer.map_.getCursorPosition(e);
						var pt = g.layer.map_.ToMapPoint(cpt.X, cpt.Y);
						pt = new sg.geometry.Point(pt.X, pt.Y);
						var content = "";
						var title = "";
						if (typeof tem.content == "function")
							content = tem.content.call(this, g);
						else
						{
							var wildcardIdx = tem.content.indexOf("${*}");
							if (wildcardIdx >= 0)
								var content = defaultTemplateHandler(g);
							else
								content = templateReplace(g, tem.content);
						}
						title = templateReplace(g, tem.title);
						iw.setContent(content);
						iw.setTitle(title);
						iw.show(pt);
					}
				}
				else
				{
					e.graphic.trigger("drag-end", e);
					if (enableMouse)
						layer.trigger("drag-end", e);
				}
			};
			AttachEvent(e.target, "touchmove", drag);
			AttachEvent(e.target, "touchend", dragEnd);
		};
	}
	var bindEvent = function(graphic)
	{
		if (!mobile)
		{
			for (var s = 0 ; s < graphic.shapes.length ; s++)
			{
				graphic.shapes[s].element().g_ = graphic;
				AttachEvent(graphic.shapes[s].element(), "mousedown", triggerMouseDown);
				AttachEvent(graphic.shapes[s].element(), "mousedown", dragStart);
				AttachEvent(graphic.shapes[s].element(), "mouseover", triggerMouseOver);
				AttachEvent(graphic.shapes[s].element(), "mouseout", triggerMouseOut);
				AttachEvent(graphic.shapes[s].element(), "mouseup", triggerMouseUp);
				AttachEvent(graphic.shapes[s].element(), "mousemove", triggerMouseMove);
				AttachEvent(graphic.shapes[s].element(), "dblclick", triggerDblClick);
			}
		}
		else
		{
			for (var s = 0 ; s < graphic.shapes.length ; s++)
			{
				graphic.shapes[s].element().g_ = graphic;
				AttachEvent(graphic.shapes[s].element(), "touchstart", dragStart);
			}
		}
	};
	var defaultLine = (new sg.symbols.SimpleLineSymbol).setColor(new sg.Color(50, 50, 100, .8)).setWidth(2).setStyle(sg.symbols.SimpleLineSymbol.STYLE_SOLID);
	var defaultFillOutline = (new sg.symbols.SimpleLineSymbol).setColor(new sg.Color(10, 10, 10)).setWidth(2).setStyle(sg.symbols.SimpleLineSymbol.STYLE_SOLID);
	var defaultFill = (new sg.symbols.SimpleFillSymbol).setColor(new sg.Color(128, 255, 128, .8)).setOutline(defaultFillOutline);
	var defaultMarkOutline = defaultFillOutline;
	var defaultMark = (new sg.symbols.SimpleMarkerSymbol).setStyle(sg.symbols.SimpleMarkerSymbol.STYLE_CIRCLE).setSize(8).setColor(new sg.Color(128, 255, 128, .8)).setOutline(defaultMarkOutline);
	var defaultFont = new sg.symbols.Font;
	var defaultSymbol = {fill:defaultFill, line:defaultLine, marker:defaultMark};

	var setOutline = function(shape, lineSym)
	{
		if (lineSym && lineSym.style != sg.symbols.SimpleLineSymbol.STYLE_NULL)
		{
			shape.attr({"stroke":rgbToHex(lineSym.color.r, lineSym.color.g, lineSym.color.b)});
			shape.attr({"stroke-width":lineSym.width});
			
			switch(lineSym.style)
			{
				case sg.symbols.SimpleLineSymbol.STYLE_DASH:
					shape.attr({"stroke-dasharray":"_"});
					break;
				case sg.symbols.SimpleLineSymbol.STYLE_DASHDOT:
					shape.attr({"stroke-dasharray":"_."});
					break;
				case sg.symbols.SimpleLineSymbol.STYLE_DASHDOTDOT:
					shape.attr({"stroke-dasharray":"_.."});
					break;
				case sg.symbols.SimpleLineSymbol.STYLE_DOT:
					shape.attr({"stroke-dasharray":"."});
					break;
				case sg.symbols.SimpleLineSymbol.STYLE_LONGDASH:
					shape.attr({"stroke-dasharray":"~"});
					break;
				case sg.symbols.SimpleLineSymbol.STYLE_LONGDASHDOT:
					shape.attr({"stroke-dasharray":"~."});
					break;
				case sg.symbols.SimpleLineSymbol.STYLE_SHORTDASH:
					shape.attr({"stroke-dasharray":"-"});
					break;
				case sg.symbols.SimpleLineSymbol.STYLE_SHORTDASHDOT:
					shape.attr({"stroke-dasharray":"-."});
					break;
				case sg.symbols.SimpleLineSymbol.STYLE_SHORTDASHDOTDOT:
					shape.attr({"stroke-dasharray":"-.."});
					break;
				case sg.symbols.SimpleLineSymbol.STYLE_SHORTDOT:
					shape.attr({"stroke-dasharray":"."});
					break;
				case sg.symbols.SimpleLineSymbol.STYLE_SOLID:
					break;
				default:
					break;
			}
		}
	};
	var gf = sg.Class.extend(
	{
		initialize: function(geometry, symbol, attributes, infoTemplate)
		{
			this.shapes = [];
			this.attributes = {};
			this.infoTemplate = null;
			
			if (geometry instanceof sg.geometry.Geometry) 
				this.geometry = geometry;
			if (symbol instanceof sg.symbols.Symbol)
				this.symbol = symbol;
			if (typeof attributes == "object")
				this.attributes = attributes;
		},
		layer: null,
		shapes: null,
		attributes: null,
		geometry: null,
		symbol: null,
		getInfoTemplate: function()
		{
			return this.infoTemplate;
		},
		setInfoTemplate: function(p)
		{
			this.infoTemplate = p;
			return this;
		},
		setSymbol: function(symbol)
		{
			this.symbol = symbol;
			this.draw();
			return this;
		},
		isPathGeometry: function(geometry)
		{
			return geometry instanceof sg.geometry.Polygon || geometry instanceof sg.geometry.LineString || geometry instanceof sg.geometry.MultiPolygon || geometry instanceof sg.geometry.MultiLineString;
		},
		setGeometry: function(geometry)
		{
			var updatePath = false;
			if (this.isPathGeometry(geometry) && this.isPathGeometry(this.geometry) && this.shapes && this.shapes.length)
				updatePath = true;
			
			this.geometry = geometry;
			if (updatePath && this.symbol && this.symbol.getPath)
				this.shapes[0].attr({path:this.symbol.getPath(this.layer, geometry)});
			else
				this.draw();
			return this;
		},
		draw: function()
		{
			if (!this.geometry || !this.layer || !this.layer.getMap() || !this.layer.surface_)
				return;
			
			for (var i = 0 ; i < this.shapes.length ; i++)
				this.shapes[i].remove();
			
			this.shapes = [];
			var sym = this.symbol;
			
			if (!sym && this.layer.renderer)
				sym = this.layer.renderer.getSymbol(this);
			if (!sym)
				return this;
			this.symbol_ = sym;
			this._angle = this.symbol_.angle;
			this.shapes = [];
			var map = this.layer.getMap();
			var surface_ = this.layer.surface_;
			var shape = sym.draw(this.layer, this.geometry);
			this.shapes.push(shape);
			bindEvent(this);
			return this;
		},
		getLayer: function()
		{
			return this.layer;
		},
		hide: function()
		{
			if (this.shapes && this.shapes.length > 0)
			{
				for (var s = 0 ; s < this.shapes.length ; s++)
					this.shapes[s].hide();
			}
		},
		show: function()
		{
			if (this.shapes && this.shapes.length > 0)
			{
				for (var s = 0 ; s < this.shapes.length ; s++)
					this.shapes[s].show();
			}
		},
		events:["click", "mouse-down", "mouse-move", "mouse-out", "mouse-move", "mouse-over", "dbl-click", "touch-start", "touch-move", "touch-end", "drag-start", "drag", "drag-end"],
		statics:{defaultSymbol:defaultSymbol}
	});
	return gf;
}();