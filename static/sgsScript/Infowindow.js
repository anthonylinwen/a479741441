(function()
{
	sg.InfoTemplate = sg.Class.extend(
	{
		"initialize": function(title, content)
		{
			this.title = title ? title : "Info";
			this.content = content ? content : "";
		},
		"setContent": function(content)
		{
			this.content = content;
		},
		"setTitle": function(title)
		{
			this.title = title;
		}
	});
	sg.InfoWindowBase = sg.Class.extend(
	{
		"domNode": null,
		"isShowing": false,
		"setMap": function(map)
		{
			this.map = map;
			this.map.AddElement(this);
		},
		"setTitle": function(title)
		{
			this.title = title;
		},
		"setContent": function(content)
		{
			this.content = content;
		},
		"show": function(location)
		{
		},
		"hide": function()
		{
		},
		"resize": function(width, height)
		{
		},
		"unsetMap": function()
		{
		},
		"unsetMap": function()
		{
			if (this.map === map)
				this.map = null;
		},
		"events":["hide", "show"]
	});
	sg.InfoWindow = sg.InfoWindowBase.extend(
	{
		"initialize": function(params, parent)
		{
			if (!parent)
				return;
			var that = this;
			this.domNode = parent.ownerDocument.createElement("div");
			parent.appendChild(this.domNode);
			this.domNode.className = "sgInfoWindow";
			AttachEvent(this.domNode, "mousedown", function(e)
			{
				var scrX = e.screenX;
				var scrY = e.screenY;
				var ileft = that.domNode.offsetLeft;
				var itop = that.domNode.offsetTop;
				var moved = false;
				
				var drag = function(e)
				{
					if (!moved && e.screenX === scrX && e.screenY === scrY)
					{
						moved = true;
						return;
					}
					that.domNode.style.left = ileft + (e.screenX - scrX) + "px";
					that.domNode.style.top = itop + (e.screenY - scrY) + "px";
				};
				var dragEnd = function(e)
				{
					DetachEvent(that.domNode.ownerDocument, "mousemove", drag);
					DetachEvent(that.domNode.ownerDocument, "mouseup", dragEnd);
				};
				that.pointerContainer.setAttribute("class", "");
				sg.addClass(that.pointerContainer, "none-pointer");
				
				AttachEvent(that.domNode.ownerDocument, "mousemove", drag);
				AttachEvent(that.domNode.ownerDocument, "mouseup", dragEnd);
			});
			this.closeNode = document.createElement("div");
			this.closeNode.className = "close";
			this.closeNode.innerHTML = "\u2a2f";
			AttachEvent(this.closeNode, "click", function ()
			{
				if (that.setcloseEvent)
					that.setcloseEvent();
				that.hide();
			});
			this.hideNode = document.createElement("div");
			this.hideNode.className = "hide";
			this.hideNode.innerHTML = "-";
			AttachEvent(this.hideNode, "click", function ()
			{
				if (that.contentIsShowing)
				{
					that.contentNode.style.display = "none";
					that.contentIsShowing = false;
				}
				else
				{
					that.contentNode.style.display = "block";
					that.contentIsShowing = true;
				}
			});
			
			this.titleNode = document.createElement("div");
			this.titleNode.className = "title";
			this.titleNode.style.width = "240px";
			this.titleNode.innerHTML = "InfoWindow";
			this.contentNode = document.createElement("div");
			this.contentNode.className = "content";
			this.contentNode.style.width = "240px";
			this.contentNode.innerHTML = " ";
			this.contentNode.style.overflow = "auto";
			this.domNode.style.display = "none";
			this.isShowing = false;
			this.contentIsShowing = true;
			this.pointerContainer = document.createElement("div");
			this.pointerElem = document.createElement("div");
			sg.addClass(this.pointerElem, "pointer");
			this.pointerContainer.appendChild(this.pointerElem);
			this.domNode.appendChild(this.pointerContainer);
			this.domNode.appendChild(this.titleNode);
			this.domNode.appendChild(this.contentNode);
			this.domNode.appendChild(this.closeNode);
			this.domNode.appendChild(this.hideNode);
		},
		"move": function(point)
		{
			if (!point instanceof sg.geometry.Point)
				return;
			this.location = point;
			this.update();
		},
		"setTitle": function(title)
		{
			this.title = title;
			if (this.titleNode)
				this.titleNode.innerHTML = this.title;
		},
		"setContent": function(content)
		{
			this.content = content;
			if (this.contentNode)
			{
				if (sg.isElement(content))
				{
					this.contentNode.innerHTML = "";
					this.contentNode.appendChild(content);
				}
				else if (sg.isString(content))
					this.contentNode.innerHTML = this.content;
			}
		},
		"getInfoWindowAnchor": function(sp)
		{
			if (!this.map)
				return;
			var infoWidth = this.domNode.offsetWidth;
			var infoHeight = this.domNode.offsetHeight;
			var cWidth = this.map.getClientWidth();
			var cHeight = this.map.getClientHeight();
			var mapAngle = this.map.getAngle();
			if (mapAngle)
			{
				var hcw = this.map.getClientWidth() / 2;
				var hch = this.map.getClientHeight() / 2;
				var tm = sg.math.Matrix.translate(hcw, hch);
				var tm2 = sg.math.Matrix.translate(-hcw, -hch);
				var rm = sg.math.Matrix.rotate(mapAngle);
				var tr = tm.product(rm).product(tm2).transform(sp.X, sp.Y);
				sp.X = tr.x;
				sp.Y = tr.y;
			}
			var left = sp.X - infoWidth / 2 - this.pointerOffset;
			var right = sp.X + infoWidth / 2 + this.pointerOffset;
			var top = sp.Y - infoHeight - this.pointerOffset;
			var bottom = sp.Y + infoHeight + this.pointerOffset;
			var hpos = "MIDDLE";
			if (right > cWidth)
				hpos = "LEFT";
			else if (left < 0)
				hpos = "RIGHT";
			
			var vpos = "CENTER";
			if (top < 0)
				vpos = "BOTTOM";
			else if (bottom > cHeight)
				vpos = "TOP";
			return hpos + "_" + vpos;
		},
		"show": function(location, anchor)
		{
			if (!this.domNode)
				return;
			this.domNode.style.visibility = "hidden";
			this.domNode.style.display = "";
			this.location = location;
			this.isShowing = true;
			var pt = this.map.FromMapPoint(this.location.x, this.location.y);
			if (anchor)
				this.anchor = anchor;
			if (!this.fixedAnchor)
				this.anchor = this.getInfoWindowAnchor(pt);
			this.pointerContainer.setAttribute("class", "");
			switch(this.anchor)
			{
				case "MIDDLE_BOTTOM":
					sg.addClass(this.pointerContainer, "top-pointer");
					break;
				case "LEFT_BOTTOM":
					sg.addClass(this.pointerContainer, "right-top-pointer");
					break;
				case "RIGHT_BOTTOM":
					sg.addClass(this.pointerContainer, "left-top-pointer");
					break;
				case "LEFT_CENTER":
					sg.addClass(this.pointerContainer, "right-pointer");
					break;
				case "RIGHT_CENTER":
					sg.addClass(this.pointerContainer, "left-pointer");
					break;
				case "LEFT_TOP":
					sg.addClass(this.pointerContainer, "right-bottom-pointer");
					break;
				case "MIDDLE_TOP":
					sg.addClass(this.pointerContainer, "bottom-pointer");
					break;
				case "RIGHT_TOP":
					sg.addClass(this.pointerContainer, "left-bottom-pointer");
					break;
				default:
					sg.addClass(this.pointerContainer, "bottom-pointer");
					break;
			}
			this.update();
			this.domNode.style.visibility = "visible";
			this.trigger("show", this);
		},
		"hide": function()
		{
			if (this.domNode)
				this.domNode.style.display = "none";
			this.isShowing = false;
			this.trigger("hide", this);
		},
		"setCloseEvent": function(setEvent)
		{
			this.setcloseEvent = setEvent;
		},
		"resize": function(width, height)
		{
			if (!this.domNode)
				return;
			this.titleNode.style.width = width + "px";
			this.contentNode.style.width = width + "px";
			//this.contentNode.style.height = height + "px";
		},
		"UpdateElement": function()
		{
			this.update();
		},
		"anchor": "MIDDLE_TOP",
		"offsetX": 0,
		"setOffsetX": function(param)
		{
			if (typeof param == "number")
				this.setOffestX = param;
			this.update();
		},
		"offsetY": 0,
		"setOffsetY": function(param)
		{
			if (typeof param == "number")
				this.setOffsetY = param;
			this.update();
		},
		"pointerOffset": 22,
		"fixedAnchor": false,
		"update": function()
		{
			if (!this.map || !this.location || !this.isShowing)
				return;
			var clientHeight = this.map.getClientHeight();
			
			if (this.contentNode.offsetHeight >= clientHeight * .8)
				this.contentNode.style.height = clientHeight * .5 + "px";
			var pt = this.map.FromMapPoint(this.location.x, this.location.y);
			var mapAngle = this.map.getAngle();
			if (mapAngle)
			{
				var hcw = this.map.getClientWidth() / 2;
				var hch = this.map.getClientHeight() / 2;
				var tm = sg.math.Matrix.translate(hcw, hch);
				var tm2 = sg.math.Matrix.translate(-hcw, -hch);
				var rm = sg.math.Matrix.rotate(mapAngle);
				var tr = tm.product(rm).product(tm2).transform(pt.X, pt.Y);
				pt.X = tr.x;
				pt.Y = tr.y;
			}
			var left = pt.X;
			var top = pt.Y;
			this.pointerContainer.setAttribute("class", "");
			switch(this.anchor)
			{
				case "MIDDLE_BOTTOM":
					sg.addClass(this.pointerContainer, "top-pointer");
					left = left - this.domNode.offsetWidth / 2;
					top = top + this.pointerOffset;
					break;
				case "LEFT_BOTTOM":
					sg.addClass(this.pointerContainer, "right-top-pointer");
					left = left - this.domNode.offsetWidth - this.pointerOffset;
					top -= 48;
					break;
				case "RIGHT_BOTTOM":
					sg.addClass(this.pointerContainer, "left-top-pointer");
					left = left = pt.X + this.pointerOffset;
					top -= 48;
					break;
				case "LEFT_CENTER":
					sg.addClass(this.pointerContainer, "right-pointer");
					left = left - this.domNode.offsetWidth - this.pointerOffset;
					top = top - this.domNode.offsetHeight / 2;
					break;
				case "RIGHT_CENTER":
					sg.addClass(this.pointerContainer, "left-pointer");
					left = left + this.pointerOffset;
					top = top - this.domNode.offsetHeight / 2;
					break;
				case "LEFT_TOP":
					sg.addClass(this.pointerContainer, "right-bottom-pointer");
					left = left - this.domNode.offsetWidth - this.pointerOffset;
					top = top - this.domNode.offsetHeight + 48;
					break;
				case "MIDDLE_TOP":
					sg.addClass(this.pointerContainer, "bottom-pointer");
					left = left - this.domNode.offsetWidth / 2;
					top = top - this.domNode.offsetHeight - this.pointerOffset;
					break;
				case "RIGHT_TOP":
					sg.addClass(this.pointerContainer, "left-bottom-pointer");
					left = left + this.pointerOffset;
					top = top - this.domNode.offsetHeight + 48;
					break;
				default:
					sg.addClass(this.pointerContainer, "bottom-pointer");
					left = left - this.domNode.offsetWidth / 2;
					top = top - this.domNode.offsetHeight - this.pointerOffset;
					break;
			}
			this.domNode.style.left = left + "px";
			this.domNode.style.top = top + "px";
		},
		statics:
		{
			"MIDDLE_BOTTOM":"MIDDLE_BOTTOM",
			"LEFT_BOTTOM":"LEFT_BOTTOM",
			"RIGHT_BOTTOM":"RIGHT_BOTTOM",
			"LEFT_CENTER":"LEFT_CENTER",
			"RIGHT_CENTER":"RIGHT_CENTER",
			"LEFT_TOP":"LEFT_TOP",
			"MIDDLE_TOP":"MIDDLE_TOP",
			"RIGHT_TOP":"RIGHT_TOP"
		}
	});
})();