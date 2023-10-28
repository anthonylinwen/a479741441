sg.renderers = sg.renderers || function()
{
	var r = {};
	r.Renderer = sg.Class.extend(
	{
		defaultSymbol: null,
		getSymbol: null,
		toJson: null,
		sizeInfo: null,
		colorInfo: null,
		rotationInfo: null,
		opacityInfo: null,
		getOpacity: function(graphic)
		{
			if (this.opacityInfo)
			{
				var attrs = graphic.attributes;
				if (attrs)
				{
					var value = parseFloat(attrs[this.opacityInfo.field]);
					var ratio = (value - this.opacityInfo.minValue) / (this.opacityInfo.maxValue - this.opacityInfo.minValue);
					var colorCount = this.opacityInfo.opacityValues.length;
					if (colorCount >= 2)
					{
						if (ratio <= 0)
							return this.opacityInfo.opacityValues[0];
						else if (ratio >= 1)
							return this.opacityInfo.opacityValues[this.opacityInfo.opacityValues.length - 1];
					}
					var interval = 1 / (colorCount - 1);
					var t1 = ratio / interval;
					var sidx = Math.floor(t1);
					var eidx = sidx + 1;
					var iRatio = t1 - sidx;
					var sa = this.opacityInfo.opacityValues[sidx];
					var ea = this.opacityInfo.opacityValues[eidx];
					
					if (typeof ea != "number")
						return this.opacityInfo.opacityValues[this.opacityInfo.opacityValues.length - 1];
					
					return sa + (ea - sa) * iRatio;
				}
			}
		},
		getColor: function(graphic)
		{
			if (this.colorInfo)
			{
				var attrs = graphic.attributes;
				if (attrs)
				{
					var value = parseFloat(attrs[this.colorInfo.field]);
					var ratio = (value - this.colorInfo.minValue) / (this.colorInfo.maxValue - this.colorInfo.minValue);
					
					var colorCount = this.colorInfo.colors.length;
					if (colorCount >= 2)
					{
						if (ratio <= 0)
						{
							var c1 = this.colorInfo.colors[0];
							return new sg.Color(c1.r, c1.g, c1.b);
						}
						else if (ratio >= 1)
						{
							var c2 = this.colorInfo.colors[this.colorInfo.colors.length - 1];
							return new sg.Color(c2.r, c2.g, c2.b);
						}
						var interval = 1 / (colorCount - 1);
						var t1 = ratio / interval;
						var sidx = Math.floor(t1);
						var eidx = sidx + 1;
						var iRatio = t1 - sidx;
						var sColor = this.colorInfo.colors[sidx];
						var eColor = this.colorInfo.colors[eidx];
						if (!eColor)
						{
							var lColor = this.colorInfo.colors[this.colorInfo.colors.length - 1];
							var iColor = new sg.Color(lColor.r, lColor.g, lColor.b);
							return iColor;
						}
						var r = sColor.r + (eColor.r - sColor.r) * iRatio;
						var g = sColor.g + (eColor.g - sColor.g) * iRatio;
						var b = sColor.b + (eColor.b - sColor.b) * iRatio;
						var a = sColor.a + (eColor.a - sColor.a) * iRatio;
						var iColor = new sg.Color(r, g, b);
						return iColor;
					}
				}
			}
		},
		getRotationAngle: function(graphic)
		{
			if (this.rotationInfo)
			{
				var attrs = graphic.attributes;
				if (attrs)
				{
					var value = parseFloat(attrs[this.rotationInfo.field]);
					var result;
					var type = this.rotationInfo.type;
					if (type == "geographic")
						result = 360 - value - 90;
					else if (type == "arithmetic")
						result = value;
					return result;
				}
			}
		},
		getSize: function(graphic)
		{
			if (this.sizeInfo)
			{
				var attrs = graphic.attributes;
				if (attrs)
				{
					var maxSize = this.sizeInfo.maxSize;
					var minSize = this.sizeInfo.minSize;
					var maxValue = this.sizeInfo.maxValue;
					var minValue = this.sizeInfo.minValue;
					var value = parseFloat(attrs[this.sizeInfo.field]);
					var size = null;
					
					if (value >= maxValue)
						size = maxSize;
					else if (value <= minValue)
						size = minSize;
					else
					{
						var ratio = (value - minValue) / (maxValue - minValue);
						size = minSize + (maxSize - minSize) * ratio;
					}
					return size;
				}
			}
		},
		setColorInfo: function(info)
		{
			if (info)
				this.colorInfo = info;
			return this;
		},
		setSizeInfo: function(info)
		{
			if (info)
				this.sizeInfo = info;
			return this;
		},
		setRotationInfo: function(info)
		{
			if (info)
				this.rotationInfo = info;
			return this;
		},
		setOpacityInfo: function(info)
		{
			if (info)
				this.opacityInfo = info;
			return this;
		},
		applyInfo_: function(symbol, graphic)
		{
			var infoColor = this.getColor(graphic);
			var infoSize = this.getSize(graphic);
			var infoRotationAngle = this.getRotationAngle(graphic);
			var infoOpacity = this.getOpacity(graphic);
			if (infoColor !== undefined)
				symbol.setColor(infoColor);
			
			if (infoSize !== undefined)
			{
				if (symbol instanceof sg.symbols.LineSymbol)
					symbol.setWidth(infoSize);
				else if (symbol instanceof sg.symbols.MarkerSymbol)
					symbol.setSize(infoSize);
			}
			if (infoRotationAngle !== undefined && symbol.setAngle)
				symbol.setAngle(infoRotationAngle);
			if (typeof infoOpacity == "number")
				symbol.color.a = infoOpacity;
		}
	});
	r.SimpleRenderer = r.Renderer.extend(
	{
		initialize: function(symbol)
		{
			if (!(symbol instanceof sg.symbols.Symbol))
				throw "Default Symbol must be provided";
			this.symbol = symbol;
		},
		getSymbol: function(graphic)
		{
			this.applyInfo_(this.symbol, graphic);
			return this.symbol;
		},
		toXml: function()
		{
			var xml = "<Renderer>" + "<Type>SimpleRenderer</Type>";
			if (this.symbol instanceof sg.symbols.Symbol && this.symbol.toXml)
				xml += this.symbol.toXml();
			xml += "</Renderer>";
		},
		symbol: null
	});
	r.UniqueValueRenderer = r.Renderer.extend(
	{
		attributeField: null,
		attributeField2: null,
		attributeField3: null,
		infos: null,
		initialize: function(defaultSymbol, attributeField, attributeField2, attributeField3, fieldDelimeter)
		{
			this.getSymbol = function(graphic)
			{
				var info = this.getUniqueValueInfo(graphic);
				var sym = info ? info.symbol : this.defaultSymbol;
				this.applyInfo_(sym, graphic);
				return sym;
			};
			
			this.infos = [];
			if (!(defaultSymbol instanceof sg.symbols.Symbol))
				throw "Default Symbol must be provided";
			
			this.defaultSymbol = defaultSymbol;
			var type1 = typeof attributeField;
			if (type1 != "string" && type1 != "function")
				throw "Attribute field must be provided";
			
			this.attributeField = attributeField;
			if (typeof attributeField2 != "string")
				this.attributeField2 = attributeField;
			if (typeof attributeField2 != "string")
				this.attributeField3 = attributeField;
		},
		getUniqueValueInfo:function(graphic)
		{
			for (var info = 0 ; info < this.infos.length ; info++)
			{
				if (this.infos[info].value == graphic.attributes[this.attributeField])
					return this.infos[info];
				if (this.attributeField2 && this.infos[info].value == graphic.attributes[this.attributeField2])
					return this.infos[info];
				if (this.attributeField3 && this.infos[info].value == graphic.attributes[this.attributeField3])
					return this.infos[info];
			}
		},
		addValue: function(value)
		{
			this.infos.push(value);
		},
		removeValue: function(value)
		{
			var idx = this.infos.indexOf(value);
			if (idx >= 0)
				this.infos.splice(idx, 1);
		},
		toXml: function()
		{
			var xml = "<Renderer>" + "<Type>UniqueValueRenderer</Type>" + "<FieldName>" + this.attributeField + "</FieldName>" + "<Label></Label>" + "<DefaultSymbol>" + this.defaultSymbol.toXml(true) + "</DefaultSymbol>" + "<DefaultLabel></DefaultLabel>" + "<Values>";
			
			if (this.defaultSymbol instanceof sg.symbols.Symbol && this.defaultSymbol.toXml)
				xml += this.defaultSymbol.toXml();
			
			var length = this.infos.length;
			for (var v = 0 ; v < length ; v++)
				xml += "<Value>" + "<Value>" + this.infos[v].value + "</Value>" + this.infos[v].symbol.toXml() + "</Value>";
			
			xml += "</Values>" + "</Renderer>";
			return xml;
		}
	});
	r.ClassBreaksRenderer = r.Renderer.extend(
	{
		attributeField: null,
		infos: null,
		initialize: function(defaultSymbol, attributeField)
		{
			this.getSymbol = function(graphic)
			{
				var sym;
				var length = this.infos.length;
				for (var info = 0 ; info < length ; info++)
				{
					var value;
					if (typeof this.attributeField == "function")
						value = this.attributeField.call(this, graphic);
					else
						value = parseFloat(graphic.attributes[this.attributeField]);
					
					if (this.infos[info].maxValue > value && this.infos[info].minValue <= value)
						sym = this.infos[info].symbol;
				}
				if (!sym)
					sym = this.defaultSymbol;
				this.applyInfo_(sym, graphic);
				return sym;
			};
			this.infos = [];
			
			if (!(defaultSymbol instanceof sg.symbols.Symbol))
				throw "Default Symbol must be provided";
			this.defaultSymbol = defaultSymbol;
			
			if (!attributeField)
				throw "Attribute field must be provided";
			this.attributeField = attributeField;
		},
		addBreak: function(brk)
		{
			this.infos.push(brk);
		},
		removeBreak: function(brk)
		{
			var idx = this.infos.indexOf(brk);
			if (idx >= 0)
				this.infos.splice(idx, 1);
		},
		toXml: function()
		{
			var xml = "<Renderer>" + "<Type>ClassBreaksRenderer</Type>" + "<FieldName>" + this.attributeField + "</FieldName>" + "<Label></Label>" + "<DefaultSymbol>" + this.defaultSymbol.toXml(true) + "</DefaultSymbol>" + "<DefaultLabel></DefaultLabel>" + "<Breaks>";
			
			if (this.defaultSymbol instanceof sg.symbols.Symbol && this.defaultSymbol.toXml)
				xml += this.defaultSymbol.toXml();
			for (var v = 0 ; v < this.infos.length ; v++)
				xml += "<Break>" + "<Value>" + this.infos[v].maxValue + "</Value>" + this.infos[v].symbol.toXml() + "</Break>";
			
			xml += "</Breaks>" + "</Renderer>";
			return xml;
		}
	});
	r.ScaleDependentRenderer = r.Renderer.extend(
	{
		rendererInfos: null,
		initialize: function(param)
		{
			this.redrawOnScaleChange = true;
			this.getSymbol = function(graphic)
			{
				var ri = this.getRendererInfo(graphic);
				if (ri)
					return ri.renderer.getSymbol(graphic);
			};
			this.rendererInfos = [];
			if (!param)
				throw "Parameter must be provided";
			if (Object.prototype.toString.call(param.rendererInfos) === "[object Array]")
				this.rendererInfos = param.rendererInfos;
		},
		getRendererInfoByZoom: function(zoom)
		{
			var length = this.rendererInfos.length;
			for (var r = 0 ; r < length ; r++)
			{
				var ri = this.rendererInfos[r];
				if (ri.minZoom <= zoom && ri.maxZoom >= zoom)
					return ri;
			}
		},
		setRendererInfos: function(rendererInfos)
		{
			if (Object.prototype.toString.call(rendererInfos) === "[object Array]")
				this.rendererInfos = rendererInfos;
		},
		getRendererInfo: function(graphic)
		{
			if (!(graphic instanceof sg.Graphic))
				return null;
			var layer = graphic.layer;
			var map = layer.getMap();
			if (!layer && !map)
				return null;
			var trans = map.getTransformation();
			var scale, level;
			if (trans instanceof CachedLevelTransformation)
			{
				level = trans.getMapLevel();
				var ri = this.getRendererInfoByZoom(level);
				return ri;
			}
			if (trans instanceof ScaleTransformation)
			{
				var scale = trans.getScale();
				var ri = this.getRendererInfoByScale(scale);
				return ri;
			}
			if (trans instanceof LevelTransformation)
			{
				level = trans.getMapLevel();
				var ri = this.getRendererInfoByZoom(level);
				return ri;
			}
		},
		getRendererInfoByScale: function(scale)
		{
			var rlength = this.rendererInfos.length;
			for (var r = 0 ; r < rlength ; r++)
			{
				var ri = this.rendererInfos[r];
				if (ri.minScale <= scale && ri.maxScale >= scale)
					return ri;
			}
		}
	});
	r.DotDensityRenderer = r.Renderer.extend(
	{
		backgroundColor: new sg.Color(0, 0, 0, 1),
		dotShape: "square",
		dotSize: 2,
		dotValue: null,
		fields: null,
		outline: null,
		initialize: function(param)
		{
			this.redrawOnScaleChange = true;
			if (!param)
				throw "parameters must be provided";
			if (!typeof param.dotValue == "number")
				throw "dotValue must be provided";
			this.dotValue = param.dotValue;
			if (!typeof param.dotSize == "number")
				throw "dotSize must be provided";
			this.dotSize = param.dotSize;
			if (!param.fields)
				throw "fields must be provided";
			this.fields = param.fields;
			if (param.dotShape)
				this.dotShape = param.dotShape;
			if (param.backgroundColor)
				this.backgroundColor = param.backgroundColor;
			this.canvas = document.createElement("canvas");
		},
		getSymbol: function(graphic)
		{
			var canvas = this.canvas;
			var ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			var map = graphic.layer.getMap();
			var extent = graphic.geometry.getExtent();
			var width = extent.getWidth();
			var height = extent.getHeight();
			var halfSize = this.dotSize / 2;
			var distX = map.FromMapDistX(extent.getWidth());
			var distY = map.FromMapDistY(extent.getHeight());
			canvas.width = Math.abs(distX);
			canvas.height = Math.abs(distY);
			ctx.fillStyle = this.backgroundColor.toHex();
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			
			var flength = this.fields.length;
			for (var f = 0 ; f < flength ; f++)
			{
				var field = this.fields[f];
				var value = parseFloat(graphic.attributes[field.name]);
				var dotCount = Math.floor(value / this.dotValue);
				ctx.fillStyle = field.color.toHex();
				var c = 0;
				var ltPt = map.FromMapPoint(extent.xmin, extent.ymax);
				while (c < dotCount)
				{
					var rndX = Math.random();
					var rndY = Math.random();
					var mapX = extent.xmin + width * rndX;
					var mapY = extent.ymax - height * rndY;
					
					if (graphic.geometry.contains(new sg.geometry.Point(mapX, mapY)))
					{
						var mapPt = map.FromMapPoint(mapX, mapY);
						var tx = Math.round(mapPt.X - ltPt.X - halfSize);
						var ty = Math.round(mapPt.Y - ltPt.Y - halfSize);
						ctx.fillRect(tx, ty, this.dotSize, this.dotSize);
						c++;
					}
				}
			}
			var symbol = new sg.symbols.PictureFillSymbol(canvas.toDataURL(), new sg.symbols.SimpleLineSymbol, canvas.width, canvas.height);
			symbol.setColor(this.backgroundColor);
			return symbol;
		},
		setBackgroundColor: function()
		{
			this.backgroundColor = color;
		},
		setDotSize: function(size)
		{
			this.dotSize = size;
		},
		setDotValue: function(value)
		{
			this.dotValue = value;
		},
		setOutline: function(outline)
		{
			this.outline = outline;
		}
	});
	return r;
}();