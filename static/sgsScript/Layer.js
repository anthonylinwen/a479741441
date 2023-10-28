sg.layers = {};
sg.Layer = sg.Class.extend(
{
	loadError: "",
	title: "",
	name: "",
	extent: null,
	node: null,
	maxScale: null,
	minScale: null,
	map: null,
	visible: true,
	opacity: 1,
	initialize: function()
	{
		this.node = document.createElement("div");
		this.node.setAttribute("class", "sgContainer");
	}, 
	hide: function()
	{
		this.putVisible(false);
	},
	show: function()
	{
		this.putVisible(true);
	},
	getNode: function()
	{
		return this.node;
	},
	putTitle: function(title)
	{
		this.title = title;
	},
	getTitle: function()
	{
		return this.title;
	},
	putName: function(name)
	{
		this.name = name;
	},
	getVisible: function()
	{
		return this.visible;
	},
	setMaxScale: function(maxScale)
	{
		if (typeof maxScale != "number")
			return;
		this.maxScale = maxScale;
	},
	setMinScale: function(minScale)
	{
		if (typeof minScale != "number")
			return;
		this.minScale = minScale;
	},
	putVisible: function(newVal)
	{
		if (typeof newVal != "boolean")
			return;
		this.visible = newVal;
		if (this.node)
			this.node.style.visibility = newVal ? "" : "hidden";
	},
	setOpacity: function(opacity)
	{
		if (typeof opacity != "number")
			return;
		this.opacity = opacity;
		if (this.node)
		{
			this.node.style.opacity = opacity;
			this.node.style.filter = "alpha(opacity=" + 100 * opacity + ")";
		}
	},
	getName: function()
	{
		return this.name;
	},
	getMap: function()
	{
		return this.map;
	},
	RemoveSelf: function()
	{
		if (this.evts_)
		{
			this.evts_.forEach(function(evt)
			{
				evt.remove();
			});
		}
		if (this.node && this.node.parentNode)
			this.node.parentNode.removeChild(this.node);
		this.innerHTML = "";
		this.node = null;
	},
	UpdateElement: function()
	{
		return;
	},
	RebuildElement: function()
	{
		return;
	},
	Initialize: function(map)
	{
		this.map = map;
		this.hObj = map.getHObject();
		this.hObj.appendChild(this.node);
	},
	events:["load"]
});
sg.layers.Layer = sg.Layer;
sg.layers.LOD = sg.Class.extend({level: 0, levelValue: "", resolution: NaN, scale: NaN});
sg.layers.TileInfo = sg.Class.extend(
{
	dpi: 96,
	format: "",
	height: 256,
	width: 256,
	lods: null,
	origin: null,
	spatialReference: null,
	initialize:function(param)
	{
		this.lods = [];
		this.origin = new sg.geometry.Point(0, 0);
		if (!param)
			return;
		for (p in param)
			this[p] = param[p];
	}
});
sg.layers.MapImage = sg.layers.MapImage || function()
{
	var mi = sg.Class.extend(
	{
		extent: null,
		width: null,
		height: null,
		opacity: 1,
		href: null,
		node: null,
		initialize: function(param)
		{
			if (param)
			{
				if (param.extent instanceof sg.geometry.Extent)
					this.extent = param.extent;
				if (typeof param.width == "number")
					this.width = param.width;
				if (typeof param.height == "number")
					this.height = param.height;
				if (typeof param.href == "string")
					this.href = param.href;
				if (typeof param.opacity == "number")
					this.opacity = param.opacity;
			}
		}
	});
	return mi;
}();