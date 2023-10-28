if (sg)
{
	if (!sg.controls)
		sg.controls = {};
	
	sg.controls.ControlBase = sg.Class.extend(
	{
		node: null,
		targetNode: "",
		name: "",
		initialize: function(param, node)
		{
			this.node = document.createElement("div");
			sg.addClass(this.node, "sgCtrl");
			if (node)
			{
				if (typeof node == "string")
					this.targetNode = sg.byId(node);
				else if (node.nodeType == 1)
					this.targetNode = node;
				if (this.targetNode)
					this.targetNode.appendChild(this.node);
			}
		},
		setFocusable: function(p)
		{
			if (!sg.isBoolean(p))
				return;
			this.focusable = p;
			if (this.focusable && this.node)
				this.node.setAttribute("tabindex", "0");
		},
		focus: function()
		{
			if (!this.node)
				return;
			this.node.focus();
		},
		show: function()
		{
			if (!this.node)
				return;
			this.node.style.display = "";
		},
		hide: function()
		{
			if (!this.node)
				return;
			this.node.style.display = "none";
		},
		startup: function()
		{
			if (this.targetNode && this.node.parentNode != this.targetNode)
				this.targetNode.appendChild(this.node);
		},
		destroy: function()
		{
			if (this.targetNode && this.node.parentNode == this.targetNode)
				this.targetNode.removeChild(this.node);
		}
	});
	
	sg.controls.LayerSwipe = sg.controls.ControlBase.extend(
	{
		map: null,
		node: null,
		layers: null,
		type: "vertical",
		left: null,
		top: null,
		initialize: function(param, node)
		{
			sg.controls.ControlBase.prototype.initialize.apply(this, arguments);
			
			if (!param || !param.map || !param.layers)
				throw "map and layers must be provided";
			
			this.map = param.map;
			this.layers = param.layers;
			
			if (typeof param.type == "string")
				this.type = param.type;
			
			if (typeof param.left == "number")
				this.left = param.left;
			else if (this.type == "horizontal")
				this.left = this.map.getClientWidth();
			else
				this.left = this.map.getClientWidth() / 2;
				
			if (typeof param.top == "number")
				this.top = param.top;
			else if (this.type == "horizontal")
				this.top = this.map.getClientHeight() / 2;
			else
				this.top = this.map.getClientHeight();
			
			this.buildNode();
		},
		startup: function()
		{
			sg.controls.ControlBase.prototype.startup.apply(this, arguments);
			this.updateClip_();
		},
		destroy: function()
		{
			sg.controls.ControlBase.prototype.destroy.apply(this, arguments);
			if (this.layers)
			{
				var i = 0;
				while (i < this.layers.length)
				{
					var layer = this.layers[i];
					if (layer.getNode)
					{
						var nd = layer.getNode();
						if (nd)
							layer.getNode().style.clip = "";
					}
					i++;
				}
			}
		},
		buildNode: function()
		{
			var that = this;
			if (!this.node)
				return;
			
			sg.addClass(this.node, "layer-swipe");
			var bar = document.createElement("div");
			var handle = document.createElement("div");
			this.node.appendChild(bar);
			this.node.appendChild(handle);
			sg.addClass(handle, "handle");
			sg.addClass(bar, "bar");
			
			if (this.type == "horizontal")
			{
				sg.addClass(handle, "horizontal-handle");
				sg.addClass(bar, "horizontal-bar");
				this.node.style.left = "0px";
				this.node.style.top = this.top + "px";
				this.node.style.width = "100%";
				bar.style.top = -(bar.clientHeight / 2) + "px";
				handle.style.left = this.left / 2 - handle.clientWidth / 2 + "px";
			}
			else
			{
				sg.addClass(handle, "vertical-handle");
				sg.addClass(bar, "vertical-bar");
				this.node.style.left = this.left + "px";
				this.node.style.top = "0px";
				this.node.style.height = "100%";
				bar.style.left = -(bar.clientWidth / 2) + "px";
				handle.style.top = this.top / 2 - handle.clientHeight / 2 + "px";
			}
			var onMouseDown = function(e)
			{
				AttachEvent(document.body, "mousemove", onMoseMove);
				AttachEvent(document.body, "mouseup", onMouseUp);
				if (e.preventDefault)
					e.preventDefault();
				return false;
			};
			var onMouseUp = function(e)
			{
				DetachEvent(document.body, "mousemove", onMoseMove);
				DetachEvent(document.body, "mouseup", onMouseUp);
				if (e.preventDefault)
					e.preventDefault();
				return false;
			};
			var onMoseMove = function(e)
			{
				if (!that.node || !that.node.parentNode)
					return;
				
				var bbox = that.node.parentNode.getBoundingClientRect();
				if (that.type == "horizontal")
				{
					var top = e.clientY - bbox.top;
					that.top = top;
				}
				else
				{
					var left = e.clientX - bbox.left;
					that.left = left;
				}
				that.updateClip_();
				if (e.preventDefault)
					e.preventDefault();
				return false;
			};
			AttachEvent(handle, "mousedown", onMouseDown);
		},
		updateClip_:function()
		{
			var i = 0;
			while (i < this.layers.length)
			{
				var layer = this.layers[i];
				if (layer.getNode)
					var nd = layer.getNode();
				if (nd)
					layer.getNode().style.clip = "rect(0px," + this.left + "px," + this.top + "px,0px)";
				
				i++;
			}
			if (this.type == "horizontal")
				this.node.style.top = this.top + "px";
			else
				this.node.style.left = this.left + "px";
		}
	});
	
	sg.controls.Gauge = sg.controls.ControlBase.extend(
	{
		initialize:function(param, node)
		{
			sg.controls.ControlBase.prototype.initialize.apply(this, arguments);
			var that = this;
			this.angle = 0;
			this.outRadius = 80;
			this.inRadius = 60;
			if (param)
			{
				if (param.layer)
					this.layer = param.layer;
				this.maxDataValue = typeof param.maxDataValue == "number" ? param.maxDataValue : 100;
				this.dataField = typeof param.dataField == "string" ? param.dataField : "";
				this.dataFormat = typeof param.dataFormat == "string" ? param.dataFormat : "value";
				this.caption = typeof param.caption == "string" ? param.caption : "";
				this.title = typeof param.title == "string" ? param.title : "";
				this.dataLabelField = typeof param.dataLabelField == "string" ? param.dataLabelField : "";
				this.unitLabel = typeof param.unitLabel == "string" ? param.unitLabel : "";
				this.color = typeof param.color == "string" ? param.color : "#88ff33";
				this.lowColor = typeof param.lowColor == "string" ? param.lowColor : "#88ff33";
				this.midColor = typeof param.midColor == "string" ? param.midColor : "#FFD700";
				this.highColor = typeof param.highColor == "string" ? param.highColor : "#FF2400";
			}
			var content = document.createElement("div");
			sg.addClass(content, "sgGaugeContainer");
			content.style.width = "100%";
			content.style.height = "100%";
			this.captionSpan = document.createElement("span");
			this.captionSpan.setAttribute("class", "caption");
			this.captionSpan.style.position = "absolute";
			this.captionSpan.style.bottom = "0px";
			this.valueSpan = document.createElement("span");
			this.valueSpan.style.position = "absolute";
			this.valueSpan.setAttribute("class", "value");
			this.titleSpan = document.createElement("span");
			this.titleSpan.setAttribute("class", "title");
			this.titleSpan.style.position = "absolute";
			this.titleSpan.style.top = "0px";
			this.labelSpan = document.createElement("span");
			this.labelSpan.setAttribute("class", "label");
			this.labelSpan.style.position = "absolute";
			this.labelSpan.style.top = "1em";
			
			if (this.node)
			{
				this.node.appendChild(content);
				this.node.appendChild(this.captionSpan);
				this.node.appendChild(this.valueSpan);
				this.node.appendChild(this.titleSpan);
				this.node.appendChild(this.labelSpan);
			}
			
			this.cx = node.clientWidth / 2;
			this.cy = node.clientHeight / 4 * 3;
			var surface = null;
			surface = sg.createSurface(content);
			var backGauge = surface.path(this.createPathStr(0, this.outRadius, this.inRadius, this.cx, this.cy));
			backGauge.attr({"fill":"#aaaaaa", "stroke":"#555555", "stroke-width":2});
			this.path = surface.path("");
			this.path.attr({"fill":this.color, "stroke-width":2});
			this.captionSpan.innerHTML = this.caption;
			this.titleSpan.innerHTML = this.title;
			this.update();
		},
		update: function()
		{
			if (!this.feature)
				return;
			
			var that = this;
			var value = parseFloat(this.feature.attributes[this.dataField]);
			var mv = value;
			if (this.dataLabelField)
				this.labelSpan.innerHTML = this.feature.attributes[this.dataLabelField];
			
			if (mv < 0)
				mv = 0;
			if (mv > this.maxDataValue)
				mv = this.maxDataValue;
				
			if (value/this.maxDataValue <= 0.33)
				this.color = this.lowColor;
			else if (value/this.maxDataValue <= 0.66)
				this.color = this.midColor;
			else if (value/this.maxDataValue <= 1)
				this.color = this.highColor;
			
			var startAngle = this.angle;
			var endAngle = 180 * (1 - mv / this.maxDataValue);
			var da = endAngle - startAngle;
			if (this.animation)
				this.animation.stop();
			
			this.valueSpan.style.left = this.cx - this.valueSpan.clientWidth / 2 + "px";
			this.valueSpan.style.top = this.cy + "px";
			this.valueSpan.innerHTML = value + " " + this.unitLabel;
			
			if (isNaN(mv))
			{
				var pathStr = that.createPathStr(180, that.outRadius, that.inRadius, that.cx, that.cy);
				that.path.attr({path:pathStr});
				this.angle = 180;
				return;
			}
			
			this.animation = sg.fx.createAnimation(
			{
				easing: sg.fx.easing.quadInOut,
				type: window.requestAnimationFrame ? "" : "setTimeout",
				duration:150,
				onAnimation:function(percent)
				{
					that.angle = startAngle + da * percent;
					var pathStr = that.createPathStr(that.angle, that.outRadius, that.inRadius, that.cx, that.cy);
					that.path.attr({fill:that.color});
					that.path.attr({path:pathStr});
				},
				onEnd: function()
				{
					var pathStr = that.createPathStr(endAngle, that.outRadius, that.inRadius, that.cx, that.cy);
					that.path.attr({path:pathStr});
				}
			});
			this.animation.play();
		},
		setCaption: function(p)
		{
			if (typeof p != "string")
				return;
			this.caption = p;
			if (this.captionSpan)
				this.captionSpan.innerHTML = p;
		},
		setTitle: function(p)
		{
			if (typeof p != "string")
				return;
			this.title = p;
			if (this.titleSpan)
				this.titleSpan.innerHTML = p;
		},
		setLabel: function(p)
		{
			if (typeof p != "string")
				return;
			this.label = p;
			if (this.labelSpan)
				this.labelSpan.innerHTML = p;
		},
		setValue: function(p)
		{
			if (typeof p != "number")
				return;
			this.value = p;
			if (this.valueSpan)
			{
				this.valueSpan.innerHTML = p;
				this.valueSpan.style.left = this.cx - this.valueSpan.clientWidth / 2 + "px";
				this.valueSpan.style.top = this.cy;
			}
		},
		setFeature: function(p)
		{
			if (!(p instanceof sg.Graphic))
				return;
			this.feature = p;
			this.update();
		},
		startup: function()
		{
			sg.controls.ControlBase.prototype.startup.apply(this);
			var that = this;
			this.handler_ = sg.events.on(
				this.layer,
				"mouse-over",
				function(e)
				{
					that.feature = e.graphic;
					that.update();
				}
			);
		},
		destroy: function()
		{
			sg.controls.ControlBase.prototype.destroy.apply(this);
			if (this.handler_)
				this.handler_.remove();
			this.handler_ = null;
		},
		createPathStr:function(angle, out_radius, in_radius, cx, cy)
		{
			var theta = angle / 180 * Math.PI;
			x = cx + out_radius * Math.cos(theta);
			y = cy - out_radius * Math.sin(theta);
			x2 = cx + in_radius * Math.cos(theta);
			y2 = cy - in_radius * Math.sin(theta);
			return "M" + (cx - out_radius) + "," + cy + "A" + out_radius + "," + out_radius + ",0,0,1," + x + "," + y + "L" + x2 + "," + y2 + "A" + in_radius + "," + in_radius + ",0,0,0," + (cx - in_radius) + "," + cy + "z";
		}
	});
}
var checkbox_ID = 0;
function MapLegend(pNode, pCtx, pLayer, OnLegendClick, pMapBase)
{
	var m_pExp = null;
	var m_pChk = null;
	var m_pImgDiv = null;
	var m_pSubDiv = null;
	var m_pLegends = null;
	var m_SelectedValue = null;
	
	var pDiv = pNode.ownerDocument.createElement("DIV");
	pNode.appendChild(pDiv);
	pDiv.style.position = "relative";
	pDiv.style.textAlign = "left";
	
	var pDiv2 = pDiv.ownerDocument.createElement("DIV");
	pDiv.appendChild(pDiv2);
	pDiv2.style.position = "relative";
	
	if (pLayer == null)
		return;
	
	this.targetLayer = pLayer;
	var pProperties = function(tEvent)
	{
		var pElem = tEvent.srcElement ? tEvent.srcElement : tEvent.target;
		if (pElem.tagName == "IMG" && pElem.className == "show")
		{
			if (!m_pSubDiv)
				return;
				
			if (m_pSubDiv.style.display == "none")
			{
				pElem.src = "images/down.png";
				pElem.ctype = "ShowClose";
				m_pSubDiv.style.display = "";
			}
			else
			{
				pElem.src = "images/right.png";
				pElem.ctype = "ShowOpen";
				m_pSubDiv.style.display = "none";
			}
		}
		else if (pElem.tagName == "INPUT")
		{
			pLayer.putVisible(pElem.checked);
			if (pLayer.RebuildElement)
				pLayer.RebuildElement();
			else if (pLayer.getParent)
				pLayer.getParent().RebuildElement();
		}
	};
	m_pExp = pNode.ownerDocument.createElement("IMG");
	m_pExp.src = "images/down.png";
	m_pExp.className = "show";
	m_pExp.ctype = "ShowClose";
	pDiv2.appendChild(m_pExp);
	
	if (pLayer.getVisible)
	{
		m_pChk = pNode.ownerDocument.createElement("INPUT");
		m_pChk.type = "checkbox";
		m_pChk.id = "LTCheckbox" + checkbox_ID;
		checkbox_ID++;	
		
		var lb_m_pChk = pNode.ownerDocument.createElement("LABEL");
		lb_m_pChk.htmlFor = m_pChk.id;
		
		var sp = pNode.ownerDocument.createElement("span");
		lb_m_pChk.appendChild(sp);
		
		if (pLayer.getName)
			m_pChk.value = pLayer.getName();
		
		pDiv2.appendChild(m_pChk);
		pDiv2.appendChild(lb_m_pChk);
		
		m_pChk.checked = pLayer.getVisible();
	}
	AttachEvent(pDiv2, "click", FuncAdapter(this, pProperties), false);
	var pLbl = pNode.ownerDocument.createElement("LABEL");
	pLbl.style.fontSize = "18px";
	pDiv2.appendChild(pLbl);
	if (pLayer.getTitle)
		pLbl.innerHTML = pLayer.getTitle();
	else if (pLayer.getName)
		pLbl.innerHTML = pLayer.getName();
	
	if (m_pSubDiv == null)
	{
		m_pSubDiv = pDiv.ownerDocument.createElement("DIV");
		pDiv.appendChild(m_pSubDiv);
		m_pSubDiv.style.position = "relative";
		m_pSubDiv.style.paddingLeft = "20px";
	}
	if (pLayer.getResource)
	{
		m_pImgDiv = pDiv.ownerDocument.createElement("DIV");
		m_pSubDiv.appendChild(m_pImgDiv);
		m_pImgDiv.style.position = "relative";
		m_pImgDiv.style.paddingLeft = "5px";
		var img = pDiv.ownerDocument.createElement("IMG");
		m_pImgDiv.appendChild(img);
		img.src = pLayer.getResource();
	}
	this.selectedValue = function()
	{
		return m_SelectedValue;
	};
	this.getHandle = function()
	{
		return pDiv;
	};
	this.getLayer = function()
	{
		return pLayer;
	};
	this.CreateSubLegend = function(pLyr, OnLegendClick)
	{
		var pLgd = new MapLegend(m_pSubDiv, pCtx, pLyr, OnLegendClick, pMapBase);
		if (m_pLegends == null)
			m_pLegends = new Array;
		m_pLegends.push(pLgd);
		this.legends = m_pLegends;
		return pLgd;
	};
	this.Deactive = function()
	{
		pDiv2.style.background = "";
	};
	this.Active = function()
	{
		pDiv2.style.background = "gray";
	};
	this.FinalRelease = function()
	{
		if (m_pLegends)
		{
			for (var i = 0;i < m_pLegends.length;i++)
				m_pLegends[i].FinalRelease();
		}
				
		m_pLegends = null;
		pNode.removeChild(pDiv);
	};
	if (pLayer.CreateLegend)
	{
		pDiv.style.marginTop = "15px";
		var move_to_layer = document.createElement("IMG");
		var MapBase = pMapBase;
		move_to_layer.src = "images/PC_OtherTool/Go-Search.png";
		move_to_layer.style.marginRight = "10px";
		move_to_layer.style.float = "right";
		pDiv2.appendChild(move_to_layer);
		AttachEvent(move_to_layer, "click", function ()
		{
			var top = pLayer.getTop();
			var left = pLayer.getLeft();
			var bottom = pLayer.getBottom();
			var right = pLayer.getRight();
			var extent = new sg.geometry.Extent;
			extent.xmax = right;
			extent.xmin = left;
			extent.ymax = top;
			extent.ymin = bottom;
			
			MapBase.ZoomMapTo(extent);
			MapBase.RefreshMap(true);
		});
		var hrNode = document.createElement("hr");
		hrNode.style.width = "95%";
		pDiv2.appendChild(hrNode);
		pLayer.CreateLegend(this);
	}
	else if (pLayer.title == "Drawing Layer" || pLayer.title == "OpenStreetMapLayer")
	{
		pDiv.style.marginTop = "15px";
		var move_to_layer = document.createElement("IMG");
		move_to_layer.src = "images/PC_OtherTool/Go-Search.png";
		move_to_layer.style.marginRight = "10px";
		move_to_layer.style.float = "right";
		pDiv2.appendChild(move_to_layer);
		var hrNode = document.createElement("hr");
		hrNode.style.width = "95%";
		pDiv2.appendChild(hrNode);			
	}
}
function ContentControl(pParentElem, pMapBase, pLyrs)
{
	var m_ActiveObj = null;
	var m_Values = null;
	var that = this;
	
	this.RebuildElement = function()
	{
		if (m_pLegends)
		{
			for (var i = 0;i < m_pLegends.length;i++)
				m_pLegends[i].FinalRelease();
		}
		m_pLegends = new Array;
		for (var i = 0 ; i < pLyrs.length ; i++)
		{
			if (!pLyrs[i].hideLegend && pLyrs[i].getTitle() != "Graphics Layer" && pLyrs[i].getName() != "Graphics Layer" )
			{
				var lgn = new MapLegend(m_hObj, that, pLyrs[i], null, pMapBase);
				m_pLegends.push(lgn);
				if (m_ActiveObj && m_ActiveObj.Active)
				{
					if (m_ActiveObj.targetLayer == pLyrs[i])
					{
						lgn.Active();
						m_ActiveObj = lgn;
						break;
					}
					if (lgn.legends)
					{
						for (var l = 0 ; l < lgn.legends.length ; l++)
						{
							var subLgn = lgn.legends[l];
							if (m_ActiveObj.targetLayer == subLgn.targetLayer)
							{
								subLgn.Active();
								m_ActiveObj = subLgn;
								break;
							}
						}
					}
				}
			}
		}
	};
	this.getActive = function()
	{
		return m_ActiveObj;
	};
	this.putActive = function(newVal)
	{
		if (m_ActiveObj != null && m_ActiveObj.Deactive)
			m_ActiveObj.Deactive();
		
		m_ActiveObj = newVal;
		if (m_ActiveObj != null && m_ActiveObj.Active)
			m_ActiveObj.Active();
	};
	this.getValues = function()
	{
		return m_Values;
	};
	this.setValues = function(values)
	{
		m_Values = values;
	};
	var m_pLegends = null;
	var m_hObj;
	m_hObj = pParentElem.ownerDocument.createElement("span");
	pParentElem.appendChild(m_hObj);
	m_hObj.style.fontSize = "12px";
	m_hObj.style.width = "100%";
	m_hObj.style.height = "100%";
	pMapBase.on("load", this.RebuildElement);
	pMapBase.on("layer-add", this.RebuildElement);
	pMapBase.on("layer-remove", this.RebuildElement);
	pMapBase.on("layers-removed", this.RebuildElement);	
}
function CreateClipImage(pNode, sSrc, nLfet, nTop, nWidth, nHeight)
{
	var pCont = pNode.ownerDocument.createElement("div");
	pNode.appendChild(pCont);
	pCont.style.position = "relative";
	pCont.style.width = nWidth + "px";
	pCont.style.height = nHeight + "px";
	pCont.style.overflow = "hidden";
	pImg = pCont.ownerDocument.createElement("img");
	pCont.appendChild(pImg);
	pImg.src = sSrc;
	pImg.style.position = "absolute";
	pImg.style.left = -nLfet + "px";
	pImg.style.top = -nTop + "px";
	pCont.Img = pImg;
	return pCont;
}
function ScaleBarControl(pParentElem, pMapBase)
{
	function TT(dDist)
	{
		var DG = { digit:dDist, base:1, units:"m" };
		if (dDist >= 1E3)
		{
			DG.digit /= 1E3;
			DG.base = 1E3;
			DG.units = "km";
		}
		var nL = Math.floor(Math.log(DG.digit) / Math.LN10);
		var dP = Math.pow(10, nL);
		var nD = Math.floor(DG.digit / dP);
		nD = nD < 2 ? 1 : nD < 5 ? 2 : 5;
		DG.digit = nD * dP;
		return DG;
	}
	var pThis = this;
	var m_pScaleBar = null;
	m_pScaleBar = pParentElem.ownerDocument.createElement("div");
	m_pScaleBar.id = "scalebar";
	pParentElem.appendChild(m_pScaleBar);
	
	var zeroNumber = pParentElem.ownerDocument.createElement("div");
	zeroNumber.id = "zeroNumber";
	m_pScaleBar.appendChild(zeroNumber);
	
	var firstNumber = pParentElem.ownerDocument.createElement("div");
	firstNumber.id = "firstNumber";
	m_pScaleBar.appendChild(firstNumber);
	
	var secondNumber = pParentElem.ownerDocument.createElement("div");
	secondNumber.id = "secondNumber";
	m_pScaleBar.appendChild(secondNumber);
	
	var thirdNumber = pParentElem.ownerDocument.createElement("div");
	thirdNumber.id = "thirdNumber";
	m_pScaleBar.appendChild(thirdNumber);
	
	var fourthNumber = pParentElem.ownerDocument.createElement("div");
	fourthNumber.id = "fourthNumber";
	m_pScaleBar.appendChild(fourthNumber);
	
	var fifthNumber = pParentElem.ownerDocument.createElement("div");
	fifthNumber.id = "fifthNumber";
	m_pScaleBar.appendChild(fifthNumber);
	
	var barImg = pParentElem.ownerDocument.createElement("div");
	barImg.id = "barImage";
	m_pScaleBar.appendChild(barImg);
	
	var unitSpan = pParentElem.ownerDocument.createElement("div");
	unitSpan.id = "unit";
	var scalebarPixelLength = barImg.clientWidth;
	m_pScaleBar.appendChild(unitSpan);
	
	this.UpdateElement = function()
	{
		var scale = pMapBase.ToMapDistX(1);
		var OPL = scalebarPixelLength / 3;
		var maxDist = scale * OPL;
		var DG = TT(maxDist);
		var nl = (DG.digit * DG.base) / scale;
		var nUnit = DG.units;
		zeroNumber.innerHTML = "0";
		secondNumber.innerHTML = DG.digit * 0.5;
		thirdNumber.innerHTML = DG.digit * 1 ;
		fourthNumber.innerHTML = DG.digit * 2;
		fifthNumber.innerHTML = DG.digit * 3;
		zeroNumber.style.left = (0 - (zeroNumber.clientWidth / 2)) + "px";
		secondNumber.style.left = ((nl * 0.5) - (secondNumber.clientWidth / 2)) + "px";
		thirdNumber.style.left = ((nl * 1) - (thirdNumber.clientWidth / 2)) + "px";
		fourthNumber.style.left = ((nl * 2) - (fourthNumber.clientWidth / 2)) + "px";
		fifthNumber.style.left = ((nl * 3) - (fifthNumber.clientWidth / 2)) + "px";
		unitSpan.innerHTML = DG.units;
		barImg.style.width = nl * 3 + "px";
		unitSpan.style.left = (barImg.clientWidth * 1.1) + "px";
		createScaleBar(barImg, nl * 3, "px");
	};
	var createScaleBar = function(root ,length, unit)
	{
		var pp = [1.0 / 12.0, 1.0 / 12.0, 1.0 / 12.0, 1.0 / 12.0, 1.0 / 3.0, 1.0 / 3.0];
		var sp = 0;
		for (var s = 0 ; s < pp.length ; s++)
		{
			var span = document.createElement("img");
			span.border = 0;
			span.className = "w";
			span.src = (s%2 == 0) ? "images/layout/scalebar_black.png" : "images/layout/scalebar_white.png";
			span.style.backgroundColor = (s%2 == 0) ? "black" : "white";
			span.style.width = pp[s] * length + unit;
			span.style.left = sp * length + unit;
			sp += pp[s];
			root.appendChild(span);
		}
	};
}

function ToolbarControl(pParentElem, padding, nCol)
{
	var m_hObj;
	var m_hRow;
	var m_Tools = new Array;
	var m_CurrentTool = null;
	m_hObj = pParentElem.ownerDocument.createElement("table");
	PreventDefault(m_hObj, "mousedown");
	pParentElem.appendChild(m_hObj);
	m_hObj.style.position = "relative";
	m_hObj.style.left = "0px";
	m_hObj.style.top = "0px";
	m_hObj.border = "0px";
	m_hObj.cellPadding = "0px";
	m_hObj.cellSpacing = "0px";
	
	this.FinalRelease = function()
	{
		if (m_Tools)
		{
			cnt = m_Tools.length;
			for (var i = 0 ; i < cnt ; i++)
			{
				var hObj = m_Tools[i];
				
				if (hObj.pClickFunc)
					DetachEvent(hObj, "click", hObj.pClickFunc, false);
				hObj.pClickFunc = null;
				
				if (hObj.pMouseDownFunc)
					DetachEvent(hObj, "mousedown", hObj.pMouseDownFunc, false);
				hObj.pMouseDownFunc = null;
				
				if (hObj.pMouseOverFunc)
					DetachEvent(hObj, "mouseover", hObj.pMouseOverFunc, false);
				hObj.pMouseOverFunc = null;
			}
		}
		pParentElem.removeChild(m_hObj);
		m_Tools = null;
	};
	
	function ChangeClassName(pElem, strClass)
	{
		if (!pElem)
			return;
		
		if (strClass == "ButtonDown" || strClass == "ButtonFocus")
			pElem.Img.style.left = "-32px";
		else
			pElem.Img.style.left = "0px";
	}
	
	this.AddTool = function(pMapBase, pTool, imgPath, altString, title)
	{
		if (m_Tools.length == 0 || nCol != 0 && m_Tools.length % nCol == 0)
			m_hRow = m_hObj.insertRow(-1);
		
		var pCell = m_hRow.insertCell(-1);
		if (title)
			pCell.title = title;
		
		var hObj = CreateClipImage(pCell, imgPath, 0, 0, 32, 32);
		
		if (pTool && pTool.InitialMapBase)
			pTool.InitialMapBase(pMapBase);
		
		var pClick = function(tEvent)
		{
			var i;
			var cnt = m_Tools.length;
			for (i = 0 ; i < cnt ; i++)
				ChangeClassName(m_Tools[i], "ButtonDefault");
			
			if (m_CurrentTool == hObj)
			{
				pMapBase.SelectMapTool(null);
				m_CurrentTool = null;
			}
			else if (pTool)
			{
				if(pMapBase.SelectMapTool(pTool))
					m_CurrentTool = hObj;
				else if (pTool.MapCommand)
					pTool.MapCommand(tEvent, pMapBase, hObj);
				ChangeClassName(m_CurrentTool, "ButtonDown");
			}
		};
		var pMouseDown = function(tEvent)
		{
			ChangeClassName(hObj, "ButtonDown");
			AttachEvent(hObj, "mouseup", pMouseUp, true);
		};
		var pMouseUp = function(tEvent)
		{
			ChangeClassName(hObj, "ButtonDefault");
			DetachEvent(hObj, "mouseup", pMouseUp, true);
		};
		var pMouseOver = function()
		{
			if (m_CurrentTool != hObj)
				ChangeClassName(hObj, "ButtonFocus");
			
			AttachEvent(hObj, "mouseout", pMouseOut, false);
		};
		var pMouseOut = function()
		{
			if (m_CurrentTool != hObj)
				ChangeClassName(hObj, "ButtonDefault");
			
			DetachEvent(hObj, "mouseout", pMouseOut, false);
		};
		hObj.pClickFunc = pClick;
		hObj.pMouseDownFunc = pMouseDown;
		hObj.pMouseOverFunc = pMouseOver;
		PreventDefault(hObj, "mousedown");
		AttachEvent(hObj, "click", pClick, false);
		AttachEvent(hObj, "mousedown", pMouseDown, false);
		AttachEvent(hObj, "mouseover", pMouseOver, false);
		m_Tools.push(hObj);
	};
	this.selectTool = function(Index)
	{
		m_Tools[Index].fireEvent("click");
	};
}
function PageControl(pParentElem)
{
	var pThis = this;
	var pTbl = document.createElement("div");
	pParentElem.appendChild(pTbl);
	pTbl.style.border = "0";
	pTbl.style.width = "100%";
	pTbl.style.height = "100%";
	pTbl.style.backgroundImage = "url('images/3.2/javascript TOC/window4.png')";
	
	var pT1 = document.createElement("div");
	pT1.style.backgroundImage = "url('images/3.2/javascript TOC/window2.png')";
	pT1.style.color = "white";
	pT1.style.position = "absolute";
	pT1.style.fontWeight = "bold";
	pT1.style.height = "33px";
	pT1.style.width = "100%";
	pT1.style["text-align"] = "center";
	pT1.style["vertical-align"] = "middle";
	
	var content = document.createElement("div");
	content.id = "tocContent";
	content.style.position = "absolute";
	content.style.width = "100%";
	content.style.top = "33px";
	content.style.bottom = "44px";
	content.style.overflow = "auto";
	
	var pFootDiv = document.createElement("div");
	pFootDiv.style.position = "absolute";
	pFootDiv.style.height = "44px";
	pFootDiv.style.bottom = "0px";
	pFootDiv.style.width = "100%";
	pFootDiv.style.backgroundImage = "url('images/3.2/javascript TOC/window6.png')";
	pTbl.appendChild(content);
	pTbl.appendChild(pT1);
	pTbl.appendChild(pFootDiv);
	
	var pFootImg = document.createElement("img");
	pFootImg.src = "images/3.2/javascript TOC/window6.png";
	pFootImg.style.position = "absolute";
	pFootImg.style.top = "0px";
	pFootImg.style.left = "0px";
	var m_Pages = new Array;
	
	this.AddPage = function(sTitle, sPageImg, alternative)
	{
		var pImg = pFootDiv.ownerDocument.createElement("img");
		var span = document.createElement("span");
		span.appendChild(pImg);
		pFootDiv.appendChild(span);
		pImg.src = sPageImg;
		var pageContainer = document.createElement("div");
		pageContainer.style.position = "relative";
		content.appendChild(pageContainer);
		
		function pFunc(nIndex)
		{
			return function()
			{
				pThis.SetActivePage(nIndex);
			};
		}
		function pFuncIn(data)
		{
			return function()
			{
				if (data.active)
					return;
				data.elem.src = sPageImg;
			};
		}
		function pFuncOut(data)
		{
			return function()
			{
				if (data.active)
					return;
				data.elem.src = alternative;
			};
		}
		var pageData = {title:sTitle, container:span, normal:alternative, highlight:sPageImg, elem:pImg, cont:pageContainer};
		AttachEvent(pImg, "click", pFunc(m_Pages.length), false);
		AttachEvent(pImg, "mouseover", pFuncIn(pageData), false);
		AttachEvent(pImg, "mouseout", pFuncOut(pageData), false);
		m_Pages.push(pageData);
		this.SetActivePage(m_Pages.length - 1);
		return pageContainer;
	};
	this.SetActivePage = function(nIndex)
	{
		if (nIndex >= m_Pages.length)
			return;
		
		for (var i = 0 ; i < m_Pages.length ; i++)
		{
			m_Pages[i].active = false;
			m_Pages[i].elem.src = m_Pages[i].normal;
			m_Pages[i].cont.style.display = "none";
		}
		
		pT1.innerHTML = m_Pages[nIndex].title;
		m_Pages[nIndex].elem.src = m_Pages[nIndex].highlight;
		m_Pages[nIndex].cont.style.display = "";
		m_Pages[nIndex].active = true;
	};
}
var LevelBarControl = function(pParentElem, pTrans)
{
	var StepHeight = 10;
	var m_pMapBase = null;
	m_pLevelBarBar = pParentElem.ownerDocument.createElement("table");
	pParentElem.appendChild(m_pLevelBarBar);
	m_pLevelBarBar.style.position = "absolute";
	m_pLevelBarBar.style.left = "10px";
	m_pLevelBarBar.style.top = "40px";
	m_pLevelBarBar.style.width = "46px";
	m_pLevelBarBar.style.border = "0px";
	m_pLevelBarBar.cellPadding = "0";
	m_pLevelBarBar.cellSpacing = "0";
	var pRow = m_pLevelBarBar.insertRow(-1);
	var pCell = pRow.insertCell(-1);
	pCell.style.padding = "0px";
	pCell.style.backgroundImage = "url(images/3.2/Bar/pan.png)";
	pCell.style.backgroundRepeat = "no-repeat";
	pCell.style.backgroundPosition = "center";
	function PanMove(sx, sy)
	{
		var pt = m_pMapBase.ToMapPoint(m_pMapBase.getClientWidth() * sx, m_pMapBase.getClientHeight() * sy);
		m_pMapBase.MoveMapTo(pt.X, pt.Y);
		m_pMapBase.RefreshMap(true);
	}
	function ZoomLevel(lvl)
	{
		pTrans.putMapLevel(pTrans.getMapLevel() + lvl);
		pTrans.FitLevel();
		m_pMapBase.RefreshMap(true);
	}
	
	function StartThumdDrag(tEvent)
	{
		tEvent.preventDefault();
		tEvent.returenValue = false;
		if (tEvent.srcElement == pThumbImg)
		{
			var CurPos = tEvent.clientY;
			var CurLvl = pTrans.getMapLevel();
			function ThumbDraw(tEvent)
			{
				pTrans.putMapLevel(CurLvl + (CurPos - tEvent.clientY) / StepHeight);
				m_pMapBase.RefreshMap(false);
			}
			function EndThumbDraw(tEvent)
			{
				DetachEvent(pImg, "mousemove", ThumbDraw, true);
				DetachEvent(pImg, "mouseup", EndThumbDraw, true);
				pTrans.FitLevel();
				m_pMapBase.RefreshMap(true);
			}
			AttachEvent(pImg, "mousemove", ThumbDraw, true);
			AttachEvent(pImg, "mouseup", EndThumbDraw, true);
		}
		else
		{
			pTrans.putMapLevel((pDiv.clientHeight - tEvent.offsetY) / StepHeight - .5);
			pTrans.FitLevel();
			m_pMapBase.RefreshMap(true);
		}
	}
	
	var pPad = pCell.ownerDocument.createElement("table");
	pPad.setAttribute("class", "level-pad");
	pCell.appendChild(pPad);
	var pRow1 = pPad.insertRow(-1);
	pRow1.setAttribute("class", "top-row");
	
	var pCell1 = pRow1.insertCell(-1);
	var pCell1 = pRow1.insertCell(-1);
	var pImg = pCell1.ownerDocument.createElement("img");
	pCell1.appendChild(pImg);
	pImg.src = "images/3.2/Bar/Pan_o_up.png";
	AttachEvent(pImg, "click", function()
	{
		PanMove(.5, 0);
	}, false);
	
	var pCell1 = pRow1.insertCell(-1);
	var pRow1 = pPad.insertRow(-1);
	pRow1.setAttribute("class", "middle-row");
	var pCell1 = pRow1.insertCell(-1);
	var pImg = pCell1.ownerDocument.createElement("img");
	pCell1.appendChild(pImg);
	pImg.src = "images/3.2/Bar/Pan_o_L.png";
	AttachEvent(pImg, "click", function()
	{
		PanMove(0, .5);
	}, false);
	
	var pCell1 = pRow1.insertCell(-1);
	var pCell1 = pRow1.insertCell(-1);
	var pImg = pCell1.ownerDocument.createElement("img");
	pCell1.appendChild(pImg);
	pImg.src = "images/3.2/Bar/Pan_o_R.png";
	AttachEvent(pImg, "click", function()
	{
		PanMove(1, .5);
	}, false);
	
	var pRow1 = pPad.insertRow(-1);
	pRow1.setAttribute("class", "bottom-row");
	var pCell1 = pRow1.insertCell(-1);
	var pCell1 = pRow1.insertCell(-1);
	var pImg = pCell1.ownerDocument.createElement("img");
	pCell1.appendChild(pImg);
	pImg.src = "images/3.2/Bar/Pan_o_donw.png";
	AttachEvent(pImg, "click", function()
	{
		PanMove(.5, 1);
	}, false);
	
	var pCell1 = pRow1.insertCell(-1);
	var pRow = m_pLevelBarBar.insertRow(-1);
	var pCell = pRow.insertCell(-1);
	pCell.align = "center";
	var pSlider = pCell.ownerDocument.createElement("table");
	pCell.appendChild(pSlider);
	pSlider.border = "0";
	pSlider.cellPadding = "0";
	pSlider.cellSpacing = "0";
	pSlider.width = "22";
	var pRow1 = pSlider.insertRow(-1);
	var pCell1 = pRow1.insertCell(-1);
	pCell1.height = "22";
	pCell1.vAlign = "bottom";
	pCell1.align = "center";
	pCell1.style.backgroundImage = "url(images/3.2/Bar/Bar_out.png)";
	
	var c1 = pCell1;
	AttachEvent(c1, "mouseover", function()
	{
		c1.style.backgroundImage = "url(images/3.2/Bar/Bar_o_out.png)";
	}, false);
	AttachEvent(c1, "mouseout", function()
	{
		c1.style.backgroundImage = "url(images/3.2/Bar/Bar_out.png)";
	}, false);
	AttachEvent(c1, "click", function()
	{
		ZoomLevel(1);
	}, false);
	
	var pRow1 = pSlider.insertRow(-1);
	var pCell1 = pRow1.insertCell(-1);
	pCell1.height = Math.max(1, pTrans.getMapMaxLevel()) * StepHeight + "px";
	pCell1.align = "center";
	pCell1.style.backgroundImage = "url(images/3.2/Bar/Bar_02.png)";
	var pDiv = pCell1.ownerDocument.createElement("div");
	pCell1.appendChild(pDiv);
	pDiv.style.position = "relative";
	pDiv.style.width = "22px";
	pDiv.style.height = "100%";
	var pThumbImg = pDiv.ownerDocument.createElement("img");
	pDiv.appendChild(pThumbImg);
	pThumbImg.style.position = "absolute";
	pThumbImg.src = "images/3.2/Bar/Bar.png";
	pThumbImg.style.left = "0px";
	pThumbImg.style.bottom = "0px";
	AttachEvent(pDiv, "mousedown", StartThumdDrag, false);
	var pRow1 = pSlider.insertRow(-1);
	var pCell1 = pRow1.insertCell(-1);
	pCell1.height = "22";
	pCell1.vAlign = "top";
	pCell1.align = "center";
	pCell1.style.backgroundImage = "url(images/3.2/Bar/Bar_in.png)";
	var c2 = pCell1;
	AttachEvent(c2, "mouseover", function()
	{
		c2.style.backgroundImage = "url(images/3.2/Bar/Bar_o_in.png)";
	}, false);
	AttachEvent(c2, "mouseout", function()
	{
		c2.style.backgroundImage = "url(images/3.2/Bar/Bar_in.png)";
	}, false);
	AttachEvent(c2, "click", function()
	{
		ZoomLevel(-1);
	}, false);
	this.Initialize = function(pMapBase)
	{
		m_pMapBase = pMapBase;
	};
	this.UpdateElement = function()
	{
		var ltpt = (pTrans.getMapLevel() + .5) * StepHeight - pThumbImg.clientHeight / 2;
		pThumbImg.style.bottom = ltpt + "px";
	};
	this.RebuildElement = function() {};
	this.UpdateElement();
};
var LayerInfoTool = function(parentNode, pMapBase)
{
	var mobile = CheckDevice();
	if (!mobile)
	{
		var m_ActiveObj = null;
		var m_Values = null;
		var pthat = this;
		var pLyrs = pMapBase.getLayers();
		var m_pLegends = new Array;
		
		var mNode = document.createElement("div");
		mNode.id = "Layersmenu";
		mNode.className = "toolbar";

		mNode.style.height = (document.body.clientHeight - headerHeight) + "px";
		
		parentNode.appendChild(mNode);
		
		var mNode_hrNode = document.createElement("hr");
		mNode_hrNode.style.position = "absolute";
		mNode_hrNode.style.bottom = "30px";
		mNode_hrNode.style.width = "100%";
		mNode.appendChild(mNode_hrNode);
		
		var mNode_title = document.createElement("div");
		mNode_title.className = "toolbartitle";
		var mNode_title_h2 = document.createElement("h2");
		mNode_title_h2.innerHTML = "Layers";
		var mNode_title_bkimg = document.createElement("img");
		mNode_title_bkimg.src = "images/right-arrow-of-straight-lines.png";
		AttachEvent(mNode_title_bkimg, "click", function ()
		{
			mNode.style.width = "0px";
			FindXMLNodeById(document, "Coordinate").style.zIndex = "32767";
		});
		
		mNode_title.appendChild(mNode_title_h2);
		mNode_title.appendChild(mNode_title_bkimg);
		
		mNode.appendChild(mNode_title);
		
		var mNode_hrNode = document.createElement("hr");
		mNode_hrNode.style.position = "absolute";
		mNode_hrNode.style.bottom = "30px";
		mNode_hrNode.style.width = "100%";
		mNode.appendChild(mNode_hrNode);
		
		var img_control_group = document.createElement("div");
		img_control_group.style.bottom = "5px";
		img_control_group.style.left = "0px";
		img_control_group.style.position = "absolute";
		img_control_group.style.width = "100%";
		img_control_group.style.height = "30px";
		mNode.appendChild(img_control_group);
		
		var mNode_ShowOn_img = document.createElement("img");
		mNode_ShowOn_img.src = "images/PC_OtherTool/Collapse-All20.png";
		mNode_ShowOn_img.style.float = "left";
		mNode_ShowOn_img.style.marginTop = "5px";
		mNode_ShowOn_img.style.marginLeft = "10px";
		mNode_ShowOn_img.style.height = "25px";
		mNode_ShowOn_img.style.width = "25px";
		mNode_ShowOn_img.title = "Expansion All Layers";
		AttachEvent(mNode_ShowOn_img, "click", function ()
		{
			var k = FindXMLNodesByClassName(document, "show");
			for (var i = k.length - 1 ; i >= 0 ; i--)
			{
				if(k[i].ctype == "ShowOpen")
					k[i].click();
			}
		});
		
		var mNode_ShowOff_img = document.createElement("img");
		mNode_ShowOff_img.src = "images/PC_OtherTool/Unfold-All20.png";
		mNode_ShowOff_img.style.float = "left";
		mNode_ShowOff_img.style.marginTop = "5px";
		mNode_ShowOff_img.style.marginLeft = "10px";
		mNode_ShowOff_img.style.height = "25px";
		mNode_ShowOff_img.style.width = "25px";
		mNode_ShowOff_img.title = "Retracted All Layers";
		AttachEvent(mNode_ShowOff_img, "click", function ()
		{
			var k = FindXMLNodesByClassName(document, "show");
			for (var i = k.length - 1 ; i >= 0 ; i--)
			{
				if(k[i].ctype == "ShowClose")
					k[i].click();
			}
		});
		
		img_control_group.appendChild(mNode_ShowOn_img);
		img_control_group.appendChild(mNode_ShowOff_img);
		
		var pNode = document.createElement("div");
		pNode.style.width = "100%";
		pNode.style.overflow = "auto";
		pNode.style.height = (document.body.clientHeight - headerHeight - 90) + "px";
		mNode.appendChild(pNode);
		
		var active = new ContentControl(pNode, pMapBase, pLyrs);
		active.RebuildElement();
	}
	else
	{
		var m_ActiveObj = null;
		var m_Values = null;
		var pthat = this;
		var pLyrs = pMapBase.getLayers();
		var m_pLegends = new Array;
		var checkbox_ID = 0;
		
		var mNode = document.createElement("div");
		mNode.id = "Layersmenu";
		mNode.className = "toolbar";

		mNode.style.height = "70%";
        mNode.style.width = "70%";
        mNode.style.position = "absolute";
        mNode.style.top = "20%";
        mNode.style.left ="15%";
        mNode.style.display = "none";
		parentNode.appendChild(mNode);
		
		//var mNode_hrNode = document.createElement("hr");
		//mNode_hrNode.style.position = "absolute";
		//mNode_hrNode.style.width = "100%";
		//mNode.appendChild(mNode_hrNode);
		
		//mNode_hrNode.style.bottom = "11%"; //Mobile
		
		var mNode_title = document.createElement("div");
		mNode_title.className = "toolbartitle";
		var mNode_title_h2 = document.createElement("h2");
		mNode_title_h2.innerHTML = "圖層控制";
		var mNode_title_bkimg = document.createElement("img");
		mNode_title_bkimg.src = "images/right-arrow-of-straight-lines.png";
		AttachEvent(mNode_title_bkimg, "click", function ()
		{
            mNode.style.display = "none";
		});
		
		mNode_title.appendChild(mNode_title_h2);
		mNode_title.appendChild(mNode_title_bkimg);
		
		mNode.appendChild(mNode_title);
		
		//var img_control_group = document.createElement("div");
		//img_control_group.style.bottom = "5px";
		//img_control_group.style.left = "0px";
		//img_control_group.style.position = "absolute";
		//img_control_group.style.width = "100%";
		//img_control_group.style.height = "10%";
		//mNode.appendChild(img_control_group);
		
		/*var mNode_ShowOn_img = document.createElement("img");
		mNode_ShowOn_img.src = "images/PC_OtherTool/Collapse-All20.png";
		mNode_ShowOn_img.style.float = "left";
		mNode_ShowOn_img.style.marginTop = "5px";
		mNode_ShowOn_img.style.marginLeft = "10px";
		mNode_ShowOn_img.style.height = "80%";
		mNode_ShowOn_img.style.width = "20%";
		mNode_ShowOn_img.title = "Expansion All Layers";
		AttachEvent(mNode_ShowOn_img, "click", function ()
		{
			var k = FindXMLNodesByClassName(document, "show");
			for (var i = k.length - 1 ; i >= 0 ; i--)
			{
				if(k[i].ctype == "ShowOpen")
					Properties(k[i]);
			}
		});
		
		var mNode_ShowOff_img = document.createElement("img");
		mNode_ShowOff_img.src = "images/PC_OtherTool/Unfold-All20.png";
		mNode_ShowOff_img.style.float = "left";
		mNode_ShowOff_img.style.marginTop = "5px";
		mNode_ShowOff_img.style.marginLeft = "2%";
		mNode_ShowOff_img.style.height = "80%";
		mNode_ShowOff_img.style.width = "20%";
		mNode_ShowOff_img.title = "Retracted All Layers";
		AttachEvent(mNode_ShowOff_img, "click", function ()
		{
			var k = FindXMLNodesByClassName(document, "show");
			for (var i = k.length - 1 ; i >= 0 ; i--)
			{
				if(k[i].ctype == "ShowClose")
					Properties(k[i]);
			}	
		});	
		
		img_control_group.appendChild(mNode_ShowOn_img);
		img_control_group.appendChild(mNode_ShowOff_img);*/
        
		var pNode = document.createElement("div");
		pNode.style.width = "100%";
		pNode.style.overflow = "auto";
		pNode.style.height = ((document.body.clientHeight * 0.7) - (document.body.clientHeight * 0.7 * 0.1)) + "px";
		mNode.appendChild(pNode);
		
		var Properties = function(pElem)
		{
			if (pElem.tagName == "IMG" && pElem.className == "show")
			{
				if (!pElem.m_pSubDiv)
					return;
					
				if (pElem.m_pSubDiv.style.display == "none")
				{
					pElem.src = "images/down.png";
					pElem.ctype = "ShowClose";
					pElem.m_pSubDiv.style.display = "";
				}
				else
				{
					pElem.src = "images/right.png";
					pElem.ctype = "ShowOpen";
					pElem.m_pSubDiv.style.display = "none";
				}
			}
		};
		
		
		function NewMapLegend(pNode, pCtx, pLayer, OnLegendClick)
		{
			var m_pExp = null;
			var m_pChk = null;
			var m_pImgDiv = null;
			var m_pSubDiv = null;
			var m_pLegends = null;
			var m_SelectedValue = null;
            
			var pDiv = pNode.ownerDocument.createElement("DIV");
			pNode.appendChild(pDiv);
			//pDiv.style.position = "relative";
            pDiv.style.float = "left";
			pDiv.style.textAlign = "left";
            pDiv.style.width = '100%';
            pDiv.style.paddingTop = '5px';
            pDiv.style.paddingBottom = '5px';

            pDiv.style.borderTop = '1px solid #000000';
            pDiv.style.borderBottom = '1px solid #000000';
		    	
			//var pDiv2 = pDiv.ownerDocument.createElement("DIV");
			//pDiv.appendChild(pDiv2);
			//pDiv2.style.position = "relative";
			
			if (pLayer == null)
				return;

			this.targetLayer = pLayer;
			
			var pProperties = function(tEvent)
			{
				var pElem = tEvent.srcElement ? tEvent.srcElement : tEvent.target;
				if (pElem.tagName == "IMG" && pElem.className == "show")
				{
					if (!m_pSubDiv)
						return;
					
					if (m_pSubDiv.style.display == "none")
					{
						pElem.src = "images/down.png";
						pElem.ctype = "ShowClose";
						m_pSubDiv.style.display = "";
					}
					else
					{
						pElem.src = "images/right.png";
						pElem.ctype = "ShowOpen";
						m_pSubDiv.style.display = "none";
					}
				}
				else if (pElem.tagName == "LABEL")
				{
                    if (pElem.targetLayer != pLayer)
                        return;
                    
					if (pElem.value)
                    {
						pElem.value = false;
                        pElem.style.color = '#C2C2C2';
                    }
					else if (!pElem.value)
                    {
						pElem.value = true;
                        pElem.style.color = '#000000';
					}
					pLayer.putVisible(pElem.value);
					if (pLayer.RebuildElement)
					{
						pLayer.RebuildElement();
					}
					else if (pLayer.getParent)
					{
						pLayer.getParent().RebuildElement();
					}
				}
				else if (pElem.tagName == "SPAN" && pElem.parentNode.htmlFor)
				{
					var tar = FindXMLNodeById(document, pElem.parentNode.htmlFor);
					
					if (tar.checked == true)
						tar.value = "true";
					else if(tar.checked == false)
						tar.value = "false";
					
					pLayer.putVisible(tar.checked);
					if (pLayer.RebuildElement)
					{
						pLayer.RebuildElement();
					}
					else if (pLayer.getParent)
					{
						pLayer.getParent().RebuildElement();
					}
				}
			};
            
            if (!pNode.id)
            {
                var idiv = pDiv.ownerDocument.createElement("div");
                idiv.style.width = '20%';
                idiv.style.textAlign = 'center';
                idiv.style.float = 'left';
                idiv.style.height = '53px';
                idiv.style.marginTop = '10px';
			    m_pExp = pNode.ownerDocument.createElement("IMG");
			    m_pExp.src = "images/down.png";
			    m_pExp.className = "show";
			    m_pExp.style.height = "40px";
			    m_pExp.style.width = "40px";
			    m_pExp.ctype = "ShowClose";
                idiv.appendChild(m_pExp);
			    pDiv.appendChild(idiv); 
			}
            if (pLayer.getResource)
			{
                var idiv = pDiv.ownerDocument.createElement("div");
                idiv.style.width = '20%';
                idiv.style.textAlign = 'center';
                idiv.style.float = 'left';
                idiv.style.height = '53px';
                idiv.style.marginTop = '10px';
				var img = pDiv.ownerDocument.createElement("IMG");
				img.style.minWidth = (document.body.clientWidth * 0.05) + "px";
				img.style.maxWidth = (document.body.clientWidth * 0.4) + "px";
				img.style.minHeight = (pNode.clientHeight * 0.025) + "px"; //layerimg define
                idiv.appendChild(img);
				pDiv.appendChild(idiv);
				img.src = pLayer.getResource();
			}

            AttachEvent(pDiv, "click", FuncAdapter(this, pProperties), false);
            
			var pLbl = pNode.ownerDocument.createElement("LABEL");
			pLbl.style.fontSize = "38pt";
            pLbl.style.display = 'block';
            pLbl.style.float = 'left';
            pLbl.value = true;  
            pLbl.targetLayer = pLayer;      
            
            if (!pNode.id)
                pLbl.className = 'ShowLayerLabel';
            
			pDiv.appendChild(pLbl);
			if (pLayer.getTitle)
				pLbl.innerHTML = pLayer.getTitle();
			else if (pLayer.getName)
				pLbl.innerHTML = pLayer.getName();
			
			if (m_pSubDiv == null)
			{
				m_pSubDiv = pDiv.ownerDocument.createElement("DIV");
				pDiv.appendChild(m_pSubDiv);
                m_pSubDiv.id = 'subdiv';
                m_pSubDiv.style.width = '100%';
                m_pSubDiv.style.float = '50px';
                m_pSubDiv.style.float = 'left';
                if (m_pExp)
				    m_pExp.m_pSubDiv = m_pSubDiv;
			}
			this.selectedValue = function()
			{
				return m_SelectedValue;
			};
			this.getHandle = function()
			{
				return pDiv;
			};
			this.getLayer = function()
			{
				return pLayer;
			};
			this.CreateSubLegend = function(pLyr, OnLegendClick)
			{
				var pLgd = new NewMapLegend(m_pSubDiv, pCtx, pLyr, OnLegendClick);
				if (m_pLegends == null)
					m_pLegends = new Array;
                
				m_pLegends.push(pLgd);
				this.legends = m_pLegends;
				return pLgd;
			};
			this.Deactive = function()
			{
				pDiv2.style.background = "";
			};
			this.Active = function()
			{
				pDiv2.style.background = "gray";
			};
			this.FinalRelease = function()
			{
				if (m_pLegends)
				{
					for (var i = 0;i < m_pLegends.length;i++)
						m_pLegends[i].FinalRelease();
				}	
				m_pLegends = null;
				pNode.removeChild(pDiv);
			};
			if (pLayer.CreateLegend)
			{
				//pDiv.style.marginTop = "15px";
				//var move_to_layer = document.createElement("IMG");
				//move_to_layer.src = "images/PC_OtherTool/Go-Search.png";
				//move_to_layer.style.marginRight = "3%";
				//move_to_layer.style.marginTop = "2%";
				//move_to_layer.style.float = "right";
				//move_to_layer.style.height = "10%";
				//move_to_layer.style.width = "10%";
				//pDiv2.appendChild(move_to_layer);
				//AttachEvent(move_to_layer, "touchstart", function ()
				//{
				//	var top = pLayer.getTop();
				//	var left = pLayer.getLeft();
				//	var bottom = pLayer.getBottom();
				//	var right = pLayer.getRight();
				//	var extent = new sg.geometry.Extent;
				//	extent.xmax = right;
				//	extent.xmin = left;
				//	extent.ymax = top;
				//	extent.ymin = bottom;
					
				//	var ani;
				//	var da = pMapBase.getAngle() % 360;
				//	ani = new sg.fx.createAnimation(
				//	{
				//		easing:sg.fx.easing.quadOut,
				//		onAnimation:function(e)
				//		{
				//			var an = da * (1 - e);
				//			pMapBase.setAngle(an);
				//		},
				//		onEnd:function()
				//		{
				//			pMapBase.setAngle(0);
				//			ani = null;
				//		}
				//	});
				//	ani.play();
					
				//	pMapBase.ZoomMapTo(extent);
				//	pMapBase.RefreshMap(true);
				//});
				//var hrNode = document.createElement("hr");
				//hrNode.style.width = "95%";
				//pDiv2.appendChild(hrNode);
				pLayer.CreateLegend(this);
			}
			else if (pLayer.title == "Drawing Layer" || pLayer.title == "OpenStreetMapLayer")
			{
				//pDiv.style.marginTop = "15px";
				//var move_to_layer = document.createElement("IMG");
				//move_to_layer.src = "images/PC_OtherTool/Go-Search.png";
				//move_to_layer.style.marginRight = "3%";
				//move_to_layer.style.marginTop = "2%";
				//move_to_layer.style.float = "right";
				//move_to_layer.style.height = "10%";
				//move_to_layer.style.width = "10%";
				//pDiv2.appendChild(move_to_layer);
				//var hrNode = document.createElement("hr");
				//hrNode.style.width = "95%";
				//pDiv2.appendChild(hrNode);
			}
		}
		
		function NewContentControl(pParentElem, pMapBase)
		{
			var m_ActiveObj = null;
			var m_Values = null;
			var that = this;
			this.RebuildElement = function()
			{
				if (m_pLegends)
				{
					for (var i = 0;i < m_pLegends.length;i++)
						m_pLegends[i].FinalRelease();
				}
				m_pLegends = new Array;
                var title = document.createElement('div');
                title.style.width = '100%';
                title.style.height = '79px';
                //title.style.float = 'left';
                title.style.position = 'relative';
                title.style.textAlign = 'left';
                var label1 = document.createElement('label');
                var label2 = document.createElement('label');
                label1.innerHTML = '樣式';
                label2.innerHTML = '圖層';
                label1.style.width = '20%';
                label1.style.display = 'block';
                label1.style.float = 'left';
                label1.style.fontSize = '38pt';
                label1.style.textAlign = 'center';
                //label1.style.paddingLeft = '5%';
                label2.style.display = 'block';
                label2.style.float = 'left';
                label2.style.fontSize = '38pt';
                title.appendChild(label1);
                title.appendChild(label2);
                m_hObj.appendChild(title);
				for (var i = 0 ; i < pLyrs.length ; i++)
				{
					if (!pLyrs[i].hideLegend && pLyrs[i].getTitle() != "Graphics Layer" && pLyrs[i].getName() != "Graphics Layer" )
					{
						var lgn = new NewMapLegend(m_hObj, that, pLyrs[i]);
						m_pLegends.push(lgn);
						if (m_ActiveObj && m_ActiveObj.Active)
						{
							if (m_ActiveObj.targetLayer == pLyrs[i])
							{
								lgn.Active();
								m_ActiveObj = lgn;
								break;
							}
							if (lgn.legends)
							{
								for (var l = 0 ; l < lgn.legends.length ; l++)
								{
									var subLgn = lgn.legends[l];
									if (m_ActiveObj.targetLayer == subLgn.targetLayer)
									{
										subLgn.Active();
										m_ActiveObj = subLgn;
										break;
									}
								}
							}
						}
					}
				}
			};
			this.getActive = function()
			{
				return m_ActiveObj;
			};
			this.putActive = function(newVal)
			{
				if (m_ActiveObj != null && m_ActiveObj.Deactive)
					m_ActiveObj.Deactive();
				
				m_ActiveObj = newVal;
                
				if (m_ActiveObj != null && m_ActiveObj.Active)
					m_ActiveObj.Active();
				
			};
			this.getValues = function()
			{
				return m_Values;
			};
			this.setValues = function(values)
			{
				m_Values = values;
			};
			var m_pLegends = null;
			var m_hObj;
			m_hObj = pParentElem.ownerDocument.createElement("span");
			pParentElem.appendChild(m_hObj);
			m_hObj.style.fontSize = "60pt";
			m_hObj.style.width = "100%";
			m_hObj.style.height = "100%";
			pMapBase.on("load", this.RebuildElement);
			pMapBase.on("layer-add", this.RebuildElement);
			pMapBase.on("layer-remove", this.RebuildElement);
			pMapBase.on("layers-removed", this.RebuildElement);
		}
		var active = new NewContentControl(pNode, pMapBase);
		active.RebuildElement();
	}
};