MapLayer.enumFeatureType = {Unknown:0, Point:1, LineString:2, Polygon:3};
function MapLayer(sName, ResourcePath)
{
	var pThis = this;
	var m_pMap = null;
	var m_Name = sName;
	var m_Title = sName;
	var m_dLeft = 0;
	var m_dTop = 0;
	var m_dRight = 1;
	var m_dBottom = 1;
	var m_Visible = true;
	var m_ImgLeft = 0;
	var m_ImgTop = 0;
	var m_ImgRight = 0;
	var m_ImgBottom = 0;
	var m_CurLeft = 0;
	var m_CurTop = 0;
	var m_CurRight = 0;
	var m_CurBottom = 0;
	var m_Version = 0;
	var m_Session = new Date;
	var m_hImage = null;
	var layerNode = null;
	var m_MapLayers = new Array;
	var m_ThematicLayer = null;
	var overlay_ = "";
	var opacity_ = 1;
	var overTransColor_ = null;
	var drawingOptions = null;
	var m_Unit = "";
	this.increaseVersion = function()
	{
		m_Version++;
	};
	this.getName = function()
	{
		return m_Name;
	};
	this.putName = function(newVal)
	{
		m_Name = newVal;
	};
	this.getTitle = function()
	{
		return m_Title;
	};
	this.putTitle = function(newVal)
	{
		m_Title = newVal;
	};
	this.getVisible = function()
	{
		return m_Visible;
	};
	this.putVisible = function(newVal)
	{
		m_Visible = newVal;
		if (layerNode)
			layerNode.style.visibility = newVal ? "" : "hidden";
	};
	this.getResourcePath = function()
	{
		return ResourcePath;
	};
	this.getNode = function()
	{
		return layerNode;
	};
	this.getLeft = function()
	{
		return m_dLeft;
	};
	this.getTop = function()
	{
		return m_dTop;
	};
	this.getRight = function()
	{
		return m_dRight;
	};
	this.getBottom = function()
	{
		return m_dBottom;
	};
	this.getLayers = function()
	{
		return m_MapLayers;
	};
	this.getThematicLayer = function()
	{
		return m_ThematicLayer;
	};
	this.setOverlay = function(overlay, overTransColor)
	{
		overlay_ = overlay;
		overTransColor_ = overTransColor;
	};
	this.setOpacity = function(opacity)
	{
		if (isNaN(opacity))
			return;
		opacity_ = parseFloat(opacity);
	};
	this.setLayerDrawingOption = function(layer, option)
	{
		if (drawingOptions == null)
			drawingOptions = {};
		if (typeof layer != "string")
			throw "Layer name must be a string";
		drawingOptions[layer] = option;
	};
	function innerMapLayer(pLyrXMLNode)
	{
		var m_Visible = true;
		var m_Fields = null;
		var m_FieldsType = null;
		var m_Name = "";
		var m_SRName = "";
		var m_UniqueSymbols = null;
		var m_Editable = false;
		var m_FeatureType = 0;
		var m_TableRelates = null;
		if (pLyrXMLNode)
		{
			m_Name = GetXMLNodeAttribute(pLyrXMLNode, "Name");
			m_FeatureType = parseInt(GetXMLNodeAttribute(pLyrXMLNode, "FeatureType"));
			m_Editable = GetXMLNodeAttribute(pLyrXMLNode, "Editable") == "True";
			m_SRName = GetXMLNodeAttribute(pLyrXMLNode, "SRName");
		}
		var m_Title = m_Name;
		var pFlds = FindXMLNodes(GetXMLChildNode(pLyrXMLNode, "Fields"), "Field");
		if (pFlds)
		{
			m_Fields = new Array;
			m_FieldsType = new Array;
			for (var i = 0 ; i < pFlds.length ; i++)
			{
				m_Fields.push(GetXMLNodeAttribute(pFlds.item(i), "Name"));
				m_FieldsType.push(GetXMLNodeAttribute(pFlds.item(i), "Type"));
			}
		}
		var pLegend = GetXMLChildNode(pLyrXMLNode, "Legend");
		if (pLegend)
		{
			m_UniqueSymbols = {};
			var pLegendField = pLegend.getElementsByTagName("Field")[0];
			var pDefault = pLegend.getElementsByTagName("Default")[0];
			var pSymbols = pLegend.getElementsByTagName("Symbol");
			if (pDefault)
				m_UniqueSymbols.defaultSymbol = pDefault.getAttribute("Label");
			if (pLegendField)
			{
				m_UniqueSymbols.field = {};
				m_UniqueSymbols.field.alias = pLegendField.getAttribute("Alias");
				m_UniqueSymbols.field.value = pLegendField.childNodes[0].nodeValue;
			}
			if (pSymbols)
			{
				m_UniqueSymbols.symbols = [];
				for (var i = 0 ; i < pSymbols.length ; i++)
				{
					var sym = {};
					sym.label = pSymbols[i].getAttribute("Label");
					sym.value = pSymbols[i].getElementsByTagName("Value")[0].childNodes[0].nodeValue;
					m_UniqueSymbols.symbols.push(sym);
				}
			}
		}
		var relatedTables = GetXMLChildNode(pLyrXMLNode, "TableRelates");
		if (relatedTables)
		{
			var relatedTablNodes = FindXMLNodes(relatedTables, "TableRelate");
			if (relatedTablNodes.length > 0)
			{
				m_TableRelates = [];
				for (var t = 0 ; t < relatedTablNodes.length ; t++)
				{
					var relatedTabl = relatedTablNodes[t];
					var rtObj =
					{
						"name": GetXMLNodeAttribute(relatedTabl, "Name"),
						"title": GetXMLNodeAttribute(relatedTabl, "Title"),
						"targetField": GetXMLNodeAttribute(relatedTabl, "TargetField"),
						"sourceField": GetXMLNodeAttribute(relatedTabl, "SourceField")
					};
					m_TableRelates.push(rtObj);
				}
			}
		}
		this.getTableRelates = function()
		{
			return m_TableRelates;
		};
		this.isEditable = function()
		{
			return m_Editable;
		};
		this.getName = function()
		{
			return m_Name;
		};
		this.putName = function(newVal)
		{
			m_Name = newVal;
		};
		this.getTitle = function()
		{
			return m_Title;
		};
		this.putTitle = function(newVal)
		{
			m_Title = newVal;
		};
		this.getFields = function()
		{
			return m_Fields;
		};
		this.getFieldsType = function()
		{
			return m_FieldsType;
		};
		this.getFeatureType = function()
		{
			return m_FeatureType;
		};
		this.getSRName = function()
		{
			return m_SRName;
		};
		this.getParent = function()
		{
			return pThis;
		};
		this.setVisible = function(visible)
		{
			if (typeof visible == "boolean")
				m_Visible = visible;
		};
		this.putVisible = function(visible)
		{
			this.setVisible(visible);
		};
		this.getVisible = function()
		{
			return m_Visible;
		};
		this.getResource = function(symIdx)
		{
			if (typeof symIdx == "number")
				return ResourcePath + "/GetLegend?Layer=" + encodeURIComponent(this.getName()) + "&Legend=" + symIdx;
			else
				return ResourcePath + "/GetLegend?Layer=" + encodeURIComponent(this.getName());
		};
		this.getUniqueSymbols = function()
		{
			return m_UniqueSymbols;
		};
		this.queryRelatedFeatures = function(relationName, gid, pSucceed, pFailed)
		{
			if (!m_TableRelates)
				return;
			pAgent = new AjaxAgent(ResourcePath + "/QueryRelatedTable", true, true);
			pAgent.SendRequest("Layer=" + encodeURIComponent(this.getName()) + "&RelationName=" + relationName + "&GID=" + gid, pSucceed, null, pFailed);
		};
		this.ExecuteQuery = function(expr, bGeom, pSucceed, pFailed)
		{
			pAgent = new AjaxAgent(ResourcePath + "/Query", true, true);
			pAgent.SendRequest("V=" + m_Version + "&S=" + m_Session.valueOf() + "&Layer=" + encodeURIComponent(this.getName()) + (bGeom ? "&GEOM=" : "&EXPR=") + encodeURIComponent(expr), pSucceed, null, pFailed);
		};
		this.ExecuteUpdate = function(sID, sGeom, sValues, pSucceed, pFailed)
		{
			//pAgent = new AjaxAgent(ResourcePath + "/Update", false, true);
			//pAgent.SendRequest("V=" + m_Version + "&S=" + m_Session.valueOf() + "&Layer=" + encodeURIComponent(this.getName()) + "&ID=" + sID + "&GEOM=" + sGeom + "&Values=" + encodeURIComponent(sValues), pSucceed, null, pFailed);
			pAgent = new AjaxAgent(ResourcePath + "/Update", false, false);
			pAgent.SetHeader("Content-Type", "text/xml");
			var pDoc = document.implementation.createHTMLDocument("UpdateRequest");
			WriteXmlDocNode(pDoc, "Layer", this.getName());
			WriteXmlDocNode(pDoc, "sID", sID);
			WriteXmlDocNode(pDoc, "sGeom", sGeom);
			WriteXmlDocNode(pDoc, "sValues", sValues);
			pAgent.SendRequest(pDoc, pSucceed, null, pFailed);
			Reget();
		};
		this.ExecuteDelete = function(sID, pSucceed, pFailed)
		{
			pAgent = new AjaxAgent(ResourcePath + "/Delete", false, true);
			pAgent.SendRequest("V=" + m_Version + "&S=" + m_Session.valueOf() + "&Layer=" + encodeURIComponent(this.getName()) + "&ID=" + sID, pSucceed, null, pFailed);
			Reget();
		};
		this.setRenderer = function(renderer)
		{
			this.renderer = renderer;
		};
	}
	this.Initialize = function(pMap)
	{
		m_pMap = pMap;
		var pNode = m_pMap.getHObject();
		layerNode = pNode.ownerDocument.createElement("div");
		layerNode.style.position = "absolute";
		layerNode.style.width = "100%";
		layerNode.style.height = "100%";
		m_hImage = pNode.ownerDocument.createElement("img");
		layerNode.appendChild(m_hImage);
		pNode.appendChild(layerNode);
		m_hImage.galleryImg = false;
		m_hImage.hideFocus = true;
		m_hImage.style.MozUserSelect = "none";
		m_hImage.border = "0px";
		m_hImage.style.position = "absolute";
		m_hImage.style.width = "100%";
		m_hImage.style.height = "100%";
		m_hImage.style.visibility = m_Visible ? "" : "hidden";
		m_hImage.style.opacity = opacity_;
		m_hImage.style.filter = "alpha(opacity=" + opacity_ * 100 + ")";
		m_hImage.onmousedown = function()
		{
			return false;
		};
		m_hImage.galleryImg = false;
	};
	this.RemoveSelf = function()
	{
		if (m_hImage == null)
			return;
		if (m_pMap != null)
		{
			var pNode = m_pMap.getHObject();
			pNode.removeChild(layerNode);
		}
		m_hImage = null;
	};
	this.UpdateElement = function()
	{
		var ltpt = m_pMap.FromMapPoint(m_ImgLeft, m_ImgTop);
		var rbpt = m_pMap.FromMapPoint(m_ImgRight, m_ImgBottom);
		m_hImage.style.width = Math.round(Math.abs(rbpt.X - ltpt.X)) + "px";
		m_hImage.style.height = Math.round(Math.abs(rbpt.Y - ltpt.Y)) + "px";
		m_hImage.style.left = Math.round(Math.min(ltpt.X, rbpt.X)) + "px";
		m_hImage.style.top = Math.round(Math.min(ltpt.Y, rbpt.Y)) + "px";
	};
	var pCheckLoaded = function()
	{
		m_ImgLeft = m_CurLeft;
		m_ImgTop = m_CurTop;
		m_ImgRight = m_CurRight;
		m_ImgBottom = m_CurBottom;
		
		if (pThis.UpdateElement)
			pThis.UpdateElement();
	};
	this.RebuildElement = function()
	{
		if (this.getVisible() == false)
			return;
		var ecr = m_pMap.getExtendedClientRect();
		var viewport = m_pMap.getExtendedViewport();
		m_CurLeft = viewport.xmin;
		m_CurTop = viewport.ymax;
		m_CurRight = viewport.xmax;
		m_CurBottom = viewport.ymin;
		var layers = "";
		for (var l = 0 ; l < m_MapLayers.length ; l++)
		{
			if (m_MapLayers[l].getVisible())
				layers += l + "|";
		}
		var mapurl = "/GetImage?V=" + m_Version + "&S=" + m_Session.valueOf() + "&Width=" + Math.round(ecr.getWidth()) + "&Height=" + Math.round(ecr.getHeight()) + "&Left=" + m_CurLeft + "&Top=" + m_CurTop + "&Right=" + m_CurRight + "&Bottom=" + m_CurBottom + "&overlay=" + overlay_ + "&layers=" + layers;
		if (this.dynamicLayer)
		{
			var dynamicLayerXml = "<DynamicLayers>";
			for (var l = 0 ; l < m_MapLayers.length ; l++)
			{
				if (m_MapLayers[l].renderer && m_MapLayers[l].renderer instanceof sg.renderers.Renderer)
					dynamicLayerXml += "<DynamicLayer>" + "<Name>" + m_MapLayers[l].getName() + "</Name>" + m_MapLayers[l].renderer.toXml() + "</DynamicLayer>";
			}
			dynamicLayerXml += "</DynamicLayers>";
			mapurl += "&dynamicLayers=" + encodeURIComponent(dynamicLayerXml);
		}
		if (overTransColor_)
			mapurl += "&transcolor=" + overTransColor_;
		m_hImage.onload = pCheckLoaded;
		m_hImage.src = ResourcePath + mapurl;
	};
	var pLyrProperties = function(tEvent)
	{
		var pElem = tEvent.srcElement ? tEvent.srcElement : tEvent.target;
		if (pElem.tagName == "INPUT")
		{
			this.putVisible(pElem.checked);
			this.RebuildElement();
		}
	};
	var OnLegendClick = function(tEvent, pLayer)
	{
		m_ThematicLayer = pLayer;
	};
	this.CreateLegend = function(pLgd)
	{
		for (var i = 0;i < m_MapLayers.length;i++)
			pLgd.CreateSubLegend(m_MapLayers[i], OnLegendClick);
	};
	this.ExecuteQuery = function(expr, bGeom, pSucceed, pFailed)
	{
		if (m_ThematicLayer == null)
			return;
		return m_ThematicLayer.ExecuteQuery(expr, bGeom, pSucceed, pFailed);
	};
	this.ExecuteUpdate = function(sID, sGeom, sValues, pSucceed, pFailed)
	{
		if (m_ThematicLayer == null)
			return;
		return m_ThematicLayer.ExecuteUpdate(sID, sGeom, sValues, pSucceed, pFailed);
	};
	this.ExecuteDelete = function(sID, pSucceed, pFailed)
	{
		if (m_ThematicLayer == null)
			return;
		return m_ThematicLayer.ExecuteDelete(sID, pSucceed, pFailed);
	};
	this.getFeatureType = function()
	{
		if (m_ThematicLayer == null)
			return;
		return m_ThematicLayer.getFeatureType();
	};
	this.getFields = function()
	{
		if (m_ThematicLayer == null)
			return;
		return m_ThematicLayer.getFields();
	};
	this.toJson = function()
	{
		var json = 
		{
			type: "MapLayer",
			url: ResourcePath
		};
		if (m_MapLayers)
		{
			json.layers = [];
			for (var i = 0 ; i < m_MapLayers.length ; i++)
			{
				var subLayer = m_MapLayers[i];
				json.layers.push({name:subLayer.getName(), visible:subLayer.getVisible()});
			}
		}
		return json;
	};
	this.getUnit = function()
	{
		return m_Unit;
	};
	function Reget()
	{
		m_Version++;
		var pAgent = new AjaxAgent(ResourcePath, false, true);
		pAgent.SendRequest("V=" + m_Version + "&S=" + m_Session.valueOf(), function(pRequest)
		{
			var pDoc = pRequest.responseXML;
			var pNodeInfo = GetXMLChildNode(pDoc.documentElement, "Infomation");
			var pEnv = GetXMLChildNode(pNodeInfo, "Envelope");
			m_dLeft = parseFloat(GetXMLNodeAttribute(pEnv, "Left"));
			m_dTop = parseFloat(GetXMLNodeAttribute(pEnv, "Top"));
			m_dRight = parseFloat(GetXMLNodeAttribute(pEnv, "Right"));
			m_dBottom = parseFloat(GetXMLNodeAttribute(pEnv, "Bottom"));
			pThis.RebuildElement();
		});
	}
	m_MapLayers = new Array;
	var pAgent = new AjaxAgent(ResourcePath, false, true);
	pAgent.SendRequest("V=" + m_Version + "&S=" + m_Session.valueOf(), function(pRequest)
	{
		var pDoc = pRequest.responseXML;
		var pNodeInfo = GetXMLChildNode(pDoc.documentElement, "Infomation");
		var pEnv = GetXMLChildNode(pNodeInfo, "Envelope");
		m_dLeft = parseFloat(GetXMLNodeAttribute(pEnv, "Left"));
		m_dTop = parseFloat(GetXMLNodeAttribute(pEnv, "Top"));
		m_dRight = parseFloat(GetXMLNodeAttribute(pEnv, "Right"));
		m_dBottom = parseFloat(GetXMLNodeAttribute(pEnv, "Bottom"));
		var unitNode = GetXMLChildNode(pNodeInfo, "Unit");
		if (unitNode)
			m_Unit = unitNode.childNodes[0].nodeValue;
		
		var pLyrs = FindXMLNodes(GetXMLChildNode(pNodeInfo, "Layers"), "Layer");
		if (pLyrs)
			for (var i = 0 ; i < pLyrs.length ; i++)
				m_MapLayers.push(new innerMapLayer(pLyrs.item(i)));
	});
	if (m_MapLayers.length == 0)
		m_MapLayers.push(new innerMapLayer(null));
	m_ThematicLayer = m_MapLayers[m_MapLayers.length - 1];
}
MapLayer.fromJson = function(json)
{
	var layer = new MapLayer(json.name, json.url);
	if (json.layers)
	{
		var subLayers = layer.getLayers();
		for (var l = 0 ; l < json.layers.length ; l++)
		{
			var subLayer = subLayers[l];
			subLayer.putVisible(json.layers[l].visible);
		}
	}
	return layer;
};