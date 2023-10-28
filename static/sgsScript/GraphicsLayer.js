(function()
{
	var patterng = /\${[\w:]*}/g;
	sg.GraphicsLayer = sg.Layer.extend(
	{
		map_:null,
		surface_:null,
		svgContainer:null,
		lastScale:null,
		surface:null,
		graphics:null,
		mouseEventEnabled:true,
		renderer:null,
		infoTemplate:null,
		visible:true,
		initialize: function()
		{
			this.graphics = [];
			this.name = "Graphics Layer";
			this.title = "Graphics Layer";
			this.minScale = 0;
			this.maxScale = 0;
		},
		getNode: function()
		{
			return this.node;
		},
		templateReplace: function(g, template)
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
		},
		add: function(graphic)
		{
			var that = this;
			if (!(graphic instanceof sg.Graphic))
				return;
			graphic.layer = this;
			graphic.draw();
			this.graphics.push(graphic);
			this.trigger("graphic-add", graphic);
		},
		clear: function()
		{
			for (var i = 0 ; i < this.graphics.length ; i++)
			{
				var graphic = this.graphics[i];
				if (!(graphic instanceof sg.Graphic))
					return;
				for (var j = 0 ; j < graphic.shapes.length ; j++)
					graphic.shapes[j].remove();
				graphic.shapes = [];
			}
			this.graphics = [];
			this.trigger("graphic-clear", graphic);
		},
		setInfoTemplate: function(temp)
		{
			if (temp instanceof sg.InfoTemplate)
				this.infoTemplate = temp;
		},
		disableMouseEvents: function()
		{
			this.mouseEventEnabled = false;
		},
		enableMouseEvents: function()
		{
			this.mouseEventEnabled = true;
		},
		getMap: function()
		{
			return this.map_;
		},
		isVisibleAtScale: function(p)
		{
			var minPass = this.minScale === 0 || p > this.minScale;
			var maxPass = this.maxScale === 0 || p < this.maxScale;
			return minPass && maxPass;
		},
		setMaxScale: function(p)
		{
			if (typeof p != "number")
				return;
			this.maxScale = p;
			if (this.map_)
			{
				var currScale = this.map_.getScale();
				if (!this.isVisibleAtScale(currScale))
					this.node.style.visibility = "hidden";
			}
		},
		setMaxScale: function(p)
		{
			if (typeof p != "number")
				return;
			this.maxScale = p;
			if (this.map_)
			{
				var currScale = this.map_.getScale();
				if (!this.isVisibleAtScale(currScale))
					this.node.style.visibility = "hidden";
			}
		},
		setMinScale: function(p)
		{
			if (typeof p != "number")
				return;
			this.minScale = p;
			if (this.map_)
			{
				var currScale = this.map_.getScale();
				if (!this.isVisibleAtScale(currScale))
					this.node.style.visibility = "hidden";
			}
		},
		setVisibility: function(visible)
		{
			if (typeof visible == "boolean")
			{
				if (this.node)
					this.node.style.visibility = visible ? "visible" : "hidden";
				this.visible = visible;
			}
		},
		setRenderer: function(renderer)
		{
			this.renderer = renderer;
			if (this.map_)
				this.redraw();
		},
		redraw:function()
		{
			for (var g = 0 ; g < this.graphics.length ; g++)
				this.graphics[g].draw();
		},
		remove:function(graphic)
		{
			if (!(graphic instanceof sg.Graphic))
				return;
			for (var i = 0 ; i < graphic.shapes.length ; i++)
				graphic.shapes[i].remove();
			graphic.shapes = [];
			var idx = this.graphics.indexOf(graphic);
			if (idx > -1)
				this.graphics.splice(idx, 1);
			this.trigger("graphic-remove", graphic);
		},
		UpdateElement:function()
		{
			var currScale = this.map_.getScale();
			if (currScale != this.lastScale)
				return;
			
			var pre = this.map_.FromMapPoint(this.lt_.X, this.lt_.Y);
			var tstr = "t" + Math.round(pre.X) + " " + Math.round(pre.Y);
			this.trans = pre;
			this.surface_.transform(tstr);
		},
		RebuildElement:function()
		{
			var currentScale = this.map_.getScale();
			var scaleChanged = currentScale != this.lastScale;
			if (!this.isVisibleAtScale(currentScale))
				this.setVisibility(false);
			
			if (!scaleChanged)
				return;
			
			this.lt_ = this.map_.ToMapPoint(0, 0);
			this.trans = new MapPoint(0, 0);
			this.lastScale = this.map_.getScale();
			if (this.visible)
				this.redraw();
		},
		Initialize:function(map)
		{
			var that = this;
			this.map_ = map;
			this.map = map;
			this.zoomStartEvt_ = this.map_.on("zoom-start", function()
			{
				that.node.style.visibility = "hidden";
			});
			this.zoomEndEvt_ = this.map_.on("zoom-end", function()
			{
				that.node.style.visibility = that.visible ? "" : "hidden";
			});
			var boxWidth = map.getClientWidth();
			var boxHeight = map.getClientHeight();
			var m_hObject = map.getHObject();
			this.surface = this.map_.gfxSurface_;
			this.surface_ = this.map_.gfxSurface_.group();
			if (this.map_.drawingGraphicsLayer)
				this.surface_.insertBefore(this.map_.drawingGraphicsLayer.surface_);
			this.node = this.surface_.element();
			this.lt_ = this.map_.ToMapPoint(0, 0);
			this.trans = new MapPoint(0, 0);
			this.lastScale = this.map_.getScale();
			this.redraw();
		},
		RemoveSelf:function()
		{
			if (this.zoomStartEvt_)
				this.zoomStartEvt_.remove();
			if (this.zoomEndEvt_)
				this.zoomEndEvt_.remove();
			sg.layers.Layer.prototype.RemoveSelf.call(this);
		},events:["graphic-add", "graphic-remove", "graphic-clear", "mouse-down", "mouse-move", "mouse-out", "mouse-over", "click", "touch-start", "touch-end", "touch-move", "dbl-click", "drag-start", "drag", "drag-end"]
	});
	sg.layers.GraphicsLayer = sg.GraphicsLayer;
})();