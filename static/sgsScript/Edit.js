sg.Edit = function ()
{
	var M = sg.math.Matrix;
	var EditTool = sg.Class.extend(
	{
		current: null,
		map: null,
		initialize: function (map)
		{
			this.map = map;
		},
		startanimate: function ()
		{
		},
		animate: function ()
		{
			this.update();
		},
		update: function ()
		{
		},
		activate: function (graphic)
		{
			this.deactivate();
			this.current = graphic;
		},
		deactivate: function ()
		{
			this.current = null;
		}
	});
	var RotateTool = EditTool.extend(
	{
		initialize: function (map)
		{
			EditTool.prototype.initialize.apply(this, arguments);
		},
		rotateSymbol: (new sg.symbols.SimpleMarkerSymbol).setColor(new sg.Color(255, 255, 0)).setSize(12).setOutline(new sg.symbols.SimpleLineSymbol), rotateLineSymbol: (new sg.symbols.SimpleLineSymbol).setStyle(sg.symbols.SimpleLineSymbol.STYLE_DASH), getHandlePos: function ()
		{
			var offset = this.map.ToMapDistY(-24);
			var extent = this.current.geometry.extent;
			var hx = (extent.xmin + extent.xmax) / 2;
			var hy = extent.ymax + offset;
			var gpos = new sg.geometry.Point(hx, hy);
			return gpos;
		},
		getLinePos: function ()
		{
			var extent = this.current.geometry.extent;
			var hx = (extent.xmin + extent.xmax) / 2;
			var hy = extent.ymax;
			var gpos = new sg.geometry.Point(hx, hy);
			var pos2 = this.getHandlePos();
			var line = new sg.geometry.LineString;
			line.setPath([gpos, pos2]);
			return line;
		},
		createRotateLine: function ()
		{
			var line = this.getLinePos();
			var g = new sg.Graphic(line, this.rotateLineSymbol);
			this.rl_ = g;
			this.map.drawingGraphicsLayer.add(this.rl_);
		},
		createHandle: function ()
		{
			var gpos = this.getHandlePos();
			var g = new sg.Graphic(gpos, this.rotateSymbol);
			this.rh_ = g;
			this.map.drawingGraphicsLayer.add(this.rh_);
		},
		onDragStart: function (e)
		{
			e.stopPropagation();
			var g = e.graphic;
			this.active = true;
			if (g === this.rh_)
			{
				var cpos = this.map.getCursorPosition(e);
				var pos = this.map.ToMapPoint(cpos.X, cpos.Y);
				this.dp_ = new sg.geometry.Point(pos.X, pos.Y);
				this.rawGeo = this.current.geometry.clone();
				this.rawHPos = this.rh_.geometry.clone();
				this.rawLPos = this.rl_.geometry.clone();
				this.trigger("rotate-drag-start");
			}
		},
		onDrag: function (e)
		{
			e.stopPropagation();
			var g = e.graphic;
			if (g === this.rh_)
			{
				if (!this.rawGeo.getCentroid)
				{
					return;
				}
				var centroid = this.rawGeo.getCentroid();
				var cx = centroid.x;
				var cy = centroid.y;
				var cpos = this.map.getCursorPosition(e);
				var pos = this.map.ToMapPoint(cpos.X, cpos.Y);
				var dx = pos.X - cx;
				var dy = pos.Y - cy;
				var da = sg.math.radianToDegree(Math.atan2(dx, dy));
				var tm = M.translate(cx, cy).product(M.rotate(-da)).product(M.translate(-cx, -cy));
				var curr = this.rawGeo.clone();
				curr.transform(tm);
				this.current.setGeometry(curr);
				this.trigger("rotate-drag");
			}
		},
		onDragEnd: function (e)
		{
			e.stopPropagation();
			if (e.graphic === this.rh_)
			{
				var gl = this.getLinePos();
				this.rl_.setGeometry(gl);
				var gpos = this.getHandlePos();
				this.rh_.setGeometry(gpos);
				this.trigger("rotate-drag-end");
			}
		},
		update: function ()
		{
			this.rl_.setGeometry(this.getLinePos());
			this.rh_.setGeometry(this.getHandlePos());
		},
		activate: function (graphic, options)
		{
			EditTool.prototype.activate.apply(this, arguments);
			if (options)
			{
				if (options.rotateSymbol)
				{
					this.rotateSymbol = options.rotateSymbol;
				}
				if (options.rotateLineSymbol)
				{
					this.rotateLineSymbol = options.rotateLineSymbol;
				}
			}
			this.createRotateLine();
			this.createHandle();
			this.dse = this.map.drawingGraphicsLayer.on("drag-start", sg.wrap(this, this.onDragStart));
			this.de = this.map.drawingGraphicsLayer.on("drag", sg.wrap(this, this.onDrag));
			this.dee = this.map.drawingGraphicsLayer.on("drag-end", sg.wrap(this, this.onDragEnd));
		},
		deactivate: function ()
		{
			EditTool.prototype.deactivate.apply(this, arguments);
			if (this.dse)
			{
				this.dse.remove();
			}
			if (this.de)
			{
				this.de.remove();
			}
			if (this.dee)
			{
				this.dee.remove();
			}
			if (this.rh_)
			{
				this.map.drawingGraphicsLayer.remove(this.rh_);
				this.rh_ = null;
			}
			if (this.rl_)
			{
				this.map.drawingGraphicsLayer.remove(this.rl_);
				this.rl_ = null;
			}
		},
		events: ["rotate-drag-start", "rotate-drag", "rotate-drag-end"]
	});
	var MoveTool = EditTool.extend(
	{
		initialize: function (map)
		{
			EditTool.prototype.initialize.apply(this, arguments);
		},
		mb_: null,
		scaleBoxSymbol: (new sg.symbols.SimpleFillSymbol).setColor(new sg.Color(0, 0, 0, 0.1)),
		onDragStart: function (e)
		{
			e.stopPropagation();
			if (e.graphic === this.mb_ || e.graphic === this.current)
			{
				var cpos = this.map.getCursorPosition(e);
				var pos = this.map.ToMapPoint(cpos.X, cpos.Y);
				this.dp_ = new sg.geometry.Point(pos.X, pos.Y);
				this.trigger("move-drag-start");
			}
		},
		onDrag: function (e)
		{
			e.stopPropagation();
			var g = e.graphic;
			if (g === this.mb_ || e.graphic === this.current)
			{
				var cpos = this.map.getCursorPosition(e);
				var pos = this.map.ToMapPoint(cpos.X, cpos.Y);
				var dx = pos.X - this.dp_.x;
				var dy = pos.Y - this.dp_.y;
				var tm = new sg.math.Matrix.translate(dx, dy);
				this.current.geometry.transform(tm);
				this.current.draw();
				this.dp_ = new sg.geometry.Point(pos.X, pos.Y);
				this.map.infoWindow.show(this.dp_);
				this.trigger("move-drag");
			}
		},
		onDragEnd: function (e)
		{
			e.stopPropagation();
			var g = e.graphic;
			if (g === this.mb_ || e.graphic === this.current)
			{
				this.trigger("move-drag-end");
			}
		},
		update: function ()
		{
			this.createMoveBox();
		},
		createMoveBox: function ()
		{
			var isPoint = this.current.geometry instanceof sg.geometry.Point;
			if (isPoint)
				return;
			var geometry = this.current.geometry;
			var extent = geometry.extent;
			if (!extent)
			{
				return;
			}
			var p1 = new sg.geometry.Point(extent.xmin, extent.ymax);
			var p2 = new sg.geometry.Point(extent.xmax, extent.ymax);
			var p3 = new sg.geometry.Point(extent.xmax, extent.ymin);
			var p4 = new sg.geometry.Point(extent.xmin, extent.ymin);
			var p5 = new sg.geometry.Point(extent.xmin, extent.ymax);
			var lineStr = new sg.geometry.Extent(p4.x, p4.y, p2.x, p2.y);
			//lineStr.setPath([p1, p2, p3, p4, p5]);
			if (this.mb_ == null)
			{
				var g = new sg.Graphic(lineStr, this.scaleBoxSymbol, { geometry: geometry });
				this.map.drawingGraphicsLayer.add(g);
				this.mb_ = g;
			}
			else
				this.mb_.setGeometry(lineStr);
		},
		clear: function ()
		{
			if (this.mb_)
				this.map.drawingGraphicsLayer.remove(this.mb_);
			this.mb_ = null;
		},
		activate: function (graphic, opts)
		{
			EditTool.prototype.activate.apply(this, arguments);
			if (opts)
			{
				if (opts.scaleBoxSymbol)
				{
					this.scaleBoxSymbol = opts.scaleBoxSymbol;
				}
			}
			this.createMoveBox();
			this.dse = this.map.drawingGraphicsLayer.on("drag-start", sg.wrap(this, this.onDragStart));
			this.de = this.map.drawingGraphicsLayer.on("drag", sg.wrap(this, this.onDrag));
			this.dee = this.map.drawingGraphicsLayer.on("drag-end", sg.wrap(this, this.onDragEnd));
		},
		deactivate: function ()
		{
			EditTool.prototype.deactivate.apply(this, arguments);
			this.clear();
			if (this.dse)
				this.dse.remove();
			if (this.de)
				this.de.remove();
			if (this.dee)
				this.dee.remove();
		},
		events: ["move-drag-start", "move-drag", "move-drag-end"]
	});
	var ScaleTool = EditTool.extend(
	{
		initialize: function (map)
		{
			EditTool.prototype.initialize.apply(this, arguments);
			this.sh_ = [];
		},
		preserveRatio: false,
		scaleSymbol: (new sg.symbols.SimpleMarkerSymbol).setColor(new sg.Color(255, 255, 255, 1)).setStyle(sg.symbols.SimpleMarkerSymbol.STYLE_SQUARE).setOutline(new sg.symbols.SimpleLineSymbol).setSize(16),
		onDragStart: function (e)
		{
			e.stopPropagation();
			var cpos = this.map.getCursorPosition(e);
			var pos = this.map.ToMapPoint(cpos.X, cpos.Y);
			this.dp_ = pos;
			if (this.sh_.indexOf(e.graphic) >= 0)
			{
				this.activateS_ = e.graphic;
				var g = e.graphic;
				var origin = g.attributes.origin;
				var pt = g.attributes.point;
				this.trigger("scale-drag-start");
			}
		},
		onDrag: function (e)
		{
			e.stopPropagation();
			var g = e.graphic;
			if (g === this.activateS_)
			{
				var cpos = this.map.getCursorPosition(e);
				var pos = this.map.ToMapPoint(cpos.X, cpos.Y);
				var origin = g.attributes.origin;
				var pt = g.attributes.point;
				var scaleX = (pos.X - origin.x) / (pt.x - origin.x);
				var scaleY = (pos.Y - origin.y) / (pt.y - origin.y);
				if (this.preserveRatio == true)
				{
					var an = Math.min(Math.abs(scaleX), Math.abs(scaleY));
					scaleX = scaleX >= 0 ? an : -an;
					scaleY = scaleY >= 0 ? an : -an;
				}
				var m = M.translate(origin.x, origin.y).product(M.scale(scaleX, scaleY)).product(M.translate(-origin.x, -origin.y));
				var tg = g.attributes.geometry.clone();
				tg.transform(m);
				this.current.setGeometry(tg);
				this.dp_ = pos;
				this.trigger("scale-drag");
			}
		},
		onDragEnd: function (e)
		{
			e.stopPropagation();
			var g = e.graphic;
			if (g === this.activateS_)
			{
				this.trigger("scale-drag-end");
			}
		},
		update: function ()
		{
			this.clear();
			this.createScaleHandle();
		},
		createScaleHandle: function ()
		{
			var geometry = this.current.geometry;
			var extent = geometry.extent;
			if (!extent)
			{
				return;
			}
			var p1 = new sg.geometry.Point(extent.xmin, extent.ymax);
			var p2 = new sg.geometry.Point(extent.xmax, extent.ymax);
			var p3 = new sg.geometry.Point(extent.xmax, extent.ymin);
			var p4 = new sg.geometry.Point(extent.xmin, extent.ymin);
			var g1 = new sg.Graphic(new sg.geometry.Point(p1.x, p1.y), this.scaleSymbol, { type: "scale", index: 0, geometry: geometry, point: p1, origin: p3 });
			var g2 = new sg.Graphic(new sg.geometry.Point(p2.x, p2.y), this.scaleSymbol, { type: "scale", index: 1, geometry: geometry, point: p2, origin: p4 });
			var g3 = new sg.Graphic(new sg.geometry.Point(p3.x, p3.y), this.scaleSymbol, { type: "scale", index: 2, geometry: geometry, point: p3, origin: p1 });
			var g4 = new sg.Graphic(new sg.geometry.Point(p4.x, p4.y), this.scaleSymbol, { type: "scale", index: 3, geometry: geometry, point: p4, origin: p2 });
			this.map.drawingGraphicsLayer.add(g1);
			this.map.drawingGraphicsLayer.add(g2);
			this.map.drawingGraphicsLayer.add(g3);
			this.map.drawingGraphicsLayer.add(g4);
			this.sh_ = [g1, g2, g3, g4];
		},
		clear: function ()
		{
			if (this.sh_)
			{
				for (var i = 0; i < this.sh_.length; i++)
				{
					this.map.drawingGraphicsLayer.remove(this.sh_[i]);
				}
			}
		},
		activate: function (graphic, opts)
		{
			EditTool.prototype.activate.apply(this, arguments);
			if (opts)
			{
				if (opts.scaleSymbol)
				{
					this.scaleSymbol = opts.scaleSymbol;
				}
				this.preserveRatio = opts.uniformScaling;
			}
			var drawLayer = this.map.drawingGraphicsLayer;
			this.createScaleHandle();
			this.dse = drawLayer.on("drag-start", sg.wrap(this, this.onDragStart));
			this.de = drawLayer.on("drag", sg.wrap(this, this.onDrag));
			this.dee = drawLayer.on("drag-end", sg.wrap(this, this.onDragEnd));
		},
		deactivate: function ()
		{
			EditTool.prototype.deactivate.apply(this, arguments);
			this.clear();
			if (this.dse)
			{
				this.dse.remove();
			}
			if (this.de)
			{
				this.de.remove();
			}
			if (this.dee)
			{
				this.dee.remove();
			}
		},
		events: ["scale-drag-start", "scale-drag", "scale-drag-end"]
	});
	var VertexTool = EditTool.extend(
	{
		initialize: function ()
		{
			EditTool.prototype.initialize.apply(this, arguments);
			this.vs_ = [];
			this.nvs_ = [];
		},
		vertexSymbol: (new sg.symbols.SimpleMarkerSymbol).setColor(new sg.Color(250, 150, 150, 1)).setOutline(new sg.symbols.SimpleLineSymbol).setSize(12), newVertexSymbol: (new sg.symbols.SimpleMarkerSymbol).setColor(new sg.Color(200, 200, 200, 1)).setOutline(new sg.symbols.SimpleLineSymbol), ghostLine: (new sg.symbols.SimpleLineSymbol).setStyle(sg.symbols.SimpleLineSymbol.STYLE_DOT).setWidth(2).setColor(new sg.Color(200, 150, 150, .8)), createVertex: function (point)
		{
			var g = new sg.Graphic(point, this.vertexSymbol);
			return g;
		},
		createNewVertex: function (point)
		{
			var g = new sg.Graphic(point, this.newVertexSymbol);
			return g;
		},
		createNewVertices: function ()
		{
			var geometry = this.current.geometry;
			if (!geometry.forEachVertex || geometry instanceof sg.geometry.MultiPoint)
			{
				return;
			}
			var lastPoint;
			geometry.forEachVertex(function (e)
			{
				if (e.pointIndex <= 0)
				{
					lastPoint = e.point;
					return;
				}
				var cx = (e.point.x + lastPoint.x) / 2;
				var cy = (e.point.y + lastPoint.y) / 2;
				var cp = new sg.geometry.Point(cx, cy);
				var v = this.createNewVertex(cp);
				v.attributes = e;
				v.attributes.type = "addvertex";
				v.attributes.lastIndex = e.pointIndex - 1;
				v.attributes.geometry = geometry;
				this.nvs_.push(v);
				this.map.drawingGraphicsLayer.add(v);
				lastPoint = e.point;
			}, this);
		},
		onClick: function (e)
		{
			if (this.activeV_ == e.graphic)
			{
				e.stopPropagation();
				if (this.activeV_.attributes.type == "addvertex")
				{
					this.applyAddVertex();
				}
				this.map.drawingGraphicsLayer.remove(this.gl1_);
				this.map.drawingGraphicsLayer.remove(this.gl2_);
			}
		},
		createVertices: function ()
		{
			var geometry = this.current.geometry;
			if (!geometry.forEachVertex)
			{
				return;
			}
			geometry.forEachVertex(function (e)
			{
				var v = this.createVertex(new sg.geometry.Point(e.point.x, e.point.y));
				v.attributes = e;
				v.attributes.geometry = geometry;
				this.vs_.push(v);
				this.map.drawingGraphicsLayer.add(v);
			}, this);
		},
		getNewNeiborVertex: function ()
		{
			var g = this.activeV_;
			var tpos = this.current.geometry;
			var part, ring;
			if (sg.isNumber(g.attributes.partIndex))
			{
				part = tpos.parts[g.attributes.partIndex];
				tpos = part;
			}
			if (sg.isNumber(g.attributes.ringIndex))
			{
				ring = tpos.rings[g.attributes.ringIndex];
				tpos = ring;
			}
			if (sg.isNumber(g.attributes.pointIndex))
			{
				var before = g.attributes.lastIndex;
				var next = g.attributes.pointIndex;
				var curr = g.geometry.clone();
				if (before < 0)
				{
					before += tpos.path.length;
				}
				if (next >= tpos.path.length)
				{
					next -= tpos.path.length;
				}
				var p1 = tpos.path[before].clone();
				var p2 = tpos.path[next].clone();
				var line1 = new sg.geometry.LineString;
				line1.setPath([p1, curr]);
				var line2 = new sg.geometry.LineString;
				line2.setPath([p2, curr]);
				return [line1, line2];
			}
		},
		getNeiborVertex: function ()
		{
			var g = this.activeV_;
			var tpos = this.current.geometry;
			var part, ring;
			if (sg.isNumber(g.attributes.partIndex))
			{
				part = tpos.parts[g.attributes.partIndex];
				tpos = part;
			}
			if (sg.isNumber(g.attributes.ringIndex))
			{
				ring = tpos.rings[g.attributes.ringIndex];
				tpos = ring;
			}
			if (sg.isNumber(g.attributes.pointIndex))
			{
				var line1, line2;
				var before = g.attributes.pointIndex - 1;
				var next = g.attributes.pointIndex + 1;
				var curr = g.geometry.clone();
				if (ring)
				{
					if (g.attributes.pointIndex == 0 || g.attributes.pointIndex == tpos.path.length - 1)
					{
						next = 1;
						before = tpos.path.length - 2;
					} else
					{
						if (before < 0)
						{
							before += tpos.path.length;
						}
						if (next >= tpos.path.length)
						{
							next -= tpos.path.length;
						}
					}
				}
				var op1 = tpos.path[before];
				if (op1)
				{
					var p1 = op1.clone();
					line1 = new sg.geometry.LineString;
					line1.setPath([p1, curr]);
				}
				var op2 = tpos.path[next];
				if (op2)
				{
					var p2 = op2.clone();
					line2 = new sg.geometry.LineString;
					line2.setPath([p2, curr]);
				}
				return [line1, line2];
			}
		},
		clearVertices: function ()
		{
			if (this.vs_)
			{
				for (var i = 0; i < this.vs_.length; i++)
				{
					this.map.drawingGraphicsLayer.remove(this.vs_[i]);
				}
			}
			this.vs_ = [];
			if (this.nvs_)
			{
				for (var i = 0; i < this.nvs_.length; i++)
				{
					this.map.drawingGraphicsLayer.remove(this.nvs_[i]);
				}
			}
			this.nvs_ = [];
			if (this.gl1_)
			{
				this.map.drawingGraphicsLayer.remove(this.gl1_);
				this.gl1_ = null;
			}
			if (this.gl2_)
			{
				this.map.drawingGraphicsLayer.remove(this.gl2_);
				this.gl2_ = null;
			}
		},
		onDragStart: function (e)
		{
			if (this.vs_.indexOf(e.graphic) >= 0 || this.nvs_.indexOf(e.graphic) >= 0)
			{
				e.stopPropagation();
				this.activeV_ = e.graphic;
			}
			this.trigger("vertex-drag-start");
		},
		onDrag: function (e)
		{
			var g = e.graphic;
			if (this.activeV_ == g)
			{
				e.stopPropagation();
				var lines = this.activeV_.attributes.type == "addvertex" ? this.getNewNeiborVertex() : this.getNeiborVertex();
				if (lines)
				{
					if (!this.gl1_)
					{
						this.gl1_ = new sg.Graphic(lines[0], this.ghostLine);
						this.map.drawingGraphicsLayer.add(this.gl1_);
					}
					if (!this.gl2_)
					{
						this.gl2_ = new sg.Graphic(lines[1], this.ghostLine);
						this.map.drawingGraphicsLayer.add(this.gl2_);
					}
					if (lines[0] && this.gl1_)
					{
						this.gl1_.setGeometry(lines[0]);
					}
					if (lines[1] && this.gl2_)
					{
						this.gl2_.setGeometry(lines[1]);
					}
				}
				var cpos = this.map.getCursorPosition(e);
				var pos = this.map.ToMapPoint(cpos.X, cpos.Y);
				g.setGeometry(new sg.geometry.Point(pos.X, pos.Y));
				this.trigger("vertex-drag");
			}
		},
		onDragEnd: function (e)
		{
			if (this.activeV_ == e.graphic)
			{
				e.stopPropagation();
				if (this.activeV_.attributes.type == "addvertex")
				{
					this.applyAddVertex();
				} else
				{
					this.applyEdit();
				}
				if (this.gl1_)
				{
					this.map.drawingGraphicsLayer.remove(this.gl1_);
					this.gl1_ = null;
				}
				if (this.gl2_)
				{
					this.map.drawingGraphicsLayer.remove(this.gl2_);
					this.gl2_ = null;
				}
				this.trigger("vertex-drag-end");
			}
		},
		onDblClick: function (e)
		{
			if (!this.allowDeleteVertices)
			{
				return;
			}
			if (this.vs_.indexOf(e.graphic) >= 0)
			{
				e.stopPropagation();
				var g = e.graphic;
				var tpos = this.current.geometry;
				if (sg.isNumber(g.attributes.partIndex))
				{
					var part = tpos.parts[g.attributes.partIndex];
					tpos = part;
				}
				if (sg.isNumber(g.attributes.ringIndex))
				{
					var ring = tpos.rings[g.attributes.ringIndex];
					if (ring.path.length <= 4)
					{
						return;
					}
					tpos = ring;
				}
				if (sg.isNumber(g.attributes.pointIndex))
				{
					if (tpos.path.length <= 3)
					{
						return;
					}
					if (ring)
					{
						if (g.attributes.pointIndex == 0 || g.attributes.pointIndex == tpos.path.length - 1)
						{
							var first = tpos.path.pop();
							tpos.path[0].x = tpos.path[tpos.path.length - 1].x;
							tpos.path[0].y = tpos.path[tpos.path.length - 1].y;
						} else
						{
							tpos.path.splice(g.attributes.pointIndex, 1);
						}
					} else
					{
						tpos.path.splice(g.attributes.pointIndex, 1);
					}
				}
				this.clearVertices();
				this.current.geometry.update();
				this.current.draw();
				this.createNewVertices();
				this.createVertices();
				this.trigger("vertex-delete");
			}
		},
		applyAddVertex: function ()
		{
			if (!this.activeV_)
			{
				return;
			}
			var g = this.activeV_;
			var tpos = this.current.geometry;
			if (sg.isNumber(g.attributes.partIndex))
			{
				part = tpos.parts[g.attributes.partIndex];
				tpos = part;
			}
			if (sg.isNumber(g.attributes.ringIndex))
			{
				ring = tpos.rings[g.attributes.ringIndex];
				tpos = ring;
			}
			if (sg.isNumber(g.attributes.pointIndex))
			{
				tpos.path.splice(g.attributes.pointIndex, 0, g.geometry.clone());
				tpos = tpos.path[g.attributes.pointIndex];
			}
			this.clearVertices();
			this.current.geometry.update();
			this.current.draw();
			this.createNewVertices();
			this.createVertices();
		},
		applyEdit: function ()
		{
			if (!this.activeV_)
			{
				return;
			}
			var g = this.activeV_;
			var tpos = this.current.geometry;
			var part, ring, path;
			if (sg.isNumber(g.attributes.partIndex))
			{
				part = tpos.parts[g.attributes.partIndex];
				tpos = part;
			}
			if (sg.isNumber(g.attributes.ringIndex))
			{
				ring = tpos.rings[g.attributes.ringIndex];
				tpos = ring;
			}
			if (sg.isNumber(g.attributes.pointIndex))
			{
				path = tpos.path;
				tpos = path[g.attributes.pointIndex];
			}
			tpos.x = g.geometry.x;
			tpos.y = g.geometry.y;
			if (ring)
			{
				var ringIdx = g.attributes.pointIndex == 0 ? path.length - 1 : g.attributes.pointIndex == path.length - 1 ? 0 : null;
				if (ringIdx !== null)
				{
					path[ringIdx].x = tpos.x;
					path[ringIdx].y = tpos.y;
				}
			}
			if (part)
			{
				part.update();
			}
			if (ring)
			{
				ring.update();
			}
			this.current.geometry.update();
			this.current.draw();
		},
		startanimate: function ()
		{
			for (var v in this.nvs_)
				this.nvs_[v].hide();
			for (var v in this.vs_)
				this.vs_[v].hide();
		},
		update: function ()
		{
			if (this.allowAddVertices)
			{
				for (var v = 0; v < this.nvs_.length; v++)
				{
					var g = this.nvs_[v];
					g.show();
					var tpos = this.current.geometry;
					var lastPt;
					if (sg.isNumber(g.attributes.partIndex))
					{
						tpos = tpos.parts[g.attributes.partIndex];
					}
					if (sg.isNumber(g.attributes.ringIndex))
					{
						tpos = tpos.rings[g.attributes.ringIndex];
					}
					if (sg.isNumber(g.attributes.pointIndex))
					{
						lastPt = tpos.path[g.attributes.lastIndex];
						tpos = tpos.path[g.attributes.pointIndex];
					}
					cx = (tpos.x + lastPt.x) / 2;
					cy = (tpos.y + lastPt.y) / 2;
					g.geometry.x = cx;
					g.geometry.y = cy;
					g.setGeometry(g.geometry);
					//var cp = new sg.geometry.Point(cx, cy);
					//g.setGeometry(new sg.geometry.Point(cp.x, cp.y));
				}
			}
			for (var v = 0; v < this.vs_.length; v++)
			{
				var g = this.vs_[v];
				g.show();
				var tpos = this.current.geometry;
				if (sg.isNumber(g.attributes.partIndex))
				{
					tpos = tpos.parts[g.attributes.partIndex];
				}
				if (sg.isNumber(g.attributes.ringIndex))
				{
					tpos = tpos.rings[g.attributes.ringIndex];
				}
				if (sg.isNumber(g.attributes.pointIndex))
				{
					tpos = tpos.path[g.attributes.pointIndex];
				}
				g.geometry.x = tpos.x;
				g.geometry.y = tpos.y;
				g.setGeometry(g.geometry);
				//g.setGeometry(new sg.geometry.Point(tpos.x, tpos.y));
			}
		},
		clearEvent: function ()
		{
			if (this.dse)
			{
				this.dse.remove();
			}
			if (this.de)
			{
				this.de.remove();
			}
			if (this.dee)
			{
				this.dee.remove();
			}
			if (this.dblce)
			{
				this.dblce.remove();
			}
			if (this.clke)
			{
				this.clke.remove();
			}
		},
		activate: function (graphic, options)
		{
			var drawLayer = this.map.drawingGraphicsLayer;
			EditTool.prototype.activate.apply(this, arguments);
			if (options)
			{
				if (options.vertexSymbol)
				{
					this.vertexSymbol = options.vertexSymbol;
				}
				if (options.newVertexSymbol)
				{
					this.newVertexSymbol = options.newVertexSymbol;
				}
				if (options.ghostLine)
				{
					this.ghostLine = options.ghostLine;
				}
			}
			this.allowAddVertices = options && options.allowAddVertices;
			this.allowDeleteVertices = options && options.allowDeleteVertices;
			if (this.allowAddVertices)
			{
				this.createNewVertices();
			}
			this.createVertices();
			this.clke = drawLayer.on("click", sg.wrap(this, this.onClick));
			this.dse = drawLayer.on("drag-start", sg.wrap(this, this.onDragStart));
			this.de = drawLayer.on("drag", sg.wrap(this, this.onDrag));
			this.dee = drawLayer.on("drag-end", sg.wrap(this, this.onDragEnd));
			this.dblce = drawLayer.on("dbl-click", sg.wrap(this, this.onDblClick));
		},
		deactivate: function ()
		{
			EditTool.prototype.deactivate.apply(this, arguments);
			this.clearEvent();
			this.clearVertices();
		},
		events: ["vertex-drag-start", "vertex-drag", "vertex-drag-end", "vertex-delete"]
	});
	var extract = function (raw, field)
	{
		return (raw & field) != 0;
	};
	var edit = sg.Class.extend(
	{
		map: null,
		current: null,
		vertexSymbol: (new sg.symbols.SimpleMarkerSymbol).setColor(new sg.Color(255, 150, 150, 1)),
		scaleSymbol: (new sg.symbols.SimpleMarkerSymbol).setColor(new sg.Color(255, 255, 255, 1)).setStyle(sg.symbols.SimpleMarkerSymbol.STYLE_SQUARE).setOutline(new sg.symbols.SimpleLineSymbol), lineSymbol: (new sg.symbols.SimpleLineSymbol).setColor(new sg.Color(255, 0, 0, 1)), fillSymbol: (new sg.symbols.SimpleFillSymbol).setStyle(sg.symbols.SimpleFillSymbol.STYLE_NULL),
		scaleBoxSymbol: new sg.symbols.SimpleLineSymbol,
		initialize: function (map, options)
		{
			if (!map)
			{
				throw "map must be provided";
			}
			this.map = map;
			var that = this;
		},
		startanimate: function ()
		{
			for (var t in this.tools)
				this.tools[t].startanimate();
		},
		animate: function ()
		{
			for (var t in this.tools)
				this.tools[t].animate();
		},
		update: function ()
		{
			this.isModified = true;
			if (this.tools)
			{
				for (var t in this.tools)
					this.tools[t].update();
			}
		},
		getCurrentState: function ()
		{
			return { graphic: this.current, tool: this.currentTools, isModified: this.isModified };
		},
		activate: function (tool, graphic, options)
		{
			if (!this.map || !tool || !graphic || !(graphic instanceof sg.Graphic))
			{
				return;
			}
			var that = this;
			this.deactivate();
			this.current = graphic;
			this.currentTools = tool;
			this.isModified = false;
			var isPoint = this.current.geometry instanceof sg.geometry.Point;
			var useText = false;
			var useScale = extract(tool, sg.Edit.SCALE) && !isPoint;
			var useRotate = extract(tool, sg.Edit.ROTATE) && !isPoint;
			var useVertices = extract(tool, sg.Edit.VERTICES) && !isPoint;
			var useMove = extract(tool, sg.Edit.MOVE);
			if (useText)
			{
			}
			if (useMove)
			{
				var mt = new MoveTool(this.map);
				mt.on("move-drag-start", sg.wrap(this, this.startanimate));
				mt.on("move-drag", sg.wrap(this, this.animate));
				mt.on("move-drag-end", sg.wrap(this, this.update));
				mt.activate(this.current, options);
				this.tools.push(mt);
			}
			if (useVertices)
			{
				var vt = new VertexTool(this.map);
				vt.on("vertex-drag-end", sg.wrap(this, this.update));
				vt.on("vertex-delete", sg.wrap(this, this.update));
				vt.activate(this.current, options);
				this.tools.push(vt);
			}
			if (useScale)
			{
				var st = new ScaleTool(this.map);
				st.on("scale-drag-start", sg.wrap(this, this.startanimate));
				st.on("scale-drag", sg.wrap(this, this.animate));
				st.on("scale-drag-end", sg.wrap(this, this.update));
				st.activate(this.current, options);
				this.tools.push(st);
			}
			if (useRotate)
			{
				var rt = new RotateTool(this.map);
				rt.on("rotate-drag-start", sg.wrap(this, this.startanimate));
				rt.on("rotate-drag-end", sg.wrap(this, this.update));
				rt.activate(this.current, options);
				this.tools.push(rt);
			}
			this.trigger("activate", { graphic: that.current, tool: that.currentTools });
		},
		deactivate: function ()
		{
			var that = this;
			if (this.tools)
			{
				for (var t = 0; t < this.tools.length; t++)
				{
					var tool = this.tools[t];
					tool.deactivate();
				}
			}
			this.trigger("deactivate", this.getCurrentState());
			this.tools = [];
			this.currentTools = "";
			this.current = null;
		},
		statics: { "TEXT": 1, "VERTICES": 2, "MOVE": 4, "ROTATE": 8, "SCALE": 16 }, events: ["activate", "deactivate"]
	});
	return edit;
} ();
function CreateDiv(pParent, pt, color)
{
	var node = pParent.ownerDocument.createElement("DIV");
	node.style.position = "absolute";
	node.style.overflow = "hidden";
	node.style.left = pt.X - 5 + "px";
	node.style.top = pt.Y - 5 + "px";
	node.style.width = 10 + "px";
	node.style.height = 10 + "px";
	node.style.background = color;
	pParent.appendChild(node);
	return node;
}
function CreateInput(pParent, sType, sName, sValue)
{
	var pInput = pParent.ownerDocument.createElement("input");
	pInput.type = sType;
	pInput.name = sName;
	pInput.value = sValue;
	pParent.appendChild(pInput);
	return pInput;
}
function CreateNode(pParent, sTag)
{
	var pInput = pParent.ownerDocument.createElement(sTag);
	pParent.appendChild(pInput);
	return pInput;
}
function CreateText(pParent, sText)
{
	var pText = pParent.ownerDocument.createTextNode(sText);
	pParent.appendChild(pText);
	return pText;
}
function AttributeDialog(pParentElem, pMapBase, left, top)
{
	var pPanel = null;
	var pDlg = null;
	var pThis = this;
	this.bOpen = false;
	this.Open = function (pLayer, sID, pGeometry, sValues)
	{
		this.bOpen = true;
		var Inputs = new Array;
		pPanel = new SWGPanel(pParentElem, 0, true, true);
		pPanel.putTitle("Edit attributes");
		var pM = pPanel.getMainFrame();
		pM.style.position = "absolute";
		pM.style.top = top + "px";
		pM.style.left = left + "px";
		pDlg = pPanel.getViewFrame();
		if (pGeometry == null)
		{
			pDlg.innerHTML = "Querying...";
			return;
		}
		pDlg.style.background = "#fffff0";
		pDlg.style.border = "1px solid #333";
		pDlg.style.textAlign = "left";
		pDlg.style.width = "240px";
		pDlg.style.height = "300px";
		pDlg.style.overflow = "auto";
		var pTable = pDlg.ownerDocument.createElement("TABLE");
		var pRow = pTable.insertRow(0);
		var pCell1 = pRow.insertCell(0);
		var pCell2 = pRow.insertCell(1);
		var pTable1 = pCell1.ownerDocument.createElement("TABLE");
		var pTable2 = pCell2.ownerDocument.createElement("TABLE");
		pDlg.appendChild(pTable);
		pCell1.appendChild(pTable1);
		pCell2.appendChild(pTable2);
		pTable1.style.fontSize = "10px";
		pTable2.style.fontSize = "10px";
		var m_pFlds = pLayer.getFields();
		for (var i = 0; i < m_pFlds.length; i++)
		{
			var pRow1 = pTable1.insertRow(i);
			var pCell = pRow1.insertCell(0);
			var text = CreateText(pCell, m_pFlds[i] + ": ");
			var pRow2 = pTable2.insertRow(i);
			var pCell2 = pRow2.insertCell(0);
			var iFields = CreateInput(pCell2, "text", i, "");
			iFields.style.fontSize = "10px";
			pRow1.style.height = "25px";
			pRow2.style.height = "25px";
			iFields.style.width = "150px";
			Inputs.push(iFields);
			if (sValues)
			{
				if (sValues instanceof Array)
				{
					if (sValues && sValues[i])
					{
						Inputs[i].value = sValues[i];
					}
				} else
				{
					if (m_pFlds[i] == sValues.field)
					{
						Inputs[i].value = sValues.value;
					}
				}
			}
		}
		var m_sValues = new Array;
		this.SetValue = function (index, value)
		{
			if (index > m_sValues.length)
			{
				return;
			}
			m_sValues[index] = value;
		};
		this.GetValues = function ()
		{
			if (m_sValues.length == 0)
			{
				return;
			}
			var str = m_sValues[0];
			for (var i = 1; i < m_sValues.length; i++)
			{
				str += "," + m_sValues[i];
			}
			return str;
		};
		var pCloseFunc = function ()
		{
			if (pGeometry == null)
			{
				pPanel.FinalRelease();
				return;
			}
			pGeometry.Destroy();
			pGeometry = null;
			pThis.bOpen = false;
			pPanel.FinalRelease();
			pDlg.parentNode.removeChild(pDlg);
		};
		var pUpdateFunc = function ()
		{
			if (pGeometry == null)
			{
				return;
			}
			for (var i = 0; i < Inputs.length; i++)
			{
				pThis.SetValue(Inputs[i].name, Inputs[i].value);
			}
			pLayer.ExecuteUpdate(sID, pGeometry.WellKnownText(), pThis.GetValues(), function ()
			{
			}, false);
			pGeometry.Destroy();
			pGeometry = null;
			pThis.bOpen = false;
			pPanel.FinalRelease();
			pDlg.parentNode.removeChild(pDlg);
		};
		var pDeleteFunc = function ()
		{
			if (pGeometry == null)
			{
				return;
			}
			if (sID != "")
			{
				pLayer.ExecuteDelete(sID, function ()
				{
				}, false);
			}
			pGeometry.Destroy();
			pGeometry = null;
			pThis.bOpen = false;
			pPanel.FinalRelease();
			pDlg.parentNode.removeChild(pDlg);
		};
		var pTable4 = pDlg.ownerDocument.createElement("TABLE");
		pDlg.appendChild(pTable4);
		pTable4.style.fontSize = "10px";
		var pRow4 = pTable4.insertRow(0);
		pRow4.style.height = "25px";
		var pCell3 = pRow4.insertCell(0);
		var pTable3 = pCell3.ownerDocument.createElement("TABLE");
		pCell3.appendChild(pTable3);
		pCell3.align = "center";
		var pRB = pTable3.insertRow(0);
		var pCB1 = pRB.insertCell(0);
		var pUpdateBtn = CreateInput(pCB1, "button", "Update", "Update");
		pUpdateBtn.style.width = "66px";
		pUpdateBtn.style.fontSize = "10px";
		AttachEvent(pUpdateBtn, "click", pUpdateFunc, false);
		var pCB2 = pRB.insertCell(1);
		var pCancelBtn = CreateInput(pCB2, "button", "Cancel", "Cancel");
		pCancelBtn.style.width = "66px";
		pCancelBtn.style.fontSize = "10px";
		AttachEvent(pCancelBtn, "click", pCloseFunc, false);
		var pCB3 = pRB.insertCell(2);
		var pDeleteBtn = CreateInput(pCB3, "button", "Delete", "Delete");
		pDeleteBtn.style.width = "66px";
		pDeleteBtn.style.fontSize = "10px";
		AttachEvent(pDeleteBtn, "click", pDeleteFunc, false);
		pPanel.setClosedEvent(pCloseFunc);
		pPanel.FitFrameSize();
	};
	this.Close = function ()
	{
		if (pPanel)
		{
			pPanel.FinalRelease();
		}
		if (pDlg)
		{
			pDlg.parentNode.removeChild(pDlg);
		}
		this.bOpen = false;
	};
}
function NewFeature(pMapCont)
{
	this.ExitMapEvent = null;
	var hObj = null;
	var ptPos = null;
	var part = 0;
	var fldDlg = null;
	var pGeomertry = null;
	var pLayer = null;
	this.InitMapEvent = function (pMapBase)
	{
		var nFeatType = null;
		var bEndEdit = false;
		hObj = pMapBase.getHPackage();
		var Values = new Array;
		var pMouseDown = function (tEvent)
		{
			var pActiveLayer = pMapCont.getActive();
			if (pActiveLayer == null)
			{
				return false;
			}
			pLayer = pActiveLayer.getLayer();
			if (pLayer == null)
			{
				return false;
			}
			if (pLayer.ExecuteUpdate == null)
			{
				return false;
			}
			nFeatType = pLayer.getFeatureType();
			ptPos = pMapBase.getCursorPosition(tEvent);
			if (tEvent.button != 0)
			{
				return;
			}
			var mapPt = pMapBase.ToMapPoint(ptPos.X, ptPos.Y);
			if (fldDlg != null)
			{
				if (fldDlg.bOpen == false)
				{
					pGeomertry == null;
				}
			}
			if (nFeatType == MapLayer.enumFeatureType.Point)
			{
				if (pGeomertry == null)
				{
					if (fldDlg != null)
					{
						if (fldDlg.bOpen == true)
						{
							return;
						}
					}
					pGeomertry = new Point(pMapBase);
					pGeomertry.SetPoint(mapPt);
					pGeomertry.Editable(true);
					fldDlg = new AttributeDialog(pMapBase.getHPackage().ownerDocument.body, pMapBase, ptPos.X + 10, ptPos.Y + 10);
					fldDlg.Open(pLayer, "", pGeomertry, Values);
					pGeomertry = null;
				}
			} else
			{
				if (nFeatType == MapLayer.enumFeatureType.LineString)
				{
					if (pGeomertry == null)
					{
						if (fldDlg != null)
						{
							if (fldDlg.bOpen == true)
							{
								return;
							}
						}
						pGeomertry = new Polyline(pMapBase);
						pGeomertry.Editable(false);
					}
					pGeomertry.AddPoint(mapPt);
				} else
				{
					if (nFeatType == MapLayer.enumFeatureType.Polygon)
					{
						if (pGeomertry != null)
						{
							var pts = pGeomertry.getPoints();
							var i = pts.length - 1;
							var pt = pMapBase.FromMapPoint(pts[i][0].X, pts[i][0].Y);
							if (Math.abs(pt.X - ptPos.X) < 10 && Math.abs(pt.Y - ptPos.Y) < 10)
							{
								if (pts[part + 1] == null && pGeomertry.Verify() == true)
								{
									part += 1;
									return false;
								}
							}
						} else
						{
							if (fldDlg != null)
							{
								if (fldDlg.bOpen == true)
								{
									return;
								}
							}
							pGeomertry = new Polygon(pMapBase);
							pGeomertry.Editable(false);
						}
						pGeomertry.AddPoint(part, mapPt);
					}
				}
			}
			pMapBase.RefreshMap(true);
		};
		var pDblClick = function (tEvent)
		{
			if (pLayer == null)
			{
				return;
			}
			ptPos = pMapBase.getCursorPosition(tEvent);
			if (nFeatType == MapLayer.enumFeatureType.Point)
			{
				return;
			}
			if (pGeomertry != null)
			{
				if (nFeatType == MapLayer.enumFeatureType.Polygon)
				{
					pGeomertry.Verify();
					pGeomertry.Editable(true);
					pGeomertry.RebuildElement();
					part = 0;
				} else
				{
					pGeomertry.Editable(true);
				}
				fldDlg = new AttributeDialog(pMapBase.getHPackage().ownerDocument.body, pMapBase, ptPos.X + 10, ptPos.Y + 10);
				if (fldDlg != null)
				{
					fldDlg.Open(pLayer, "", pGeomertry, Values);
				}
				pGeomertry = null;
			}
			bEndEdit = true;
			pLayer = null;
			return false;
		};
		this.ExitMapEvent = function ()
		{
			if (bEndEdit == false && pGeomertry)
			{
				pGeomertry.Destroy();
				pGeomertry = null;
			}
			DetachEvent(hObj, "click", pMouseDown, false);
			DetachEvent(hObj, "dblclick", pDblClick, false);
			pLayer = null;
		};
		AttachEvent(hObj, "click", pMouseDown, false);
		AttachEvent(hObj, "dblclick", pDblClick, false);
	};
}
sg.AttributeInspector = sg.Class.extend({ 
	initialize: function (pParentElem, pMapBase)
	{
		var mobile = CheckDevice();
		if(!mobile)
		{
			var pInfoTemplate = null;
			var pThis = this;
			this.bOpen = false;
			var that = this;
			var map = pMapBase;
			var lastGeometry;
			var ExitGeometry;
			this.Open = function (pLayer, sID, pGeometry, sValues, undoManager, beforeGeometry)
			{
				var othat = this;
				ExitGeometry = pGeometry;
				if (beforeGeometry)
					lastGeometry = beforeGeometry;
				this.bOpen = true;
				var Inputs = new Array;
				that.Inputs = Inputs;
				map.infoWindow.setTitle("Edit attributes");
				if (pGeometry == null)
				{
					map.infoWindow.setContent("Querying...");
					return;
				}
				var m_pFlds = pLayer.getFields();
				var m_pFldsType = pLayer.getFieldsType();
				var edit_content = document.createElement("div");
				for (var i = 0 ; i < m_pFlds.length ; i++)
				{
					var childcontent = document.createElement("div");
					childcontent.style.width = "100%";
					childcontent.style.height = "30px";
					childcontent.style.float = "left";
					var field = document.createElement("label");
					field.innerHTML = m_pFlds[i] + ": ";
					field.style.float = "left";
					childcontent.appendChild(field);
					var field_text = CreateInput(childcontent, "text", i, "");
					field_text.style.float = "right";
					field_text.style.marginRight = "15px";
					Inputs.push(field_text);
					if (field_text && (m_pFlds[i] in sValues))
						field_text.value = sValues[m_pFlds[i]];
					if (m_pFldsType[i] != "13")
						edit_content.appendChild(childcontent);
				}
				var m_sValues = new Array;
				this.SetValue = function (index, value)
				{
					if (index > m_sValues.length)
						return;
					m_sValues[index] = value;
				};
				this.GetValues = function ()
				{
					if (m_sValues.length == 0)
						return;
		
					var str = m_sValues[0];
					for (var i = 1; i < m_sValues.length; i++)
						str += "," + m_sValues[i];
		
					return str;
				};
				var pCloseFunc = function ()
				{
					if (pGeometry == null)
						return;
					if (pMapBase.drawingGraphicsLayer)
						pMapBase.drawingGraphicsLayer.remove(pGeometry);
					pGeometry = null;
					that.bOpen = false;
					that.trigger("cancel");
				};
				var pUpdateFunc = function ()
				{
					if (pGeometry == null)
						return;
					if (pMapBase.drawingGraphicsLayer)
						pMapBase.drawingGraphicsLayer.remove(pGeometry);
					for (var i = 0; i < Inputs.length; i++)
						that.SetValue(Inputs[i].name, Inputs[i].value);
					var Wkt = pGeometry.geometry.toWkt();
					
					pLayer.ExecuteUpdate(sID, Wkt, that.GetValues(), function (e)
					{
						var result = FindXMLNodes(e.responseXML, "result");
						if (result)
						{
							sID = result[0].getAttribute("ID");
						}
					}, false);
					
					var operation;
					operation = new EditOperation(pLayer, pGeometry, othat, sID, lastGeometry, "Save");
					undoManager.add(operation);
					
					pGeometry = null;
					that.bOpen = false;
					if (map.infoWindow.isShowing)
						map.infoWindow.hide();
					that.trigger("update");
				};
				var pDeleteFunc = function ()
				{
					if (pGeometry == null)
						return;
					
					for (var i = 0; i < Inputs.length; i++)
						that.SetValue(Inputs[i].name, Inputs[i].value);
					
					if (sID != "")
					{
						var operation = new EditOperation(pLayer, pGeometry, othat, sID, lastGeometry, "Delete");
						undoManager.add(operation);
						
						pLayer.ExecuteDelete(sID, function ()
						{
						}, false);
					}
					if (pMapBase.drawingGraphicsLayer)
						pMapBase.drawingGraphicsLayer.remove(pGeometry);
					
					pGeometry = null;
					that.bOpen = false;
					if (map.infoWindow.isShowing)
						map.infoWindow.hide();
					that.trigger("delete");
				};
				var pUpdateBtn = CreateInput(edit_content, "button", "Save", "Save");
				pUpdateBtn.style.width = "66px";
				pUpdateBtn.style.height = "22px";
				pUpdateBtn.style.float = "left";
				pUpdateBtn.style.fontSize = "12px";
				pUpdateBtn.style.marginTop = "20px";
				AttachEvent(pUpdateBtn, "click", pUpdateFunc, false);
				
				var pDeleteBtn = CreateInput(edit_content, "button", "Delete", "Delete");
				pDeleteBtn.style.width = "66px";
				pDeleteBtn.style.height = "22px";
				pDeleteBtn.style.fontSize = "12px";
				pDeleteBtn.style.float = "left";
				pDeleteBtn.style.marginTop = "20px";
				pDeleteBtn.style.marginLeft = "10px";
				AttachEvent(pDeleteBtn, "click", pDeleteFunc, false);
				
				
				map.infoWindow.setContent(edit_content);
				map.infoWindow.setCloseEvent(pCloseFunc);
				var midpoint;
				if (pGeometry.geometry instanceof sg.geometry.Polygon || pGeometry.geometry instanceof sg.geometry.Extent)
				{
					midpoint = pGeometry.geometry.rings[0].getMidPoint();
					var midpoint_temp = pGeometry.geometry.getExtent();
					midpoint.x = (midpoint_temp.xmax + midpoint_temp.xmin) / 2;
					midpoint.y = (midpoint_temp.ymax + midpoint_temp.ymin) / 2;
				}
				else if (pGeometry.geometry instanceof sg.geometry.LineString)
					midpoint = pGeometry.geometry.getMidPoint();
				else if (pGeometry.geometry instanceof sg.geometry.Point)
					midpoint = pGeometry.geometry;
				else if (pGeometry.geometry instanceof sg.geometry.MultiPolygon || pGeometry.geometry instanceof sg.geometry.MultiLineString)
				{
					midpoint = new sg.geometry.Point;
					midpoint.x = (pGeometry.geometry.extent.xmax + pGeometry.geometry.extent.xmin) / 2;
					midpoint.y = (pGeometry.geometry.extent.ymax + pGeometry.geometry.extent.ymin) / 2;
				}
				
				map.infoWindow.resize(350, 250);
				map.infoWindow.show(midpoint);
			};
			this.Close = function (type)
			{
				map.infoWindow.hide();
				if (ExitGeometry && type == "item")
				{
					pMapBase.drawingGraphicsLayer.remove(ExitGeometry);
					ExitGeometry = null;
				}
			}
		}
		else
		{
			var pInfoTemplate = null;
			var pThis = this;
			this.bOpen = false;
			var that = this;
			var map = pMapBase;
			var lastGeometry;
			var ExitGeometry;
			this.Open = function (pLayer, sID, pGeometry, sValues, undoManager, beforeGeometry)
			{
				var othat = this;
				ExitGeometry = pGeometry;
				if (beforeGeometry)
					lastGeometry = beforeGeometry;
				this.bOpen = true;
				var Inputs = new Array;
				that.Inputs = Inputs;
                var FileUploads = null;
                that.FileUploads = FileUploads;
				map.infoWindow.setTitle("Edit attributes");
				if (pGeometry == null)
				{
					map.infoWindow.setContent("Querying...");
					return;
				}
				var m_pFlds = pLayer.getFields();
				var m_pFldsType = pLayer.getFieldsType();
				var edit_content = document.createElement("div");
				for (var i = 0 ; i < m_pFlds.length ; i++)
				{
					var childcontent = document.createElement("div");
					childcontent.style.width = "100%";
					childcontent.style.marginTop = "1%";
					childcontent.style.height = "10%";
					childcontent.style.float = "left";
					var field = document.createElement("label");
					field.innerHTML = m_pFlds[i] + ": ";
					field.style.float = "left";
					field.style.marginLeft = "15px";
					field.style.fontSize = "30pt";
					childcontent.appendChild(field);
                    if (m_pFlds[i] != '照片')
                    {
					    var field_text = CreateInput(childcontent, "text", i, "");
					    field_text.style.fontSize = "30pt";
					    field_text.style.float = "right";
					    field_text.style.marginRight = "15px";
                        field_text.style.width = '60%';
					    Inputs.push(field_text);
					    if (field_text)
						    if (m_pFlds[i] in sValues)
							    field_text.value = sValues[m_pFlds[i]];
                    }
                    else
                    {
                        var field_text = CreateInput(childcontent, "text", i, "");
					    field_text.style.fontSize = "30pt";
					    field_text.style.float = "right";
					    field_text.style.marginRight = "15px";
                        field_text.style.width = '60%';
                        field_text.style.display = 'none';
					    Inputs.push(field_text);
					    if (field_text)
						    if (m_pFlds[i] in sValues)
							    field_text.value = sValues[m_pFlds[i]];
                        
                        var v = field_text.value;
                        if (v == '')
                        {
                            var lab = document.createElement("label");
					        lab.innerHTML = "無照片.";
					        lab.style.fontSize = "30pt";
					        lab.style.float = "right";
					        lab.style.marginRight = "15px";
                            lab.style.width = '60%';
                            childcontent.appendChild(lab);
                        }
                        else
                        {
                            var vs = v.split(';');
                            var primg = document.createElement("img");
                            primg.src = "PhotoUpload/" + sID + "/" + vs[0];
                            primg.style.width = "50%";
                            primg.style.float = "right";
                            childcontent.appendChild(primg);
                            AttachEvent(primg, "click", function()
	                        {
		                        var tar = FindXMLNodeById(document, "mobilebox2");
                                var tar_title = document.createElement("div");
					            tar_title.style.float = "left";
					            tar_title.style.width = "100%";
					            tar_title.style.height = "10%";
					            tar_title.style.overflow = "hidden";
					            tar_title.style.backgroundColor = "#2F9BDA";
					            tar.appendChild(tar_title);
					            
					            var tar_title_label = document.createElement("label");
					            tar_title_label.style.float = "left";
					            tar_title_label.style.color = "#FFF";
					            tar_title_label.style.fontSize = "30pt";
					            tar_title_label.style.marginLeft = "2%";
					            tar_title_label.style.marginTop = "2%";
                                tar_title_label.innerHTML = '照片預覽';
					            tar_title.appendChild(tar_title_label);

                                var bkimg = document.createElement("img");
		                        bkimg.src = "images/right-arrow-of-straight-lines.png";
                                bkimg.style.width = '10%';
                                bkimg.style.float = 'right';
                                bkimg.style.marginTop = '2%';
                                bkimg.style.marginRight = '5%';
		                        AttachEvent(bkimg, "touchstart", function ()
		                        {
                                    tar.innerHTML = '';
                                    tar.style.display = 'none';
		                        });
                                tar_title.append(bkimg);

					            var tar_body = document.createElement("div");
					            tar_body.style.float = "left";
					            tar_body.style.width = "100%";
					            tar_body.style.height = "90%";
					            tar_body.style.overflow = "auto";
					            tar.appendChild(tar_body);

                                var values = field_text.value.split(';');
                                for (var i = 0 ; i < values.length ; i++)
                                {
                                    if (values[i] == '')
                                        continue;
                                    
                                    var div = document.createElement("div");
                                    div.style.float = 'left';
                                    div.style.width = '47.5%';
                                    div.style.height = '30%';
                                    div.style.marginRight = '2.5%';
                                    div.style.marginTop = '2.5%';
                                    div.style.position = 'relative';
                                    div.id = values[i];
                                    
                                    var close = document.createElement("span");               
                                    close.style.fontSize = '40pt';
                                    close.style.fontWeight = 'bolder';
                                    close.style.color = '#EA0000';
                                    close.style.position = 'absolute';
                                    close.style.right = '5px';
                                    close.style.top = '5px';
                                    close.innerHTML = 'X';
                                    close.targetdiv = div;
                                    div.appendChild(close);

                                    AttachEvent(close, "touchstart", function ()
		                            {
                                        var vals = field_text.value.split(';');
                                        var str = '';
                                        for (var i = 0 ; i < vals.length ; i ++)
                                        {
                                            if (vals[i] != this.targetdiv.id)
                                                str += vals[i] + ';';
                                        }
                                        field_text.value = str;
                                        this.targetdiv.style.display = 'none';
		                            });

                                    var img = document.createElement("img");
                                    img.style.width = '100%';
                                    img.style.height = '100%';
                                    img.src = "PhotoUpload/" + sID + "/" + values[i];
                                    div.appendChild(img);
                                    
                                    tar_body.appendChild(div);
                                }

                                tar.style.display = 'block';
                                tar.style.zIndex = '32767';
	                        }, false);
                        }
                        
                        var fileupload = document.createElement("input");
                        fileupload.type = 'file';
                        fileupload.style.fontSize = "30pt";
					    fileupload.style.float = "right";
					    fileupload.style.marginRight = "15px";
                        fileupload.style.width = '70%';
                        fileupload.targetText = field_text;
                        fileupload.motovalue = field_text.value;
                        fileupload.accept = 'image/*';
                        fileupload.multiple = 'multiple';
                        childcontent.appendChild(fileupload);
                        FileUploads = fileupload;
                    }
                    if (m_pFldsType[i] != "13")
						edit_content.appendChild(childcontent);
				}
				var m_sValues = new Array;
				this.SetValue = function (index, value)
				{
					if (index > m_sValues.length)
						return;
					m_sValues[index] = value;
				};
				
				this.GetValues = function ()
				{
					if (m_sValues.length == 0)
					{
						return;
					}
					var str = m_sValues[0];
					for (var i = 1; i < m_sValues.length; i++)
					{
						str += "," + m_sValues[i];
					}
					return str;
				};
				var pCloseFunc = function ()
				{
					if (pGeometry == null)
						return;
					if (pMapBase.drawingGraphicsLayer)
					{
						pMapBase.drawingGraphicsLayer.remove(pGeometry);
					}
					pGeometry = null;
					that.bOpen = false;
					that.trigger("cancel");
				};
				var pUpdateFunc = function ()
				{
					if (pGeometry == null)
					{
						return;
					}
					if (pMapBase.drawingGraphicsLayer)
					{
						pMapBase.drawingGraphicsLayer.remove(pGeometry);
					}
                    
                    if (FileUploads && sID != '')
                    {
                        var formData = new FormData();
                        var str = '';
                        for (var i = 0 ; i < FileUploads.files.length ; i++)
                        {
                            var file = FileUploads.files[i];
                            formData.append(file.name, file);
                            str += file.name + ';';
                        }
                        formData.append('op', 'UploadPhotos');
                        formData.append('id', sID);

                        var agent = new AjaxAgent("PhotoUpload.ashx", false, false);
                        agent.SendRequest(formData, null, null, null);

                        Inputs[Inputs.length - 1].value += str;
                        if (Inputs[Inputs.length - 1].value == ';' || Inputs[Inputs.length - 1].value == ';;')
                            Inputs[Inputs.length - 1].value = '';
                    }
                    else if (FileUploads && sID == '')
                    {
                        var str = '';
                        for (var i = 0 ; i < FileUploads.files.length ; i++)
                        {
                            var file = FileUploads.files[i];
                            str += file.name + ';';
                        }
                        Inputs[Inputs.length - 1].value += str;
                        if (Inputs[Inputs.length - 1].value == ';' || Inputs[Inputs.length - 1].value == ';;')
                            Inputs[Inputs.length - 1].value = '';
                    }

					for (var i = 0; i < Inputs.length; i++)
					{
						that.SetValue(Inputs[i].name, Inputs[i].value);
					}
                    
					var operation;
					operation = new EditOperation(pLayer, pGeometry, lastGeometry, othat, "Save");
					undoManager.add(operation);
					
                    var tID = '';
					pLayer.ExecuteUpdate(sID, pGeometry.geometry.toWkt(), that.GetValues(), function (res)
					{
                        if (sID == '')
                        {
                            var data = res.responseXML;
                            var r = data.getElementsByTagName("result");
                            if (r[0].getAttribute("Status") == "True")
                                tID = r[0].getAttribute("ID");
                        }
					}, false);

                    if (FileUploads && sID == '' && tID != '')
                    {
                        var formData = new FormData();
                        var str = '';
                        for (var i = 0 ; i < FileUploads.files.length ; i++)
                        {
                            var file = FileUploads.files[i];
                            formData.append(file.name, file);
                            str += file.name + ';';
                        }
                        formData.append('op', 'UploadPhotos');
                        formData.append('id', tID);

                        var agent = new AjaxAgent("PhotoUpload.ashx", false, false);
                        agent.SendRequest(formData, null, null, null);
                    }
					
					pGeometry = null;
					that.bOpen = false;
					if (map.infoWindow.isShowing)
						map.infoWindow.hide();
					
					var resultNode = FindXMLNodeById(document, "mobilebox");
					resultNode.innerHTML = "";
                    resultNode.style.display = 'none';
					that.trigger("update");
				};
				var pDeleteFunc = function ()
				{
					if (pGeometry == null)
					{
						return;
					}
					if (sID != "")
					{
						var operation = new EditOperation(pLayer, pGeometry, lastGeometry, othat, "Delete");
						undoManager.add(operation);
						
						var deletetemp = "";
						pLayer.ExecuteDelete(sID, function ()
						{
						}, false);
					}
					if (pMapBase.drawingGraphicsLayer)
					{
						pMapBase.drawingGraphicsLayer.remove(pGeometry);
					}
					
					pGeometry = null;
					that.bOpen = false;
					if (map.infoWindow.isShowing)
						map.infoWindow.hide();
					var resultNode = FindXMLNodeById(document, "mobilebox");
					resultNode.innerHTML = "";
                    resultNode.style.display = 'none';
                    
					that.trigger("delete");
				};
				var toolpage = FindXMLNodeById(document, "Editmenu");
				
				var mobile_result_title = document.createElement("div");
				mobile_result_title.style.float = "left";
				mobile_result_title.style.width = "100%";
				mobile_result_title.style.height = "10%";
				mobile_result_title.style.overflow = "hidden";
				mobile_result_title.style.backgroundColor = "#2F9BDA";
				
				var mobile_result_title_label = document.createElement("label");
				mobile_result_title_label.style.float = "left";
				mobile_result_title_label.style.color = "#FFF";
				mobile_result_title_label.style.fontSize = "35pt";
				mobile_result_title_label.style.marginLeft = "2%";
				mobile_result_title_label.style.marginTop = "3.5%";
				mobile_result_title.appendChild(mobile_result_title_label);

				var mobile_result_body = document.createElement("div");
				mobile_result_body.style.float = "left";
				mobile_result_body.style.width = "100%";
				mobile_result_body.style.height = "80%";
				mobile_result_body.style.overflow = "auto";
				
				var mobile_result_bottom = document.createElement("div");
				mobile_result_bottom.style.float = "left";
				mobile_result_bottom.style.borderTop = "solid";
				mobile_result_bottom.style.width = "100%";
				mobile_result_bottom.style.height = "10%";
				
				var pUpdateBtn = CreateInput(mobile_result_bottom, "div", "Save", "Save");
				pUpdateBtn.style.float = "left";
				pUpdateBtn.style.marginLeft = "15px";
				pUpdateBtn.style.marginTop = "2%";
                pUpdateBtn.style.fontSize = '30pt';
				pUpdateBtn.style.backgroundColor = "#FFF";
                pUpdateBtn.style.textAlign = 'center';
                pUpdateBtn.style.width = '140px';
				pUpdateBtn.style.border = "1px solid #555555";
				AttachEvent(pUpdateBtn, "click", pUpdateFunc, false);
				
				var pDeleteBtn = CreateInput(mobile_result_bottom, "div", "Delete", "Delete");
				pDeleteBtn.style.float = "left";
				pDeleteBtn.style.marginLeft = "15px";
				pDeleteBtn.style.marginTop = "2%";
                pDeleteBtn.style.fontSize = '30pt';
                pDeleteBtn.style.textAlign = 'center';
                pDeleteBtn.style.width = '140px';
				pDeleteBtn.style.backgroundColor = "#FFF";
				pDeleteBtn.style.border = "1px solid #555555";
				AttachEvent(pDeleteBtn, "click", pDeleteFunc, false);
				
				var resultNode = FindXMLNodeById(document, "mobilebox");
				resultNode.innerHTML = "";
				resultNode.appendChild(mobile_result_title);
				resultNode.appendChild(mobile_result_body);
				resultNode.appendChild(mobile_result_bottom);
				mobile_result_title_label.innerHTML = sID;
				mobile_result_body.appendChild(edit_content);
				
				var Back_btn = CreateInput(mobile_result_bottom, "div", "Cancel", "Cancel");
				Back_btn.id = "E_Clear";
				Back_btn.style.float = "left";
				Back_btn.style.marginLeft = "15px";
				Back_btn.style.marginTop = "2%";
                Back_btn.style.fontSize = '30pt';
                Back_btn.style.textAlign = 'center';
                Back_btn.style.width = '140px';
				Back_btn.style.backgroundColor = "#FFF";
				Back_btn.style.border = "1px solid #555555";
				AttachEvent(Back_btn, "click", function () {
					map.infoWindow.hide();
					
                    resultNode.style.display = 'none';
					resultNode.innerHTML = "";
					if (pMapBase.drawingGraphicsLayer)
					{
						pMapBase.drawingGraphicsLayer.remove(pGeometry);
					}
					that.trigger("update");
				});
				
				var midpoint;
				if (pGeometry.geometry instanceof sg.geometry.Polygon || pGeometry.geometry instanceof sg.geometry.Extent)
				{
					midpoint = pGeometry.geometry.rings[0].getMidPoint();
					var midpoint_temp = pGeometry.geometry.getExtent();
					midpoint.x = (midpoint_temp.xmax + midpoint_temp.xmin) / 2;
					midpoint.y = (midpoint_temp.ymax + midpoint_temp.ymin) / 2;
				}
				else if (pGeometry.geometry instanceof sg.geometry.LineString)
					midpoint = pGeometry.geometry.getMidPoint();
				else if (pGeometry.geometry instanceof sg.geometry.Point)
					midpoint = pGeometry.geometry;
                
				map.infoWindow.setContent("...................");
				map.infoWindow.resize(80, 50);
				map.infoWindow.show(midpoint);
                resultNode.style.display = 'block';
				resultNode.style.zIndex = "32767";
                toolpage.style.display = 'none';
			};
			this.Close = function (type)
			{
				map.infoWindow.hide();
				if (ExitGeometry && type == "item")
				{
					pMapBase.drawingGraphicsLayer.remove(ExitGeometry);
					ExitGeometry = null;
				}
			}
		}
	}, 
	events: ["attribute-change", "delete", "update", "cancel"]
});
(function ()
{
	sg.EditFeatureTool = function (pMapCont, undoManager, EditTool)
	{
		this.ExitMapEvent = null;
		var hObj = null;
		var ptPos = null;
		var pGeomertry = null;
		var activeGraphics = [];
		var edit;
		var fldDlg;
		this.InitMapEvent = function (pMapBase)
		{
			hObj = pMapBase.getHPackage();
			if (!edit)
			{
				edit = new sg.Edit(pMapBase);
			}
			var Values = new Array;
			var onClick = function (tEvent)
			{
				if (pMapCont == null)
				{
					return;
				}
				var pLayer = pMapCont;
				var OffsetPt2 = pMapBase.getCursorPosition(tEvent);
				var cpt1 = pMapBase.ToMapPoint(OffsetPt2.X - 30, OffsetPt2.Y - 30);
				var cpt2 = pMapBase.ToMapPoint(OffsetPt2.X + 30, OffsetPt2.Y + 30);
				var resource = pLayer.getResourcePath ? pLayer.getResourcePath() : pLayer.getParent ? pLayer.getParent().getResourcePath() : null;
				if (!resource)
				{
					return;
				}
				var queryTask = new sg.tasks.QueryTask(resource, pLayer.getName());
				var query = new sg.tasks.Query;
				var o1 = pMapBase.ToMapPoint(OffsetPt2.X - 30, OffsetPt2.Y - 30);
				var o2 = pMapBase.ToMapPoint(OffsetPt2.X + 30, OffsetPt2.Y - 30);
				var o3 = pMapBase.ToMapPoint(OffsetPt2.X + 30, OffsetPt2.Y + 30);
				var o4 = pMapBase.ToMapPoint(OffsetPt2.X - 30, OffsetPt2.Y + 30);
				var o5 = pMapBase.ToMapPoint(OffsetPt2.X - 30, OffsetPt2.Y - 30);
				var p1 = new sg.geometry.Point(o1.X, o1.Y);
				var p2 = new sg.geometry.Point(o2.X, o2.Y);
				var p3 = new sg.geometry.Point(o3.X, o3.Y);
				var p4 = new sg.geometry.Point(o4.X, o4.Y);
				var p5 = new sg.geometry.Point(o5.X, o5.Y);
				var ring = new sg.geometry.LinearRing;
				ring.setPath([p1, p2, p3, p4, p5]);
				var poly = new sg.geometry.Polygon;
				poly.addRing(ring);
				query.geometry = poly;
				
				var first;
				queryTask.execute(query, function (featureSet)
				{
					if (featureSet.features.length <= 0)
					{
						return;
					}
					first = featureSet.features[0];
				});
				queryTask.execute(query, function (featureSet)
				{
					if (featureSet.features.length <= 0)
					{
						return;
					}
					for (var i = 0; i < activeGraphics.length; i++)
					{
						pMapBase.drawingGraphicsLayer.remove(activeGraphics[i]);
					}
					activeGraphics = [];
					var e = featureSet.features[0];
					if (pMapBase.drawingGraphicsLayer)
					{
						if (e.geometry instanceof sg.geometry.MultiPolygon || e.geometry instanceof sg.geometry.Polygon || e.geometry instanceof sg.geometry.Extent)
						{
							e.symbol = (new sg.symbols.SimpleFillSymbol).setColor(new sg.Color(0, 0, 255, .5));
							e.symbol.outline.setWidth(1);
						}
						else if (e.geometry instanceof sg.geometry.MultiLineString || e.geometry instanceof sg.geometry.LineString)
						{
							e.symbol = new sg.symbols.SimpleLineSymbol;
							e.symbol.setWidth(5);
						}
						else if (e.geometry instanceof sg.geometry.Point || e.geometry instanceof sg.geometry.MultiPoint)
						{
							var symbol = (new sg.symbols.SimpleMarkerSymbol).setSize(30).setOutline(new sg.symbols.SimpleLineSymbol);
							e.symbol = symbol;
						}
						pMapBase.drawingGraphicsLayer.add(e);
						activeGraphics.push(e);
					}
					var options = { allowAddVertices: true, allowDeleteVertices: true };
					edit.activate(sg.Edit.VERTICES | sg.Edit.ROTATE | sg.Edit.MOVE | sg.Edit.SCALE, e, options);
					if (fldDlg)
					{
						fldDlg.Close();
					}
					fldDlg = new sg.AttributeInspector(pMapBase.getHPackage().ownerDocument.body, pMapBase, EditTool);
					fldDlg.on("delete", function ()
					{
						edit.deactivate();
					});
					fldDlg.on("update", function ()
					{
						edit.deactivate();
					});
					fldDlg.on("cancel", function ()
					{
						edit.deactivate();
					});
					if (fldDlg != null)
					{
						fldDlg.Open(pLayer, e.id, e, e.attributes, undoManager, first);
					}
				});
			};
			this.ExitMapEvent = function ()
			{
				for (var i = 0; i < activeGraphics.length; i++)
					pMapBase.drawingGraphicsLayer.remove(activeGraphics[i]);

				if (edit)
					edit.deactivate();

				activeGraphics = [];
				if (fldDlg)
					fldDlg.Close();
				
				fldDlg = null;
				cEvent.remove();
			};
			var cEvent = null;
			var mobile = CheckDevice();
			if(!mobile)
				cEvent = pMapBase.on("click", onClick);
			else
				cEvent = pMapBase.on("touchstart", onClick);
		};
	};
})();

function EditFeature(pMapCont)
{
	this.ExitMapEvent = null;
	var hObj = null;
	var ptPos = null;
	var pGeomertry = null;
	this.InitMapEvent = function (pMapBase)
	{
		if (pGeomertry)
		{
			pGeomertry.Editable(true);
		}
		var fldDlg = null;
		hObj = pMapBase.getHPackage();
		var Values = new Array;
		var pMouseDown = function (tEvent)
		{
			var pActiveLayer = pMapCont.getActive();
			var pNow = new Date;
			if (pActiveLayer == null)
			{
				return false;
			}
			var pLayer = pActiveLayer.getLayer();
			if (pLayer == null)
			{
				return false;
			}
			if (pLayer.ExecuteUpdate == null)
			{
				return false;
			}
			var nFeatType = pLayer.getFeatureType();
			ptPos = pMapBase.getCursorPosition(tEvent);
			if (tEvent.button != 0)
			{
				return false;
			}
			var mapPt = pMapBase.ToMapPoint(ptPos.X, ptPos.Y);
			var cpt1 = pMapBase.ToMapPoint(ptPos.X - 3, ptPos.Y - 3);
			var cpt2 = pMapBase.ToMapPoint(ptPos.X + 3, ptPos.Y + 3);
			var expr = "RC( " + cpt1.X + " " + cpt1.Y + "," + cpt2.X + " " + cpt2.Y + " )";
			if (fldDlg != null)
			{
				if (fldDlg.bOpen == true)
				{
					return false;
				}
			}
			fldDlg = new AttributeDialog(pMapBase.getHPackage().ownerDocument.body, pMapBase, ptPos.X + 10, ptPos.Y + 10);
			fldDlg.Open(pLayer, "", null, new Array);
			pLayer.ExecuteQuery(expr, true, function (pRequest)
			{
				var pDoc = pRequest.responseXML;
				var pNodes = pDoc.documentElement.getElementsByTagName("Feature");
				var cnt = pNodes.length;
				if (cnt > 0)
				{
					var pFeature = pNodes.item(0);
					var pFlds = GetXMLChildNode(pFeature, "Values").childNodes;
					var cnt = 0;
					for (var j = 0; j < pFlds.length; j++)
					{
						if (pFlds.item(j).nodeType == 1)
						{
							var pFld = pFlds.item(j);
							if (pFld.firstChild && DeviceTest() == "MSIE")
							{
								Values[j] = pFld.firstChild.nodeValue;
							}
							if (DeviceTest() != "MSIE")
							{
								Values[cnt] = pFld.childNodes[0].nodeValue;
								cnt++;
							}
						}
					}
					var pGeoms = pFeature.getElementsByTagName("Geometry");
					if (pGeoms == null || pGeoms.length <= 0)
					{
						return;
					}
					var pNow1 = new Date;
					pGeomertry = ImportGeometryXML(pMapBase, pGeoms.item(0));
					pGeomertry.putLineColor("#FFFF00");
					pGeomertry.Editable(true);
					fldDlg.Close();
					fldDlg.Open(pLayer, pNodes[0].getAttribute("ID"), pGeomertry, Values);
					var pNow2 = new Date;
				} else
				{
					fldDlg.Close();
				}
			}, function ()
			{
			});
		};
		this.ExitMapEvent = function ()
		{
			if (pGeomertry)
			{
				pGeomertry.Editable(false);
			}
			DetachEvent(hObj, "click", pMouseDown, false);
		};
		AttachEvent(hObj, "click", pMouseDown, false);
	};
};

var mobile = CheckDevice();
if (!mobile)
{
	var EditTool = function(parentNode, pMapBase)
	{
		var mNode = document.createElement("div");
		var draw;
		var edit;
		var pthat = this;
		pthat.activechecked = "unactive";
		var currentLayer;
		var currentTemplate;
		var currentGraphics = [];
		var pLyrs = pMapBase.getLayers();
		var selected_Index;
		var undoManager;
		
		//加入新的自訂方法 (開始)
		this.getSelected_Index = function()
		{
			return selected_Index;
		};
		//加入新的自訂方法 (結束)
		
		mNode.id = "Editmenu";
		mNode.className = "toolbar";
		mNode.style.height = (document.body.clientHeight - headerHeight) + "px";
		parentNode.appendChild(mNode);
		
		
		var mNode_undoImg = document.createElement("img");
		mNode_undoImg.src = "images/PC_OtherTool/Undo.png";
		mNode_undoImg.style.position = "absolute";
		mNode_undoImg.style.left = "20px";
		mNode_undoImg.style.bottom = "5px";
		mNode_undoImg.style.height = "25px";
		mNode_undoImg.style.width = "25px";
		mNode.appendChild(mNode_undoImg);
	
		AttachEvent(mNode_undoImg, "click", function ()
		{
			undoManager.undo();
		});
		
		var mNode_redoImg = document.createElement("img");
		mNode_redoImg.src = "images/PC_OtherTool/Redo.png";
		mNode_redoImg.style.position = "absolute";
		mNode_redoImg.style.left = "55px";
		mNode_redoImg.style.bottom = "5px";
		mNode_redoImg.style.height = "25px";
		mNode_redoImg.style.width = "25px";
		mNode.appendChild(mNode_redoImg);
		
		AttachEvent(mNode_redoImg, "click", function ()
		{
			undoManager.redo();
		});
		
		var mNode_hrNode = document.createElement("hr");
		mNode_hrNode.style.position = "absolute";
		mNode_hrNode.style.bottom = "30px";
		mNode_hrNode.style.width = "100%";
		mNode.appendChild(mNode_hrNode);
		
		var mNode_title = document.createElement("div");
		mNode_title.className = "toolbartitle";
		var mNode_title_h2 = document.createElement("h2");
		mNode_title_h2.innerHTML = "Edit";
		var mNode_title_bkimg = document.createElement("img");
		mNode_title_bkimg.src = "images/right-arrow-of-straight-lines.png";
		AttachEvent(mNode_title_bkimg, "click", function ()
		{
			pthat.ExitMapEvent(true);
			mNode.style.width = "0px";
			FindXMLNodeById(document, "Coordinate").style.zIndex = "32767";
		});
		
		mNode_title.appendChild(mNode_title_h2);
		mNode_title.appendChild(mNode_title_bkimg);
		
		mNode.appendChild(mNode_title);
		
		var pNode = document.createElement("div");
		pNode.style.width = "100%";
		pNode.style.overflow = "auto";
		pNode.style.height = (document.body.clientHeight - headerHeight - 90) + "px";
		mNode.appendChild(pNode);
		
		var pEdit_Select_title = document.createElement("label");
		pEdit_Select_title.style.position = "absolute";
		pEdit_Select_title.style.marginTop = "10px";
		pEdit_Select_title.style.left = "10px";
		pEdit_Select_title.fontSize = "12px";
		pEdit_Select_title.innerHTML = "Select Target Layer:";
		pNode.appendChild(pEdit_Select_title);
		
		var pEdit_Select = document.createElement("select");
		pEdit_Select.style.position = "absolute";
		pEdit_Select.style.marginTop = "30px";
		pEdit_Select.style.left = "10px";
		pEdit_Select.style.width = "260px";
		pNode.appendChild(pEdit_Select);
		
		var layers;
			
		pEdit_Select.onchange = function()
		{
			selected_Index = pEdit_Select.selectedIndex;
			layers = pEdit_Select.options[selected_Index].layer;
			pthat.ExitMapEvent(true);
			pthat.ActiveMapEvent();
		};
		
		for (var i = 0 ; i < pLyrs.length ; i++)
		{
			if (pLyrs[i] instanceof MapLayer)
			{
				layers = pLyrs[i].getLayers();
				for (var j = 0 ; j < layers.length ; j++)
				{
					var opt = new Option(layers[j].getTitle());
					opt.layer = layers;
					pEdit_Select.options.add(opt);
				}
			}
		}
		
		selected_Index = pEdit_Select.selectedIndex;
		if (selected_Index >= 0)
			layers = pEdit_Select.options[selected_Index].layer;
		
		var pEdit_Result = document.createElement("div");
		pEdit_Result.style.position = "absolute";
		pEdit_Result.style.marginTop = "60px";
		pEdit_Result.style.left = "10px";
		pEdit_Result.style.width = "95%";
		pEdit_Result.style.height = (document.body.clientHeight - headerHeight - 150) + "px";
		pNode.appendChild(pEdit_Result);
		pEdit_Result.style.overflow = "auto";
		
		var fldDlg;
		
		var onDrawEnd = function(e)
		{
			var dialogPos;
			var graphic = new sg.Graphic;
			graphic.geometry = e.geometry;
			if (e.geometry instanceof sg.geometry.Polygon || e.geometry instanceof sg.geometry.Extent)
			{
				graphic.symbol = new sg.symbols.SimpleFillSymbol;
				graphic.symbol.outline.setWidth(3);
			}
			else if (e.geometry instanceof sg.geometry.LineString)
			{
				graphic.symbol = (new sg.symbols.SimpleLineSymbol).setColor(new sg.Color(128, 255, 128, 1));
				graphic.symbol.setWidth(4);
			}
			else if (e.geometry instanceof sg.geometry.Point || e.geometry instanceof sg.geometry.MultiPoint)
			{
				var symbol = (new sg.symbols.SimpleMarkerSymbol).setStyle(sg.symbols.SimpleMarkerSymbol.STYLE_SQUARE).setSize(16).setOutline(new sg.symbols.SimpleLineSymbol);
				graphic.symbol = symbol;
			}
		
			pthat.mapbase.drawingGraphicsLayer.add(graphic);
			currentGraphics.push(graphic);
			
			fldDlg = new sg.AttributeInspector(pthat.mapbase.getHPackage().ownerDocument.body, pthat.mapbase, pthat);
			if (fldDlg != null)
			{
				var deValue = {};
				if (currentTemplate.field)
				{
					deValue[currentTemplate.field.value] = currentTemplate.symbol.value;
				}
				function ReActivate()
				{
					var featureType = currentLayer.getFeatureType();
					var set = {showToolTips: true};
					switch (featureType)
					{
						case MapLayer.enumFeatureType.Point:
							gpanTool.ExitDbClickEvent();
							draw.setTooltipContent("Click to add point/vertex. Double-click to finish.");
							draw.activate(sg.Draw.POINT, set);
							break;
						case MapLayer.enumFeatureType.LineString:
							gpanTool.ExitDbClickEvent();
							draw.setTooltipContent("Click to add point/vertex. Double-click to finish.");
							draw.activate(sg.Draw.LINESTRING, set);
							break;
						case MapLayer.enumFeatureType.Polygon:
							gpanTool.ExitDbClickEvent();
							draw.setTooltipContent("Click to add point/vertex. Double-click to finish.");
							draw.activate(sg.Draw.POLYGON, set);
							break;
						default:
							break;
					}
				}
				fldDlg.on("update", ReActivate);
				fldDlg.on("delete", ReActivate);
				fldDlg.on("cancel", ReActivate);
				
				fldDlg.Open(currentLayer, "", graphic, deValue, undoManager);
			}
			draw.deactivate();
		};
		
		var onSelectionChanged = function (e)
		{
			if (!e)
			{
				draw.deactivate();
				gpanTool.InitMapEvent(pMapBase);
				return;
			}
			var layer = e.layer;
			currentLayer = e.layer;
			currentTemplate = e;
			var featureType = layer.getFeatureType();
			var set = {showToolTips: true};
			if (pthat.mapbase.drawingGraphicsLayer)
			{
				switch (featureType)
				{
					case MapLayer.enumFeatureType.Point:
						gpanTool.ExitDbClickEvent();
						draw.setTooltipContent("Click to add point/vertex. Double-click to finish.");
						draw.activate(sg.Draw.POINT, set);
						break;
					case MapLayer.enumFeatureType.LineString:
						gpanTool.ExitDbClickEvent();
						draw.setTooltipContent("Click to add point/vertex. Double-click to finish.");
						draw.activate(sg.Draw.LINESTRING, set);
						break;
					case MapLayer.enumFeatureType.Polygon:
						gpanTool.ExitDbClickEvent();
						draw.setTooltipContent("Click to add point/vertex. Double-click to finish.");
						draw.activate(sg.Draw.POLYGON, set);
						break;
					default:
						break;
				}
			}
		};
		
		var CreateLegendItem = function (label, src)
		{
			var legendContent = document.createElement("div");
			sg.addClass(legendContent, "legend-item");
			legendContent.title = label;
			var img = document.createElement("img");
			sg.addClass(img, "legend-image");
			img.src = src;
			legendContent.appendChild(img);
			if (label)
			{
				var legendLabel = document.createElement("div");
				sg.addClass(legendLabel, "legend-label");
				legendLabel.innerHTML = label;
				legendContent.appendChild(legendLabel);
			}
			var tooltip = document.createElement("div");
			tooltip.innerHTML = label;
			sg.addClass(tooltip, "sgTooltip");
			AttachEvent(legendContent, "mouseenter", function (e)
			{
				document.body.appendChild(tooltip);
				tooltip.style.visibility = "hidden";
				var rect = legendContent.getBoundingClientRect();
				tooltip.style.left = (rect.left + rect.right) / 2 - tooltip.clientWidth / 2 + "px";
				tooltip.style.top = rect.bottom + "px";
				tooltip.style.visibility = "visible";
			});
			AttachEvent(legendContent, "mouseleave", function (event)
			{
				document.body.removeChild(tooltip);
			});
			return { label: label, src: src, node: legendContent };
		};
		
		var CreateLayerLegend = function (layers, srcNode, tp)
		{
			var items = [];
			for (var l = 0 ; l < layers.length; l++)
			{
				var tLayer = layers[l];
				if (!tLayer.getName)
					continue;
				var featureType = tLayer.getFeatureType();
				var symbols;
				symbols = tLayer.getUniqueSymbols();
				
				if (symbols && selected_Index == l)
				{
					for (var s = 0 ; s < symbols.symbols.length ; s++)
					{
						var legendItem;
						if (symbols.defaultSymbol)
							legendItem = CreateLegendItem(symbols.symbols[s].label, tLayer.getResource(s + 1));
						else
							legendItem = CreateLegendItem(symbols.symbols[s].label, tLayer.getResource(s));
						
						legendItem.layer = tLayer;
						legendItem.value = symbols.symbols[s].value;
						items.push(legendItem);
						srcNode.appendChild(legendItem.node); 
						(function ()
						{
							var i = s;
							var sItem = legendItem;
							AttachEvent(legendItem.node, "click", function ()
							{
								tp.onSelectionChanged({ layer: layers[selected_Index], field: symbols.field, symbol: symbols.symbols[i], item: sItem, featureType: featureType });
							}, false);
						})();
					}
					return { items: items};
				}
				else if (tLayer.getResource && selected_Index == l)
				{
					var legendItem = CreateLegendItem(null, tLayer.getResource());
					var tarlayer = tLayer;
					(function ()
					{
						var sItem = legendItem;
						AttachEvent(legendItem.node, "click", function ()
						{
							tp.onSelectionChanged({ item: sItem, layer: tarlayer });
						}, false);
					})();
					srcNode.appendChild(legendItem.node);
					items.push(legendItem);
				}
			}
			return { items: items };
		};
		
		sg.controls.Edit_TemplatePicker = sg.controls.ControlBase.extend(
		{
			initialize : function (param, srcNode)
			{
				sg.controls.ControlBase.prototype.initialize.apply(this, arguments);
				var items;
				var that = this;
				sg.addClass(this.node, "template-picker");
				this.node.innerHTML = "No Template";
				
				if (param)
					if (param.layers)
					{
						this.node.innerHTML = "";
						items = CreateLayerLegend(param.layers, this.node, this).items;
					}
				
				this.onSelectionChanged = function (e)
				{
					pthat.activechecked = "active";
					pthat.EditFeatureTool.ExitMapEvent();
					if(fldDlg)
						fldDlg.Close("item");
					if (items)
					{
						for (var i = 0; i < items.length ; i++)
						{
							sg.addClass(items[i].node, "normal");
							sg.removeClass(items[i].node, "selected");
						}
						if (this.selectedTemplate && e.item.node == this.selectedTemplate.item.node)
						{
							this.selectedTemplate = null;
							pthat.EditFeatureTool.InitMapEvent(pMapBase);
						}
						else
						{
							this.selectedTemplate = e;
							sg.toggleClass(e.item.node, "selected");
						}
					}
					this.trigger("select", this.selectedTemplate);
				};
			},
			getSelected: function ()
			{
				var that = this;
				return that.selectedTemplate ? that.selectedTemplate : null;
			},
			events: ["select"]
		});
		
		var GetResource = function ()
		{
			pthat.mapbase = pMapBase;
			if (!edit)
				edit = new sg.Edit(pMapBase);
			if (!draw)
			{
				draw = new sg.Draw(pMapBase);
				draw.on("draw-end", onDrawEnd);
			}
			pthat.templatePicker = new sg.controls.Edit_TemplatePicker({ layers: layers, onSelectionChanged: onSelectionChanged }, pEdit_Result);
			pthat.templatePicker.on("select", onSelectionChanged);
			var select_index = pEdit_Select.selectedIndex;
			pthat.EditFeatureTool = new sg.EditFeatureTool(pEdit_Select.options[select_index].layer[select_index], undoManager, pthat);
			pthat.EditFeatureTool.InitMapEvent(pMapBase);
		};
		
		this.ActiveMapEvent = function ()
		{
			pthat.activechecked = "active";
			gpanTool.ExitDbClickEvent();
			if (ft)
				ft.ExitMapEvent(pMapBase);//Close Map tool
			undoManager = new sg.UndoManager(); //Create Undo
			GetResource();
		};
		
		this.ExitMapEvent = function (bClearAll)
		{
			if (draw && this.mapbase.drawingGraphicsLayer)
			{
				draw.deactivate();
				gpanTool.InitMapEvent(pMapBase);
			}
	
			if (bClearAll == true)
			{
				for (var i = 0; i < currentGraphics.length; i++)
				{
					this.mapbase.drawingGraphicsLayer.remove(currentGraphics[i]);
				}
				if (pthat.EditFeatureTool)
					pthat.EditFeatureTool.ExitMapEvent();
				if (ft)
					ft.InitMapEvent(pMapBase);
				pMapBase.infoWindow.hide();
				undoManager = null; //Clear undoManager
				currentGraphics = [];
				pEdit_Result.innerHTML = "";
				pthat.activechecked = "unactive";
			}
		};
	};
}
else
{
	var EditTool = function(parentNode, pMapBase)
	{
		var mNode = document.createElement("div");
		var draw;
		var edit;
		var pthat = this;
		pthat.activechecked = "unactive";
		var currentLayer;
		var currentTemplate;
		var currentGraphics = [];
		var pLyrs = pMapBase.getLayers();
		var selected_Index;
		var undoManager;
			
		mNode.id = "Editmenu";
		mNode.className = "toolbar";
		
        mNode.style.height = "70%";
        mNode.style.width = "70%";
        mNode.style.position = "absolute";
        mNode.style.top = "20%";
        mNode.style.left ="15%";
        mNode.style.display = "none";
		parentNode.appendChild(mNode);
		
		var mNode_editImg = document.createElement("img");
		mNode_editImg.src = "images/Mobile_MainTool/Edit.png";
		mNode_editImg.style.position = "absolute";
		mNode_editImg.style.left = "2%";
		mNode_editImg.style.bottom = "1%";
		mNode_editImg.style.height = "10%";
		mNode.appendChild(mNode_editImg);
		AttachEvent(mNode_editImg, "click", function ()
		{
			if (pthat.selectedTemplate)
				pthat.selectedTemplate.item.node.click();
			
            FindXMLNodeById(document, mNode.id).style.display = "none";
		});
		
		var mNode_redoImg = document.createElement("img");
		mNode_redoImg.src = "images/Mobile_OtherTool/Redo30.png";
		mNode_redoImg.style.position = "absolute";
		mNode_redoImg.style.left = "14%";
		mNode_redoImg.style.bottom = "1%";
		mNode_redoImg.style.height = "4%";
		mNode_redoImg.style.width = "10%";
		mNode_redoImg.style.display = "none";
		mNode.appendChild(mNode_redoImg);
		
		AttachEvent(mNode_redoImg, "click", function ()
		{
			undoManager.undo();
		});
		
		var mNode_undoImg = document.createElement("img");
		mNode_undoImg.src = "images/Mobile_OtherTool/Undo30.png";
		mNode_undoImg.style.position = "absolute";
		mNode_undoImg.style.left = "26%";
		mNode_undoImg.style.bottom = "1%";
		mNode_undoImg.style.height = "4%";
		mNode_undoImg.style.width = "10%";
		mNode_undoImg.style.display = "none";
		mNode.appendChild(mNode_undoImg);
	
		AttachEvent(mNode_undoImg, "click", function ()
		{
			undoManager.redo();
		});
		
		var mNode_hrNode = document.createElement("hr");
		mNode_hrNode.style.position = "absolute";
		mNode_hrNode.style.bottom = "11%";
		mNode_hrNode.style.width = "100%";
		mNode.appendChild(mNode_hrNode);
		
		var mNode_title = document.createElement("div");
		mNode_title.className = "toolbartitle";
		var mNode_title_h2 = document.createElement("h2");
		mNode_title_h2.innerHTML = "新增編輯";
		var mNode_title_bkimg = document.createElement("img");
		mNode_title_bkimg.src = "images/right-arrow-of-straight-lines.png";
		AttachEvent(mNode_title_bkimg, "click", function ()
		{
			pthat.ExitMapEvent(true);
			//mNode.style.width = "0px";
            mNode.style.display = 'none';
		});
		
		mNode_title.appendChild(mNode_title_h2);
		mNode_title.appendChild(mNode_title_bkimg);
		
		mNode.appendChild(mNode_title);
		
		var pNode = document.createElement("div");
		pNode.style.width = "100%";
		pNode.style.overflow = "auto";
		pNode.style.height = ((document.body.clientHeight * 0.6) - (document.body.clientHeight * 0.1) - (document.body.clientHeight * 0.11)) + "px";
		mNode.appendChild(pNode);
		
		var pEdit_Select_title = document.createElement("label");
		pEdit_Select_title.style.position = "absolute";
		pEdit_Select_title.style.marginTop = "2%";
		pEdit_Select_title.style.left = "10px";
		pEdit_Select_title.style.fontSize = "35pt";
		pEdit_Select_title.innerHTML = "選擇圖層:";
		pNode.appendChild(pEdit_Select_title);
		
		var pEdit_Select = document.createElement("select");
		pEdit_Select.style.position = "absolute";
		pEdit_Select.style.marginTop = "13%";
		pEdit_Select.style.fontSize = "35pt";
		pEdit_Select.style.left = "10px";
		pEdit_Select.style.width = "90%";
		pNode.appendChild(pEdit_Select);
		
		var layers;
			
		pEdit_Select.onchange = function()
		{
			selected_Index = pEdit_Select.selectedIndex;
			layers = pEdit_Select.options[selected_Index].layer;
			pthat.ExitMapEvent(true);
			pthat.ActiveMapEvent();
		};
		
		for (var i = 0 ; i < pLyrs.length ; i++)
		{
			if (pLyrs[i] instanceof MapLayer)
			{
				layers = pLyrs[i].getLayers();
				for (var j = 0 ; j < layers.length ; j++)
				{
					var opt = new Option(layers[j].getTitle());
					opt.layer = layers;
					pEdit_Select.options.add(opt);
				}
			}
		}
		
		selected_Index = pEdit_Select.selectedIndex;
		if (selected_Index >= 0)
			layers = pEdit_Select.options[selected_Index].layer;
		
		var pEdit_Result = document.createElement("div");
		pEdit_Result.style.position = "absolute";
		pEdit_Result.style.marginTop = "26%"; //mobile
		pEdit_Result.style.left = "10px";
		pEdit_Result.style.width = "100%";
		pEdit_Result.style.height = ((document.body.clientHeight * 0.6) - (document.body.clientHeight * 0.1) - (document.body.clientHeight * 0.11) - (document.body.clientHeight * 0.11)) + "px";
		pNode.appendChild(pEdit_Result);
		pEdit_Result.style.overflow = "auto";
		
		var fldDlg;
		var onDrawEnd = function(e)
		{
			var dialogPos;
			var graphic = new sg.Graphic;
			graphic.geometry = e.geometry;
			if (e.geometry instanceof sg.geometry.Polygon || e.geometry instanceof sg.geometry.Extent)
			{
				graphic.symbol = new sg.symbols.SimpleFillSymbol;
				graphic.symbol.outline.setWidth(3);
			}
			else if (e.geometry instanceof sg.geometry.LineString)
			{
				graphic.symbol = (new sg.symbols.SimpleLineSymbol).setColor(new sg.Color(128, 255, 128, 1));
				graphic.symbol.setWidth(4);
			}
			else if (e.geometry instanceof sg.geometry.Point || e.geometry instanceof sg.geometry.MultiPoint)
			{
				var symbol = (new sg.symbols.SimpleMarkerSymbol).setStyle(sg.symbols.SimpleMarkerSymbol.STYLE_SQUARE).setSize(16).setOutline(new sg.symbols.SimpleLineSymbol);
				graphic.symbol = symbol;
			}
		
			pthat.mapbase.drawingGraphicsLayer.add(graphic);
			currentGraphics.push(graphic);
			
			fldDlg = new sg.AttributeInspector(pthat.mapbase.getHPackage().ownerDocument.body, pthat.mapbase, pthat);
			if (fldDlg != null)
			{
				var deValue = {};
				if (currentTemplate.field)
				{
					deValue[currentTemplate.field.value] = currentTemplate.symbol.value;
				}
				function ReActivate()
				{
					var featureType = currentLayer.getFeatureType();
					switch (featureType)
					{
						case MapLayer.enumFeatureType.Point:
							draw.activate(sg.Draw.POINT);
							break;
						case MapLayer.enumFeatureType.LineString:
							draw.activate(sg.Draw.LINESTRING);
							break;
						case MapLayer.enumFeatureType.Polygon:
							draw.activate(sg.Draw.POLYGON);
							break;
						default:
							break;
					}
				}
				fldDlg.on("update", ReActivate);
				fldDlg.on("delete", ReActivate);
				fldDlg.on("cancel", ReActivate);
				
				fldDlg.Open(currentLayer, "", graphic, deValue, undoManager);
			}
			draw.deactivate();
		};
		
		var onSelectionChanged = function (e)
		{
			if (!e)
			{
				draw.deactivate();
				return;
			}
			var layer = e.layer;
			currentLayer = e.layer;
			currentTemplate = e;
			var featureType = layer.getFeatureType();
			if (pthat.mapbase.drawingGraphicsLayer)
			{
				switch (featureType)
				{
					case MapLayer.enumFeatureType.Point:
						draw.activate(sg.Draw.POINT);
						break;
					case MapLayer.enumFeatureType.LineString:
						draw.activate(sg.Draw.LINESTRING);
						break;
					case MapLayer.enumFeatureType.Polygon:
						draw.activate(sg.Draw.POLYGON);
						break;
					default:
						break;
				}
			}
		};
		
		var CreateLegendItem = function (label, src)
		{
			var legendContent = document.createElement("div");
			sg.addClass(legendContent, "legend-item");
			legendContent.title = label;
			var img = document.createElement("img");
			sg.addClass(img, "legend-image");
			img.src = src;
			img.style.minWidth = (document.body.clientWidth * 0.16) + "px";
			img.style.maxWidth = (document.body.clientWidth * 0.4) + "px";
			img.style.minHeight = (pNode.clientHeight * 0.05) + "px";
			legendContent.appendChild(img);
			if (label)
			{
				var legendLabel = document.createElement("div");
				sg.addClass(legendLabel, "legend-label");
				legendLabel.innerHTML = label;
				legendContent.appendChild(legendLabel);
			}
			var tooltip = document.createElement("div");
			tooltip.innerHTML = label;
			sg.addClass(tooltip, "sgTooltip");
			return { label: label, src: src, node: legendContent };
		};
		
		var CreateLayerLegend = function (layers, srcNode, tp)
		{
			var items = [];
			for (var l = 0 ; l < layers.length; l++)
			{
				var tLayer = layers[l];
				if (!tLayer.getName)
					continue;
				
				var featureType = tLayer.getFeatureType();
				var symbols;
				symbols = tLayer.getUniqueSymbols();
				
				if (symbols && selected_Index == l)
				{
					for (var s = 0 ; s < symbols.symbols.length ; s++)
					{
						var legendItem;
						if (symbols.defaultSymbol)
							legendItem = CreateLegendItem(symbols.symbols[s].label, tLayer.getResource(s + 1));
						else
							legendItem = CreateLegendItem(symbols.symbols[s].label, tLayer.getResource(s));
						
						legendItem.layer = tLayer;
						legendItem.value = symbols.symbols[s].value;
						items.push(legendItem);
						srcNode.appendChild(legendItem.node); 
						(function ()
						{
							var i = s;
							var sItem = legendItem;
							AttachEvent(legendItem.node, "click", function ()
							{
								tp.onSelectionChanged({ layer: layers[selected_Index], field: symbols.field, symbol: symbols.symbols[i], item: sItem, featureType: featureType });
							}, false);
						})();
					}
					return { items: items};
				}
				else if (tLayer.getResource && selected_Index == l)
				{
					var legendItem = CreateLegendItem(null, tLayer.getResource());
					var tarlayer = tLayer;
					(function ()
					{
						var sItem = legendItem;
						AttachEvent(legendItem.node, "click", function ()
						{
							tp.onSelectionChanged({ item: sItem, layer: tarlayer });
						}, false);
					})();
					srcNode.appendChild(legendItem.node);
					items.push(legendItem);
				}
			}
			return { items: items };
		};
		
		sg.controls.newTemplatePicker = sg.controls.ControlBase.extend(
		{
			initialize : function (param, srcNode)
			{
				sg.controls.ControlBase.prototype.initialize.apply(this, arguments);
				var items;
				var that = this;
				sg.addClass(this.node, "template-picker");
				this.node.innerHTML = "No Template";
				
				if (param && param.layers)
                {
					this.node.innerHTML = "";
					items = CreateLayerLegend(param.layers, this.node, this).items;
				}
                
				this.onSelectionChanged = function (e)
				{
					pthat.activechecked = "active";
					pthat.EditFeatureTool.ExitMapEvent();
					if(fldDlg)
						fldDlg.Close("item");
					if (items)
					{
						for (var i = 0; i < items.length; i++)
						{
							sg.addClass(items[i].node, "normal");
							sg.removeClass(items[i].node, "selected");
						}
						if (this.selectedTemplate && e.item.node == this.selectedTemplate.item.node)
						{
							this.selectedTemplate = null;
							pthat.selectedTemplate = null;
							document.getElementById("showdiv").innerHTML = "編輯";
							pthat.EditFeatureTool.InitMapEvent(pMapBase);
						}
						else
						{
							document.getElementById("showdiv").innerHTML = "新增";
							//mNode.style.width = "0px";
                            mNode.style.display = 'none';
							this.selectedTemplate = e;
							pthat.selectedTemplate = e;
							sg.toggleClass(e.item.node, "selected");
						}
					}
					this.trigger("select", this.selectedTemplate);
				};
			},
			getSelected: function ()
			{
				var that = this;
				return that.selectedTemplate ? that.selectedTemplate : null;
			},
			events: ["select"]
		});
		
		var GetResource = function ()
		{
			pthat.mapbase = pMapBase;
			if (!edit)
				edit = new sg.Edit(pMapBase);
			if (!draw)
			{
				draw = new sg.Draw(pMapBase);
				draw.on("draw-end", onDrawEnd);
			}
			pthat.templatePicker = new sg.controls.newTemplatePicker({ layers: layers, onSelectionChanged: onSelectionChanged }, pEdit_Result);
			pthat.templatePicker.on("select", onSelectionChanged);
			var select_index = pEdit_Select.selectedIndex;
			pthat.EditFeatureTool = new sg.EditFeatureTool(pEdit_Select.options[select_index].layer[select_index], undoManager, pthat);
			pthat.EditFeatureTool.InitMapEvent(pMapBase);
		};
		
		this.ActiveMapEvent = function ()
		{
			pthat.activechecked = "active";
			if (ft)
				ft.ExitMapEvent(pMapBase); //Close Map tool
			undoManager = new sg.UndoManager(); //Create Undo
			GetResource();
			document.getElementById("showdiv").innerHTML = "編輯";
			document.getElementById("showdiv").style.display = "block";
		};
		
		this.ExitMapEvent = function (bClearAll)
		{
			if (draw && this.mapbase.drawingGraphicsLayer)
			{
				draw.deactivate();
			}
	
			if (bClearAll == true)
			{
				for (var i = 0; i < currentGraphics.length; i++)
				{
					this.mapbase.drawingGraphicsLayer.remove(currentGraphics[i]);
				}
				if (pthat.EditFeatureTool)
					pthat.EditFeatureTool.ExitMapEvent();
				if (ft)
					ft.InitMapEvent(pMapBase);
				pMapBase.infoWindow.hide();
				undoManager = null; //Clear undoManager
				currentGraphics = [];
				pEdit_Result.innerHTML = "";
				pthat.activechecked = "unactive";
				document.getElementById("showdiv").style.display = "none";
			}
		};
	}
}