(function()
{
	var mobile = CheckDevice();
	var sqrt3 = Math.sqrt(3);
	sg.Draw = sg.Class.extend(
	{
		initialize: function(map, options)
		{
			this.map = map;
			this.hpack_ = this.map.getHPackage();
			this.container_ = this.map.getContainer();
			var that = this;
			this.tooltip = document.createElement("div");
			this.tooltip.style.display = "none";
			this.tooltip.setAttribute("class", "tooltip");
			this.container_.appendChild(this.tooltip);
            this.lastClick = null;
			
			this.updateTooltip = function(e)
			{
				if (!that.tooltip)
					return;
				
				that.tooltip.style.left = e.clientX + that.tooltipOffset.x + "px";
				that.tooltip.style.top = e.clientY + that.tooltipOffset.y + "px";
			};
			this.hideTooltip = function(e)
			{
				if (!that.tooltip)
					return;
				that.tooltip.style.visibility = "hidden";
			};
			this.showTooltip = function(e)
			{
				if (!that.tooltip)
					return;
				that.tooltip.style.visibility = "visible";
			};
			AttachEvent(this.container_, "mousemove", this.updateTooltip);
			AttachEvent(this.container_, "mouseout", this.hideTooltip);
			AttachEvent(this.container_, "mouseover", this.showTooltip);
			this.fillSymbol = new sg.symbols.SimpleFillSymbol;
			this.fillSymbol.setColor(new sg.Color(128, 128, 255, .8));
			this.fillSymbol.outline.setWidth(2);
			this.markerSymbol = (new sg.symbols.SimpleMarkerSymbol).setSize(16).setOutline(new sg.symbols.SimpleLineSymbol).setColor(new sg.Color(255, 0, 0, .5));
			this.lineSymbol = new sg.symbols.SimpleLineSymbol;
			this.lineSymbol.setWidth(3).setColor(new sg.Color(255, 0, 0, .8));
			
			this.onDragStart = function(e)
			{
				//e.stopPropagation();
				that.tPts = [];
				that.tPts.push(e.point);
				that.tg_ = new sg.Graphic;
				var geom = that.createGeometry.call(that);
				if (geom instanceof sg.geometry.Polygon || geom instanceof sg.geometry.Extent)
					that.tg_.symbol = that.fillSymbol;
				else if (geom instanceof sg.geometry.LineString)
					that.tg_.symbol = that.lineSymbol;
				else if (geom instanceof sg.geometry.Point)
					that.tg_.symbol = that.markerSymbol;
				
				that.tg_.setGeometry(geom);
				that.map.drawingGraphicsLayer.add(that.tg_);
			};
			this.onDrag = function(e)
			{
                e.preventDefault();
				//e.stopPropagation();
				that.tPts.push(e.point);
				var geom = that.createGeometry.call(that);
				that.tg_.setGeometry(geom);
			};
			this.onDragEnd = function(e)
			{
				//e.stopPropagation();
				that.tPts.push(e.point);
				that.map.drawingGraphicsLayer.remove(that.tg_);
				that.trigger("draw-end", {geometry:that.createGeometry.call(that)});
				that.tPts = [];
			};
			this.onMove_ = function (e)
			{
                e.preventDefault();
				that.drag = true;
			};
			this.onClick_ = function (e)
			{
                if (that.lastClick && that.lastClick.x == e.point.x && that.lastClick.y == e.point.y)
                {
                    return;
                }
				if (that.drag)
				{
					that.drag = false;
					return;
				}
				that.tPts.push(e.point);
				var tmp = new sg.Graphic;
				tmp.geometry = new sg.geometry.Point;
				tmp.geometry.x = e.point.x;
				tmp.geometry.y = e.point.y;
				tmp.symbol = that.markerSymbol;
				that.map.drawingGraphicsLayer.add(tmp);
				var geom = that.createGeometry();
				if (that.clickCount_ <= 0)
				{
					that.tg_ = new sg.Graphic;
					
					if (geom instanceof sg.geometry.Polygon)
						that.tg_.symbol = that.fillSymbol;
					else if (geom instanceof sg.geometry.LineString)
						that.tg_.symbol = that.lineSymbol;
					else if (geom instanceof sg.geometry.Point || geom instanceof sg.geometry.MultiPoint)
						that.tg_.symbol = that.markerSymbol;
					
					that.map.drawingGraphicsLayer.add(that.tg_);
				}
				that.tg_.setGeometry(geom);
				that.clickCount_++;
                that.lastClick = e.point;
			};
			this.onClickOnce_ = function(e)
			{
				var pt = e.point;
				that.trigger("draw-end", {geometry: pt});
			};
			this.onDbClick_ = function(e)
			{
                if (that.clickCount_ == 0 || that.tPts.length == 0)
                    return;
                
				that.map.drawingGraphicsLayer.remove(that.tg_);
				var geom = that.createGeometry();
				if (geom)
					that.trigger("draw-end", {geometry: geom});
                
				that.tPts = [];
				that.clickCount_ = 0;
			};
			//MobileEvent
			var starttime;
			this.onTouch_ = function(e)
			{
				var d = new Date();
				starttime = d.getTime();
			};
			this.onTouchend_ = function(e)
			{
				var d = new Date();
				
				if (starttime)
				{
					var touchTime = d.getTime() - starttime;
					if (touchTime >= 1000)
					{
						that.onLongTap_(e);
						return;
					}
				}
				else
					return;
			};
			this.onTouchOnce_ = function(e)
			{
				var pt = e.point;
				that.trigger("draw-end", {geometry: pt});
			};
			this.onLongTap_ = function(e)
			{
				e.stopPropagation();
                
				that.map.drawingGraphicsLayer.clear();
				var geom = that.createGeometry();
				if (geom)
					that.trigger("draw-end", {geometry:geom});
				
				that.tPts = [];
				that.clickCount_ = 0;
			};
		},
		createGeometry:function()
		{
			switch(this.currentType)
			{
				case sg.Draw.CIRCLE:
					var sp = this.tPts[0];
					var ep = this.tPts[this.tPts.length - 1];
					var r = Math.sqrt(Math.pow(ep.x - sp.x, 2) + Math.pow(ep.y - sp.y, 2));
					var circle = new sg.geometry.Circle(new sg.geometry.Point(sp.x, sp.y), {numberOfPoints:60, radius:r});
					return circle;
					break;
				case sg.Draw.DOWN_ARROW:
					var sp = this.tPts[0];
					var ep = this.tPts[this.tPts.length - 1];
					var maxx = Math.max(sp.x, ep.x);
					var minx = Math.min(sp.x, ep.x);
					var maxy = Math.max(sp.y, ep.y);
					var miny = Math.min(sp.y, ep.y);
					var width = Math.abs(maxx - minx);
					var height = Math.abs(maxy - miny);
					var hw = width / 2;
					var hh = height / 2;
					var tw = width / 3;
					var th = height / 3;
					var p1 = new sg.geometry.Point(minx + tw, maxy);
					var p2 = new sg.geometry.Point(maxx - tw, maxy);
					var p3 = new sg.geometry.Point(maxx - tw, maxy - hh);
					var p4 = new sg.geometry.Point(maxx, maxy - hh);
					var p5 = new sg.geometry.Point(minx + hw, miny);
					var p6 = new sg.geometry.Point(minx, miny + hh);
					var p7 = new sg.geometry.Point(minx + tw, miny + hh);
					var p8 = new sg.geometry.Point(minx + tw, maxy);
					var polygon = new sg.geometry.Polygon;
					var ring = new sg.geometry.LinearRing;
					ring.path = [p1, p2, p3, p4, p5, p6, p7, p8];
					polygon.addRing(ring);
					polygon.update();
					return polygon;
					break;
				case sg.Draw.ELLIPSE:
					var nop = 60;
					var sp = this.tPts[0];
					var ep = this.tPts[this.tPts.length - 1];
					var a = Math.abs(ep.x - sp.x);
					var b = Math.abs(ep.y - sp.y);
					var polygon = new sg.geometry.Polygon;
					var ring = new sg.geometry.LinearRing;
					var da = 360 / nop;
					var c = nop + 2;
					while (--c)
					{
						var rad = da * c / 180 * Math.PI;
						var x = sp.x + a * Math.cos(rad);
						var y = sp.y + b * Math.sin(rad);
						ring.path.push(new sg.geometry.Point(x, y));
					}
					polygon.addRing(ring);
					polygon.update();
					return polygon;
					break;
				case sg.Draw.EXTENT:
					var sp = this.tPts[0];
					var ep = this.tPts[this.tPts.length - 1];
					var xmin = Math.min(sp.x, ep.x);
					var ymin = Math.min(sp.y, ep.y);
					var xmax = Math.max(sp.x, ep.x);
					var ymax = Math.max(sp.y, ep.y);
					var extent = new sg.geometry.Extent(xmin, ymin, xmax, ymax);
					return extent;
					break;
				case sg.Draw.FREEHAND_POLYGON:
					var polygon = new sg.geometry.Polygon;
					var ring = new sg.geometry.LinearRing;
					for (var i = 0 ; i < this.tPts.length ; i++)
						ring.path.push(new sg.geometry.Point(this.tPts[i].x, this.tPts[i].y));
					ring.path.push(new sg.geometry.Point(this.tPts[0].x, this.tPts[0].y));
					polygon.addRing(ring);
					polygon.update();
					return polygon;
					break;
				case sg.Draw.FREEHAND_LINESTRING:
					var polyline = new sg.geometry.LineString;
					var path = [];
					for (var i = 0 ; i < this.tPts.length ; i++)
						path.push(new sg.geometry.Point(this.tPts[i].x, this.tPts[i].y));
					polyline.path = path;
					polyline.update();
					return polyline;
					break;
				case sg.Draw.LEFT_ARROW:
					var sp = this.tPts[0];
					var ep = this.tPts[this.tPts.length - 1];
					var maxx = Math.max(sp.x, ep.x);
					var minx = Math.min(sp.x, ep.x);
					var maxy = Math.max(sp.y, ep.y);
					var miny = Math.min(sp.y, ep.y);
					var width = Math.abs(maxx - minx);
					var height = Math.abs(maxy - miny);
					var hw = width / 2;
					var hh = height / 2;
					var tw = width / 3;
					var th = height / 3;
					var p1 = new sg.geometry.Point(minx, maxy - hh);
					var p2 = new sg.geometry.Point(minx + hw, maxy);
					var p3 = new sg.geometry.Point(minx + hw, maxy - th);
					var p4 = new sg.geometry.Point(maxx, maxy - th);
					var p5 = new sg.geometry.Point(maxx, miny + th);
					var p6 = new sg.geometry.Point(minx + hw, miny + th);
					var p7 = new sg.geometry.Point(minx + hw, miny);
					var p8 = new sg.geometry.Point(minx, maxy - hh);
					var polygon = new sg.geometry.Polygon;
					var ring = new sg.geometry.LinearRing;
					ring.path = [p1, p2, p3, p4, p5, p6, p7, p8];
					polygon.addRing(ring);
					polygon.update();
					return polygon;
					break;
				case sg.Draw.LINE:
					var sp = this.tPts[0];
					var ep = this.tPts[this.tPts.length - 1];
					var polyline = new sg.geometry.LineString;
					polyline.path = [new sg.geometry.Point(sp.x, sp.y), new sg.geometry.Point(ep.x, ep.y)];
					polyline.update();
					return polyline;
					break;
				case sg.Draw.MULTI_POINT:
					var multiPoint = new sg.geometry.MultiPoint;
					for (var i = 0 ; i < this.tPts.length ; i++)
					{
						var pt = new sg.geometry.Point(this.tPts[i].x, this.tPts[i].y);
						multiPoint.parts.push(pt);
					}
					multiPoint.update();
					return multiPoint;
					break;
				case sg.Draw.POINT:
					break;
				case sg.Draw.POLYGON:
					var polygon = new sg.geometry.Polygon;
					var ring = new sg.geometry.LinearRing;
					for (var i = 0 ; i < this.tPts.length ; i++)
						ring.path.push(new sg.geometry.Point(this.tPts[i].x, this.tPts[i].y));
					ring.path.push(new sg.geometry.Point(this.tPts[0].x, this.tPts[0].y));
					polygon.addRing(ring);
					polygon.update();
					return polygon;
					break;
				case sg.Draw.LINESTRING:
					var polyline = new sg.geometry.LineString;
					var path = [];
					for (var i = 0 ; i < this.tPts.length ; i++)
						path.push(new sg.geometry.Point(this.tPts[i].x, this.tPts[i].y));
					polyline.path = path;
					polyline.update();
					return polyline;
					break;
				case sg.Draw.RECTANGLE:
					var sp = this.tPts[0];
					var ep = this.tPts[this.tPts.length - 1];
					var d1 = new sg.geometry.Point(sp.x, ep.y);
					var d2 = new sg.geometry.Point(ep.x, sp.y);
					var polygon = new sg.geometry.Polygon;
					var ring = new sg.geometry.LinearRing;
					ring.path = [new sg.geometry.Point(sp.x, sp.y), d1, new sg.geometry.Point(ep.x, ep.y), d2, new sg.geometry.Point(sp.x, sp.y)];
					polygon.addRing(ring);
					polygon.update();
					return polygon;
					break;
				case sg.Draw.RIGHT_ARROW:
					var sp = this.tPts[0];
					var ep = this.tPts[this.tPts.length - 1];
					var maxx = Math.max(sp.x, ep.x);
					var minx = Math.min(sp.x, ep.x);
					var maxy = Math.max(sp.y, ep.y);
					var miny = Math.min(sp.y, ep.y);
					var width = Math.abs(maxx - minx);
					var height = Math.abs(maxy - miny);
					var hw = width / 2;
					var hh = height / 2;
					var tw = width / 3;
					var th = height / 3;
					var p1 = new sg.geometry.Point(minx, maxy - th);
					var p2 = new sg.geometry.Point(minx + hw, maxy - th);
					var p3 = new sg.geometry.Point(minx + hw, maxy);
					var p4 = new sg.geometry.Point(maxx, maxy - hh);
					var p5 = new sg.geometry.Point(minx + hw, miny);
					var p6 = new sg.geometry.Point(minx + hw, miny + th);
					var p7 = new sg.geometry.Point(minx, miny + th);
					var p8 = new sg.geometry.Point(minx, maxy - th);
					var polygon = new sg.geometry.Polygon;
					var ring = new sg.geometry.LinearRing;
					ring.path = [p1, p2, p3, p4, p5, p6, p7, p8];
					polygon.addRing(ring);
					polygon.update();
					return polygon;
					break;
				case sg.Draw.TRIANGLE:
					var sp = this.tPts[0];
					var ep = this.tPts[this.tPts.length - 1];
					var r = Math.sqrt(Math.pow(ep.x - sp.x, 2) + Math.pow(ep.y - sp.y, 2));
					var polygon = new sg.geometry.Polygon;
					var ring = new sg.geometry.LinearRing;
					var p1 = new sg.geometry.Point(sp.x, sp.y + r);
					var p2 = new sg.geometry.Point(sp.x - r * (sqrt3 / 2), sp.y - r / 2);
					var p3 = new sg.geometry.Point(sp.x + r * (sqrt3 / 2), sp.y - r / 2);
					var p4 = new sg.geometry.Point(sp.x, sp.y + r);
					ring.path = [p1, p2, p3, p4];
					polygon.addRing(ring);
					polygon.update();
					return polygon;
					break;
				case sg.Draw.UP_ARROW:
					var sp = this.tPts[0];
					var ep = this.tPts[this.tPts.length - 1];
					var maxx = Math.max(sp.x, ep.x);
					var minx = Math.min(sp.x, ep.x);
					var maxy = Math.max(sp.y, ep.y);
					var miny = Math.min(sp.y, ep.y);
					var width = Math.abs(maxx - minx);
					var height = Math.abs(maxy - miny);
					var hw = width / 2;
					var hh = height / 2;
					var tw = width / 3;
					var th = height / 3;
					var p1 = new sg.geometry.Point(minx + hw, maxy);
					var p2 = new sg.geometry.Point(maxx, maxy - hh);
					var p3 = new sg.geometry.Point(maxx - tw, maxy - hh);
					var p4 = new sg.geometry.Point(maxx - tw, miny);
					var p5 = new sg.geometry.Point(minx + tw, miny);
					var p6 = new sg.geometry.Point(minx + tw, miny + hh);
					var p7 = new sg.geometry.Point(minx, miny + hh);
					var p8 = new sg.geometry.Point(minx + hw, maxy);
					var polygon = new sg.geometry.Polygon;
					var ring = new sg.geometry.LinearRing;
					ring.path = [p1, p2, p3, p4, p5, p6, p7, p8];
					polygon.addRing(ring);
					polygon.update();
					return polygon;
					break;
				case sg.Draw.ARROW:
					var sp = this.tPts[0];
					var ep = this.tPts[this.tPts.length - 1];
					var maxx = Math.max(sp.x, ep.x);
					var minx = Math.min(sp.x, ep.x);
					var maxy = Math.max(sp.y, ep.y);
					var miny = Math.min(sp.y, ep.y);
					var width = Math.abs(maxx - minx);
					var height = Math.abs(maxy - miny);
					var hw = width / 2;
					var hh = height / 2;
					var tw = width / 3;
					var th = height / 3;
					var p1 = new sg.geometry.Point(minx + hw, maxy);
					var p2 = new sg.geometry.Point(maxx, maxy - hh);
					var p3 = new sg.geometry.Point(maxx - tw, maxy - hh);
					var p4 = new sg.geometry.Point(maxx - tw, miny);
					var p5 = new sg.geometry.Point(minx + tw, miny);
					var p6 = new sg.geometry.Point(minx + tw, miny + hh);
					var p7 = new sg.geometry.Point(minx, miny + hh);
					var p8 = new sg.geometry.Point(minx + hw, maxy);
					var polygon = new sg.geometry.Polygon;
					var ring = new sg.geometry.LinearRing;
					ring.path = [p1, p2, p3, p4, p5, p6, p7, p8];
					polygon.addRing(ring);
					polygon.update();
					return polygon;
					break;
			}
		},
		tooltipOffset: {x: 10, y: -30},
		setTooltipContent: function(content)
		{
			if (!this.tooltip)
				return;
			this.tooltip.innerHTML = content;
		},
		deactivate: function()
		{
			this.tPts = [];
			this.map.drawingGraphicsLayer.remove(this.tg_);
			
			if (this.clickOnceEvt)
				this.clickOnceEvt.remove();
			if (this.onClickEvt)
				this.onClickEvt.remove();
			if (this.onDblclickEvt)
				this.onDblclickEvt.remove();
			//MobileEvent
			if (this.onTouchEvt)
				this.onTouchEvt.remove();
			if (this.onTouchEnd)
				this.onTouchEnd.remove();
			if (this.touchOnceEvt)
				this.touchOnceEvt.remove();
				
			if (this.dragStartEvt)
				this.dragStartEvt.remove();
			if (this.dragEvt)
				this.dragEvt.remove();
			if (this.dragEndEvt)
				this.dragEndEvt.remove();
			this.tooltip.style.display = "none";
		},
		activate: function(geometryType, options)
		{
			this.tPts = [];
			this.currentType = geometryType;
			this.map.drawingGraphicsLayer.remove(this.tg_);
			
			if (this.clickOnceEvt)
				this.clickOnceEvt.remove();
			if (this.onClickEvt)
				this.onClickEvt.remove();
			if (this.onTouchEvt)
				this.onTouchEvt.remove();
			if (this.onTouchEnd)
				this.onTouchEnd.remove();
			if (this.touchOnceEvt)
				this.touchOnceEvt.remove();
			if (this.dragStartEvt)
				this.dragStartEvt.remove();
			if (this.dragEvt)
				this.dragEvt.remove();
			if (this.dragEndEvt)
				this.dragEndEvt.remove();
			
			if (options && options.showToolTips)
				this.tooltip.style.display = "block";
			else
				this.tooltip.style.display = "none";
			
			if (dragAndDrop.some(function(e) {return e === geometryType;}))
			{
				this.dragStartEvt = this.map.on("drag-start", this.onDragStart);
				this.dragEvt = this.map.on("drag", this.onDrag);
				this.dragEndEvt = this.map.on("drag-end", this.onDragEnd);
				this.setTooltipContent("Press down to start and let go to finish");
			}
			else if (clickAndDblclick.some(function(e) {return e === geometryType;}))
			{
				this.clickCount_ = 0;
				//判斷裝置觸發事件
				this.onDblclickEvt = this.map.on("dblclick", this.onDbClick_);
				this.onMoveEvt = this.map.on("touchmove", this.onMove_);
                this.onClickEvt = this.map.on("touchend", this.onClick_);
				if (mobile)
				{
					this.onTouchEvt = this.map.on("touchstart", this.onTouch_);
					this.onTouchEnd = this.map.on("touchend", this.onTouchend_);
				}
				this.setTooltipContent("Click to add point and double click to finish");
			}
			else if (geometryType === sg.Draw.POINT)
			{
				//判斷裝置觸發事件
				if (!mobile)
					this.clickOnceEvt = this.map.on("click", this.onClickOnce_);
				else
					this.touchOnceEvt = this.map.on("touchend", this.onTouchOnce_);
				
				this.setTooltipContent("Click to add point");
			}
			else
				this.tooltip.style.display = "none";
		},
		finishDrawing: function()
		{
			this.trigger("draw-end", {geometry: this.currentGeom_});
		},
		setFillSymbol: function(fillSymbol)
		{
			this.fillSymbol = fillSymbol;
		},
		setLineSymbol: function(lineSymbol)
		{
			this.lineSymbol = lineSymbol;
		},
		setMarkerSymbol:function(markerSymbol)
		{
			this.markerSymbol = markerSymbol;
		},
		setRespectDrawingVertexOrder:function(set)
		{
		},
		statics:
		{
			CIRCLE:0, DOWN_ARROW:1, ELLIPSE:2, EXTENT:3, FREEHAND_POLYGON:4, FREEHAND_LINESTRING:5, LEFT_ARROW:6, LINE:7, MULTI_POINT:8, POINT:9, POLYGON:10, LINESTRING:11, RECTANGLE:12, RIGHT_ARROW:13, TRIANGLE:14, UP_ARROW:15, ARROW:16
		},
		events:["draw-complete", "draw-end"]
	});
	var dragAndDrop = [sg.Draw.CIRCLE, sg.Draw.DOWN_ARROW, sg.Draw.ELLIPSE, sg.Draw.EXTENT, sg.Draw.FREEHAND_POLYGON, sg.Draw.FREEHAND_LINESTRING, sg.Draw.LEFT_ARROW, sg.Draw.LINE, sg.Draw.RECTANGLE, sg.Draw.RIGHT_ARROW, sg.Draw.TRIANGLE, sg.Draw.UP_ARROW, sg.Draw.ARROW];
	var clickAndDblclick = [sg.Draw.MULTI_POINT, sg.Draw.POLYGON, sg.Draw.LINESTRING];
})();