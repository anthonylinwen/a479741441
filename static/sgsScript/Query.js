function AttributeSearchTool(pMapCont)
{
	var m_Panel = null;
	var m_inputFilter = null;
	var m_pQuery = null;
	
	this.MapCommand = function(tEvent, pMapBase, hObj)
	{
		if (pMapCont == null)
			return;
		if (pMapCont.getActive() == null)
			return;
		var pLayer = pMapCont.getActive().getLayer();
		if (!pLayer.getFields)
			return;
		
		var pFlds = pLayer.getFields();
		if (pFlds == null)
			return;
		
		var pNode = document.body;
		var pQueryFunc = function(tEvent)
		{
			if (m_pQuery)
				pMapBase.RemoveElement(m_pQuery);
			
			m_pQuery = null;
			if (m_inputFilter.value != "")
			{
				m_pQuery = new MapSelectResult(pMapBase);
				m_pQuery.ExecuteQuery(pLayer, m_inputFilter.value, false);
				pMapBase.AddElement(m_pQuery);
			}
		};
		
		var pClearFunc = function()
		{
			if (m_pQuery)
				pMapBase.RemoveElement(m_pQuery);
			m_pQuery = null;
		};
		var pCloseFunc = function()
		{
			m_Panel = null;
		};
		m_Panel = new SWGPanel(pNode, 0, true, true);
		m_Panel.setClosedEvent(pCloseFunc);
		m_Panel.putTitle(pLayer.getTitle() + " Search");
		var hObj = m_Panel.getMainFrame();
		var pCenterCell = m_Panel.getViewFrame();
		var inp;
		var pTbl = pNode.ownerDocument.createElement("table");
		pCenterCell.appendChild(pTbl);
		pTbl.style.border = "0px";
		pTbl.cellPadding = "0px";
		pTbl.cellSpacing = "2px";
		pTbl.unselectable = "on";
		pRow = pTbl.insertRow(-1);
		
		if (pRow)
		{
			pCell = pRow.insertCell(-1);
			var field = pNode.ownerDocument.createElement("select");
			for (var i = 0 ; i < pFlds.length ; i++)
				field.options[i] = new Option(pFlds[i], pFlds[i]);
			
			pCell.appendChild(field);
		}
		
		pRow = pTbl.insertRow(-1);
		if (pRow)
		{
			pCell = pRow.insertCell(-1);
			var oper = pNode.ownerDocument.createElement("select");
			oper.options[0] = new Option("=", " = ");
			oper.options[1] = new Option("<", " < ");
			oper.options[2] = new Option(">", " > ");
			oper.options[3] = new Option("<=", " <= ");
			oper.options[4] = new Option(">=", " >= ");
			oper.options[5] = new Option("!=", " != ");
			oper.options[6] = new Option("Like", " LIKE ");
			pCell.appendChild(oper);
			var fieldvalue = pNode.ownerDocument.createElement("input");
			fieldvalue.value = "";
			fieldvalue.size = 15;
			pCell.appendChild(fieldvalue);
		}
		
		pRow = pTbl.insertRow(-1);
		if (pRow)
		{
			pCell = pRow.insertCell(-1);
			var inp = pNode.ownerDocument.createElement("input");
			inp.type = "button";
			inp.value = "And";
			AttachEvent(inp, "click", function()
			{
				m_inputFilter.value += " AND";
			}, false);
			pCell.appendChild(inp);
			inp = pNode.ownerDocument.createElement("input");
			inp.type = "button";
			inp.value = "Or";
			AttachEvent(inp, "click", function()
			{
				m_inputFilter.value += " OR ";
			}, false);
			pCell.appendChild(inp);
			inp = pNode.ownerDocument.createElement("input");
			inp.type = "button";
			inp.value = "Not";
			AttachEvent(inp, "click", function()
			{
				m_inputFilter.value += " NOT ";
			}, false);
			pCell.appendChild(inp);
			inp = pNode.ownerDocument.createElement("input");
			inp.type = "button";
			inp.value = "(";
			AttachEvent(inp, "click", function()
			{
				m_inputFilter.value += " ( ";
			}, false);
			pCell.appendChild(inp);
			inp = pNode.ownerDocument.createElement("input");
			inp.type = "button";
			inp.value = ")";
			AttachEvent(inp, "click", function()
			{
				m_inputFilter.value += " ) ";
			}, false);
			pCell.appendChild(inp);
			inp = pNode.ownerDocument.createElement("input");
			inp.type = "button";
			inp.value = "Append";
			AttachEvent(inp, "click", function()
			{
				m_inputFilter.value += "[" + field.options[field.selectedIndex].value + "]" + oper.options[oper.selectedIndex].value + "'" + fieldvalue.value + "'";
			}, false);
			pCell.appendChild(inp);
		}
		
		pRow = pTbl.insertRow(-1);
		if (pRow)
		{
			pCell = pRow.insertCell(-1);
			m_inputFilter = pNode.ownerDocument.createElement("input");
			pCell.appendChild(m_inputFilter);
			m_inputFilter.size = 25;
		}
		
		pRow = pTbl.insertRow(-1);
		if (pRow)
		{
			pCell = pRow.insertCell(-1);
			var inp;
			inp = pNode.ownerDocument.createElement("input");
			inp.type = "button";
			inp.value = "Query";
			AttachEvent(inp, "click", pQueryFunc, false);
			pCell.appendChild(inp);
			inp = pNode.ownerDocument.createElement("input");
			inp.type = "button";
			inp.value = "Clear";
			AttachEvent(inp, "click", pClearFunc, false);
			pCell.appendChild(inp);
		}
		m_Panel.FitFrameSize();
		hObj.style.left = tEvent.clientX + "px";
		hObj.style.top = tEvent.clientY + "px";
	};
}
MapSelectResult.Results = new Array;
function MapSelectResult(pMapBase, layer)
{
	var tblWidth = 250;
	var tblHeight = 300;
	var pNode = pMapBase.getHPackage().ownerDocument.body;
	MapSelectResult.Results.push(this);
	var m_MainTable;
	var m_MainDiv;
	var m_pGraps = new Array;
	var pThis = this;
	var mLayer = layer;
	
	this.Visible = function(Visib)
	{
		if (Visib)
			this.Show();
		else
			this.Hide();
	};
	this.IsVisible = function()
	{
		return m_MainTable.style.visibility != "hidden";
	};
	this.Hide = function()
	{
		m_MainTable.style.visibility = "hidden";
	};
	this.Show = function()
	{
		m_MainTable.style.visibility = "visible";
	};
	this.SetZIndex = function(zIdx)
	{
		m_MainTable.style.zIndex = zIdx;
	};
	this.GetZIndex = function()
	{
		return m_MainTable.style.zIndex;
	};
	this.EnsureZIndex = function(zIdx)
	{
		var z = parseInt(m_MainTable.style.zIndex);
		if (z > zIdx)
		{
			m_MainTable.style.zIndex = z - 1;
			return z;
		}
		return 0;
	};
	this.RemoveSelf = function()
	{
		var i;
		for (i = 0 ; i < m_pGraps.length ; i++)
			pMapBase.drawingGraphicsLayer.remove(m_pGraps[i]);
		
		m_pGraps = new Array;
		for (i = 0 ; i < MapSelectResult.Results.length ; i++)
		{
			if (MapSelectResult.Results[i] == this)
			{
				MapSelectResult.Results.splice(i, 1);
				break;
			}
		}
		if (m_Panel)
			m_Panel.FinalRelease();
		
		m_Panel = null;
	};
	this.RebuildElement = null;
	this.UpdateElement = null;
	this.GetGraphics = function()
	{
		return m_pGraps;
	};
	var pCenterCell = null;
	var pTitleCell = null;
	var m_Panel = new SWGPanel(pNode, 0, true, true);

	m_Panel.setClosedEvent(function()
	{
		m_Panel = null;
		pMapBase.RemoveElement(pThis);
	});
	var pM = m_Panel.getMainFrame();
	m_MainTable = pM;
	pCenterCell = m_Panel.getViewFrame();
	m_Panel.CenterWindow();
	
	var InsertFeatures = function(pNodes)
	{
		pCenterCell.innerHTML = "";
		pDiv = m_MainTable.ownerDocument.createElement("div");
		pCenterCell.appendChild(pDiv);
		pDiv.style.width = tblWidth + "px";
		if (pNodes.length <= 0)
			return;
		
		var pTbl = pDiv.ownerDocument.createElement("TABLE");
		pDiv.appendChild(pTbl);
		pTbl.width = "240px";
		pTbl.border = "0";
		pTbl.cellSpacing = "0";
		pTbl.cellPadding = "0";
		pTbl.unselectable = "on";
		pTbl.style.fontSize = "8pt";
		var cnt = pNodes.length > 100 ? 100 : pNodes.length;
		
		function Func(GID, pValues)
		{
			return function()
			{
				var pPanel = new SWGPanel(pNode, 0, true, true);
				pPanel.setClosedEvent(function()
				{
					m_Panel = null;
				});
				pPanel.putTitle(GID);
				var pM = pPanel.getViewFrame();
				var container = document.createElement("div");
				container.style.maxHeight = "600px";
				container.style.overflow = "auto";
				pM.appendChild(container);
				var pTbl = pM.ownerDocument.createElement("TABLE");
				container.appendChild(pTbl);
				pTbl.width = "240px";
				pTbl.border = "0";
				pTbl.cellSpacing = "0";
				pTbl.cellPadding = "0";
				pTbl.unselectable = "on";
				pTbl.style.fontSize = "8pt";
				for (var j = 0 ; j < pValues.length ; j++)
				{
					var pValue = pValues.item(j);
					if (pValue.nodeType == 1)
					{
						pRow = pTbl.insertRow(-1);
						pRow.style.height = "20px";
						pRow.style.backgroundImage = "url(images/Item_02.png)";
						pRow.style.backgroundRepeat = "repeat-x";
						pCell = pRow.insertCell(-1);
						pCell.width = "6px";
						pCell.style.width = "6px";
						pCell.style.backgroundImage = "url(images/Item_01.png)";
						pCell.style.backgroundRepeat = "no-repeat";
						pCell = pRow.insertCell(-1);
						pCell.innerHTML = pValue.tagName.replace(/_x([0-9a-fA-F]{4})_/g, "&#x$1;");
						pCell = pRow.insertCell(-1);
						if (pValue.firstChild != null)
							pCell.innerHTML = pValue.firstChild.nodeValue;
						else
							pCell.innerHTML = "&nbsp;";
						pCell = pRow.insertCell(-1);
						pCell.width = "5px";
						pCell.style.width = "5px";
						pCell.style.backgroundImage = "url(images/Item_03.png)";
						pCell.style.backgroundRepeat = "no-repeat";
					}
				}
				if (container.offsetHeight > 300)
				{
					container.style.height = 300 + "px";
					container.style.overflow = "scroll";
				}
				else
					container.style.height = "";
				
				if (container.clientWidth < 240)
				{
					pTbl.style.width = container.clientWidth + "px";
					container.style.overflow = "scroll";
				}
				else
					container.style.width = "";
				
				var relates;
				if (mLayer && mLayer.getTableRelates)
					relates = mLayer.getTableRelates();
				
				if (relates)
				{
					var relateContainer = document.createElement("div");
					relateContainer.style.marginTop = "10px";
					relateContainer.style.overflow = "hidden";
					var title = document.createElement("div");
					title.innerHTML = "Related Tables";
					relateContainer.appendChild(title);
					container.appendChild(relateContainer);
					var al = new SWGAttributeList(relateContainer);
					
					for (var rc = 0 ; rc < relates.length ; rc++)
					{
						var relate = relates[rc];
						var ti = "[" + relate.name + "]" + relate.title;
						
						al.addItem(ti, function(relate)
						{
							return function()
							{
								var featureList = new SWGList;
								featureList.setTitle(mLayer.getName() + ">" + relate.name);
								mLayer.queryRelatedFeatures(relate.name, GID, function(e)
								{
									var name = relate.name;
									var doc = e.responseXML;
									var features = doc.getElementsByTagName("Feature");
									if (features)
									{
										for (var f = 0 ; f < features.length ; f++)
										{
											var feature = features[f];
											var values = GetXMLChildNode(feature, "Values");
											var value = values.getElementsByTagName(relate.targetField)[0].firstChild.nodeValue;
											featureList.addItem(value ? value : "Feature : " + f, function(values)
											{
												return function()
												{
													var pValues = values.childNodes;
													var valueList = new SWGList;
													valueList.setTitle(mLayer.getName() + ">" + relate.name + "<br>" + value);
													for (var i = 0 ; i < pValues.length ; i++)
													{
														if (pValues[i].nodeType == 1)
														{
															var nodeName = pValues[i].nodeName;
															var nodeValue = pValues[i].firstChild ? pValues[i].firstChild.nodeValue : "";
															valueList.addItem(nodeName + " : " + nodeValue);
														}
													}
													valueList.panel.CenterWindow();
												};
											}(values));
										}
										featureList.panel.CenterWindow();
									}
								});
							};
						}(relate));
					}
				}
				pPanel.FitFrameSize();
				pPanel.CenterWindow();
			};
		}
		for (var i = 0 ; i < cnt ; i++)
		{
			var GID = pNodes.item(i).getAttribute("ID");
			var pValues = GetXMLChildNode(pNodes.item(i), "Values").childNodes;
			pRow = pTbl.insertRow(-1);
			pRow.style.height = "20px";
			pRow.style.backgroundImage = "url(images/Item_02.png)";
			pRow.style.backgroundRepeat = "repeat-x";
			pCell = pRow.insertCell(-1);
			pCell.width = "6px";
			pCell.style.width = "6px";
			pCell.style.backgroundImage = "url(images/Item_01.png)";
			pCell.style.backgroundRepeat = "no-repeat";
			pCell = pRow.insertCell(-1);
			pCell.innerHTML = GID;
			pCell = pRow.insertCell(-1);
			pCell.width = "14px";
			pCell.style.width = "14px";
			var pImg = pCell.ownerDocument.createElement("img");
			pCell.appendChild(pImg);
			pImg.src = "images/icons/table.jpg";
			pImg.style.marginTop = "1px";
			AttachEvent(pImg, "click", Func(GID, pValues), false);
			pImg.title = "Show feature attributes";
			var pGeoms = pNodes.item(i).getElementsByTagName("Geometry");
			if (pGeoms == null || pGeoms.length <= 0)
				continue;
			
			var wkt = "";
			for (var cn = 0 ; cn < pGeoms[0].childNodes.length ; cn++)
				wkt += pGeoms[0].childNodes[cn].nodeValue;
			
			var geometry = sg.geometry.Geometry.fromWKT(wkt);
			pCell = pRow.insertCell(-1);
			pCell.width = "14px";
			pCell.style.width = "14px";
			var pImg = pCell.ownerDocument.createElement("img");
			pCell.appendChild(pImg);
			pImg.src = "images/icons/Attribute.png";
			pImg.title = "Zoom to this feature";
			
			AttachEvent(pImg, "click", function(geometry)
			{
				return function()
				{
					if (geometry.geometry instanceof sg.geometry.Point)
						pMapBase.MoveMapTo(geometry.geometry.x, geometry.geometry.y);
					else
						pMapBase.ZoomMapTo(geometry.geometry.extent);
					
					pMapBase.RefreshMap(true);
				};
			}(geometry), false);
			
			pCell = pRow.insertCell(-1);
			pCell.width = "5px";
			pCell.style.width = "5px";
			pCell.style.backgroundImage = "url(images/Item_03.png)";
			pCell.style.backgroundRepeat = "no-repeat";
			var e = new sg.Graphic;
			if (!geometry)
				return;
			
			e.id = GID;
			e.geometry = geometry.geometry;
			
			if (e.geometry instanceof sg.geometry.MultiPolygon || e.geometry instanceof sg.geometry.Polygon || e.geometry instanceof sg.geometry.Extent)
			{
				e.symbol = (new sg.symbols.SimpleFillSymbol).setColor(new sg.Color(128, 128, 255, .5));
				e.symbol.outline.setWidth(3);
			}
			else if (e.geometry instanceof sg.geometry.MultiLineString || e.geometry instanceof sg.geometry.LineString)
			{
				e.symbol = (new sg.symbols.SimpleLineSymbol).setColor(new sg.Color(128, 255, 128, 1));
				e.symbol.setWidth(4);
			}
			else if (e.geometry instanceof sg.geometry.Point || e.geometry instanceof sg.geometry.MultiPoint)
			{
				var symbol = (new sg.symbols.SimpleMarkerSymbol).setSize(16).setOutline(new sg.symbols.SimpleLineSymbol);
				e.symbol = symbol;
			}
			
			if (pMapBase.drawingGraphicsLayer)
			{
				pMapBase.drawingGraphicsLayer.add(e);
				m_pGraps.push(e);
			}
		}
		pMapBase.RefreshMap(true);
		pMapBase.RefreshMap(true);
		var a = pDiv.offsetWidth > tblWidth;
		var b = pDiv.offsetHeight > tblHeight;
		if (a || b)
		{
			pDiv.style.height = b ? tblHeight + "px" : "";
			pDiv.style.width = a ? tblWidth + "px" : "";
			pDiv.style.overflow = "scroll";
		}
	};
	this.ExecuteQuery = function(pLayer, expr, bGeom)
	{
		if (pLayer.ExecuteQuery == null)
		{
			pCenterCell.innerHTML = "Query failed";
			m_Panel.FitFrameSize();
			return;
		}
		m_Panel.putTitle("[" + pLayer.getTitle() + "] Result");
		pCenterCell.innerHTML = "Querying...";
		m_Panel.FitFrameSize();
		
		pLayer.ExecuteQuery(expr, bGeom, function(pRequest) 
		{
			var pDoc = pRequest.responseXML;
			var pNodes = pDoc.documentElement.getElementsByTagName("Feature");
			
			if (pNodes.length > 0)
				InsertFeatures(pNodes);
			else
				pCenterCell.innerHTML = "No data found";
			
			m_Panel.FitFrameSize();
			m_Panel.CenterWindow();
		},
		function()
		{
			pCenterCell.innerHTML = "Query failed";
			m_Panel.FitFrameSize();
		});
	};
}
function PointQueryTool(pMapCont)
{
	var m_pQuery = null;
	this.ExitMapEvent = null;
	this.InitMapEvent = function(pMapBase)
	{
		if (pMapCont == null)
			return;
		
		var hObj = pMapBase.getHPackage();
		var pClick = function(tEvent)
		{
			if (pMapCont.getActive() == null)
				return;
			
			var pLayer = pMapCont.getActive().getLayer();
			var OffsetPt2 = pMapBase.getCursorPosition(tEvent);
			var cpt1 = pMapBase.ToMapPoint(OffsetPt2.X - 5, OffsetPt2.Y - 5);
			var cpt2 = pMapBase.ToMapPoint(OffsetPt2.X + 5, OffsetPt2.Y + 5);
			
			if (m_pQuery)
				pMapBase.RemoveElement(m_pQuery);
			
			m_pQuery = new MapSelectResult(pMapBase, pLayer);
			m_pQuery.ExecuteQuery(pLayer, "RC( " + cpt1.X + " " + cpt1.Y + "," + cpt2.X + " " + cpt2.Y + " )", true);
			pMapBase.AddElement(m_pQuery);
		};
		this.ExitMapEvent = function()
		{
			DetachEvent(hObj, "click", pClick, false);
		};
		AttachEvent(hObj, "click", pClick, false);
	};
}
function RectangleQueryTool(pMapCont)
{
	var m_pQuery;
	var MouseCurX;
	var MouseCurY;
	var MouseDownX;
	var MouseDownY;
	var m_hObj;
	this.ExitMapEvent = null;
	
	this.InitMapEvent = function(pMapBase)
	{
		var hObj = pMapBase.getHPackage();
		var pMouseMove = function(tEvent)
		{
			var ox = tEvent.screenX - MouseCurX;
			var oy = tEvent.screenY - MouseCurY;
			m_hObj.style.left = MouseDownX + (ox < 0 ? ox : 0) + "px";
			m_hObj.style.width = Math.max(Math.abs(ox), 1) + "px";
			m_hObj.style.top = MouseDownY + (oy < 0 ? oy : 0) + "px";
			m_hObj.style.height = Math.max(Math.abs(oy), 1) + "px";
		};
		var pMouseUp = function(tEvent)
		{
			if (pMapCont.getActive() == null)
				return;
			
			var pLayer = pMapCont.getActive().getLayer();
			DetachEvent(hObj, "mousemove", pMouseMove, true);
			DetachEvent(hObj, "mouseup", pMouseUp, false);
			var cpt1 = pMapBase.ToMapPoint(MouseDownX, MouseDownY);
			var OffsetPt2 = pMapBase.getCursorPosition(tEvent);
			var cpt2 = pMapBase.ToMapPoint(OffsetPt2.X, OffsetPt2.Y);
			hObj.removeChild(m_hObj);
			m_hObj = null;
			
			if (m_pQuery)
				pMapBase.RemoveElement(m_pQuery);
			
			m_pQuery = new MapSelectResult(pMapBase, pLayer);
			m_pQuery.ExecuteQuery(pLayer, "RC( " + cpt1.X + " " + cpt1.Y + "," + cpt2.X + " " + cpt2.Y + " )", true);
			pMapBase.AddElement(m_pQuery);
		};
		var pMouseDown = function(tEvent)
		{
			MouseCurX = tEvent.screenX;
			MouseCurY = tEvent.screenY;
			var OffsetPt2 = pMapBase.getCursorPosition(tEvent);
			MouseDownX = OffsetPt2.X;
			MouseDownY = OffsetPt2.Y;
			m_hObj = hObj.ownerDocument.createElement("div");
			hObj.appendChild(m_hObj);
			m_hObj.style.position = "absolute";
			m_hObj.style.overflow = "hidden";
			m_hObj.style.left = MouseDownX + "px";
			m_hObj.style.top = MouseDownY + "px";
			m_hObj.style.width = "0px";
			m_hObj.style.height = "0px";
			m_hObj.style.border = "inset 2px red";
			AttachEvent(hObj, "mouseup", pMouseUp, false);
			AttachEvent(hObj, "mousemove", pMouseMove, true);
		};
		this.ExitMapEvent = function()
		{
			DetachEvent(hObj, "mousedown", pMouseDown, false);
		};
		AttachEvent(hObj, "mousedown", pMouseDown, false);
	};
}
function LineStringQueryTool(pMapCont, isClose)
{
	var m_pQuery;
	this.ExitMapEvent = null;
	this.InitMapEvent = function(pMapBase)
	{
		var hObj = pMapBase.getHPackage();
		var pTracker = null;
		var pEndFunc = function(tEvent)
		{
			if (pMapCont.getActive() == null)
				return;
			
			var pLayer = pMapCont.getActive().getLayer();
			if (m_pQuery)
				pMapBase.RemoveElement(m_pQuery);
			
			m_pQuery = new MapSelectResult(pMapBase, pLayer);
			var pPart = pTracker.getPart();
			
			if (pPart)
				m_pQuery.ExecuteQuery(pLayer, (isClose ? "PG" : "LS") + "( " + pPart.BuildGeom(0) + " )", true);
			
			pMapBase.AddElement(m_pQuery);
			pTracker = null;
			AttachEvent(hObj, "mousedown", pMouseDown, false);
		};
		
		var pMouseDown = function(tEvent)
		{
			DetachEvent(hObj, "mousedown", pMouseDown, false);
			pTracker = new LineStringTracker(pMapBase, tEvent, pEndFunc);
		};
		this.ExitMapEvent = function()
		{
			if (pTracker)
				pTracker.Terminate();
			pTracker = null;
			DetachEvent(hObj, "mousedown", pMouseDown, false);
		};
		AttachEvent(hObj, "mousedown", pMouseDown, false);
	};
}
var MeasureTool =  function(parentNode, pMapBase)
{
	var mobile = CheckDevice();
	if (!mobile)
	{
		var mNode = document.createElement("div");
		var that = this;
		that.activechecked = "unactive";
		var draw;
		var gLayer;
		var pPanel = null;
		var hObj = pMapBase.getHPackage();
		var pTracker = null;
		var pResult = null;
		var m_nType = 0;
		var m_dUnits = .3048;
		var m_sUnits = "Feet";
		
		mNode.id = "Measuremenu";
		mNode.className = "toolbar";
		mNode.style.height = (document.body.clientHeight - headerHeight) + "px";
		parentNode.appendChild(mNode);
		
		var mNode_RemoveImg = document.createElement("img");
		mNode_RemoveImg.src = "images/PC_OtherTool/Result20.png";
		mNode_RemoveImg.style.position = "absolute";
		mNode_RemoveImg.style.left = "20px";
		mNode_RemoveImg.style.bottom = "5px";
		mNode_RemoveImg.style.height = "25px";
		mNode_RemoveImg.style.width = "25px";
		var mNode_hrNode = document.createElement("hr");
		mNode_hrNode.style.position = "absolute";
		mNode_hrNode.style.bottom = "30px";
		mNode_hrNode.style.width = "100%";
		mNode.appendChild(mNode_hrNode);
		mNode.appendChild(mNode_RemoveImg);
		
		AttachEvent(mNode_RemoveImg, "click", function ()
		{
			if (gLayer)
				gLayer.clear();
		});
		
		var mNode_title = document.createElement("div");
		mNode_title.className = "toolbartitle";
		var mNode_title_h2 = document.createElement("h2");
		mNode_title_h2.innerHTML = "Measure";
		var mNode_title_bkimg = document.createElement("img");
		mNode_title_bkimg.src = "images/right-arrow-of-straight-lines.png";
		AttachEvent(mNode_title_bkimg, "click", function ()
		{
			that.ExitMapEvent();
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
		
		var p_lLenthToolTitle = document.createElement("label");
		p_lLenthToolTitle.style.position = "absolute";
		p_lLenthToolTitle.style.left = "20px";
		p_lLenthToolTitle.style.top = "50px";
		p_lLenthToolTitle.style.fontSize = "18px";
		p_lLenthToolTitle.innerHTML = "Measure length";
		pNode.appendChild(p_lLenthToolTitle);
		
		var hrNode = document.createElement("hr");
		hrNode.style.width = "85%";
		hrNode.style.marginTop = "35px";
		hrNode.style.marginLeft = "20px";
		pNode.appendChild(hrNode);
			
		var m_LenthToolRadio1 = document.createElement("input");
		m_LenthToolRadio1.style.left = "30px";
		m_LenthToolRadio1.style.top = "90px";
		m_LenthToolRadio1.style.position = "absolute";
		m_LenthToolRadio1.type = "radio";
		m_LenthToolRadio1.checked = true;
		m_LenthToolRadio1.name = "measure";
		m_LenthToolRadio1.id = "feet";
		
		var lb_m_pChk;
		var sp;
		lb_m_pChk = document.createElement("label");
		lb_m_pChk.style.left = "30px";
		lb_m_pChk.style.top = "90px";
		lb_m_pChk.style.position = "absolute";
		lb_m_pChk.htmlFor = m_LenthToolRadio1.id;
		sp = pNode.ownerDocument.createElement("span");
		lb_m_pChk.appendChild(sp);
		
		AttachEvent(m_LenthToolRadio1, "click", function()
		{
			activateDrawing("LINESTRING", "Feet");
			rReset(0, .3048, "Feet");
		}, false);
		
		var m_LenthToolRadioText1 = document.createElement("label"); 
		m_LenthToolRadioText1.style.left = "55px";
		m_LenthToolRadioText1.style.top = "90px";
		m_LenthToolRadioText1.style.position = "absolute";
		m_LenthToolRadioText1.innerHTML = "Feet";
		m_LenthToolRadioText1.htmlFor = "feet";
		
		pNode.appendChild(m_LenthToolRadio1);
		pNode.appendChild(lb_m_pChk);
		pNode.appendChild(m_LenthToolRadioText1);
		
		var m_LenthToolRadio2 = document.createElement("input");
		m_LenthToolRadio2.style.left = "150px";
		m_LenthToolRadio2.style.top = "90px";
		m_LenthToolRadio2.style.position = "absolute";
		m_LenthToolRadio2.type = "radio";
		m_LenthToolRadio2.name = "measure";	
		m_LenthToolRadio2.id = "yards";
		
		lb_m_pChk = document.createElement("label");
		lb_m_pChk.style.left = "150px";
		lb_m_pChk.style.top = "90px";
		lb_m_pChk.style.position = "absolute";
		lb_m_pChk.htmlFor = m_LenthToolRadio2.id;
		sp = pNode.ownerDocument.createElement("span");
		lb_m_pChk.appendChild(sp);
		
		var m_LenthToolRadioText2 = document.createElement("label"); 
		m_LenthToolRadioText2.style.left = "175px";
		m_LenthToolRadioText2.style.top = "90px";
		m_LenthToolRadioText2.style.position = "absolute";
		m_LenthToolRadioText2.innerHTML = "Yards";
		m_LenthToolRadioText2.htmlFor = "yards";
		pNode.appendChild(m_LenthToolRadio2);
		pNode.appendChild(lb_m_pChk);
		pNode.appendChild(m_LenthToolRadioText2);
		AttachEvent(m_LenthToolRadio2, "click", function()
		{
			activateDrawing("LINESTRING", "Yards");
			rReset(0, .9144, "Yards");
		}, false);
		
		var m_LenthToolRadio3 = document.createElement("input");
		m_LenthToolRadio3.style.left = "30px";
		m_LenthToolRadio3.style.top = "120px";
		m_LenthToolRadio3.style.position = "absolute";
		m_LenthToolRadio3.type = "radio";
		m_LenthToolRadio3.name = "measure";
		m_LenthToolRadio3.id = "miles";
		
		lb_m_pChk = document.createElement("label");
		lb_m_pChk.style.left = "30px";
		lb_m_pChk.style.top = "120px";
		lb_m_pChk.style.position = "absolute";
		lb_m_pChk.htmlFor = m_LenthToolRadio3.id;
		sp = pNode.ownerDocument.createElement("span");
		lb_m_pChk.appendChild(sp);
		
		var m_LenthToolRadioText3 = document.createElement("label");
		m_LenthToolRadioText3.style.left = "55px";
		m_LenthToolRadioText3.style.top = "120px";
		m_LenthToolRadioText3.style.position = "absolute";
		m_LenthToolRadioText3.innerHTML = "Miles";
		m_LenthToolRadioText3.htmlFor = "miles";
		pNode.appendChild(m_LenthToolRadio3);
		pNode.appendChild(lb_m_pChk);
		pNode.appendChild(m_LenthToolRadioText3);
		AttachEvent(m_LenthToolRadio3, "click", function()
		{
			activateDrawing("LINESTRING", "Miles");
			rReset(0, 1609.344, "Miles");
		}, false);
		
		var m_LenthToolRadio4 = document.createElement("input");
		m_LenthToolRadio4.style.left = "150px";
		m_LenthToolRadio4.style.top = "120px";
		m_LenthToolRadio4.style.position = "absolute";
		m_LenthToolRadio4.type = "radio";
		m_LenthToolRadio4.name = "measure";
		m_LenthToolRadio4.id = "meters";
		
		lb_m_pChk = document.createElement("label");
		lb_m_pChk.htmlFor = m_LenthToolRadio4.id;
		lb_m_pChk.style.left = "150px";
		lb_m_pChk.style.top = "120px";
		lb_m_pChk.style.position = "absolute";
		sp = pNode.ownerDocument.createElement("span");
		lb_m_pChk.appendChild(sp);
		
		var m_LenthToolRadioText4 = document.createElement("label");
		m_LenthToolRadioText4.style.left = "175px";
		m_LenthToolRadioText4.style.top = "120px";
		m_LenthToolRadioText4.style.position = "absolute";
		m_LenthToolRadioText4.innerHTML = "Meters";
		m_LenthToolRadioText4.htmlFor = "meters";
		pNode.appendChild(m_LenthToolRadio4);
		pNode.appendChild(lb_m_pChk);
		pNode.appendChild(m_LenthToolRadioText4);
		AttachEvent(m_LenthToolRadio4, "click", function()
		{
			activateDrawing("LINESTRING", "Meters");
			rReset(0, 1, "Meters");
		}, false);
		
		var m_LenthToolRadio5 = document.createElement("input");
		m_LenthToolRadio5.style.left = "30px";
		m_LenthToolRadio5.style.top = "150px";
		m_LenthToolRadio5.style.position = "absolute";
		m_LenthToolRadio5.type = "radio";
		m_LenthToolRadio5.name = "measure";
		m_LenthToolRadio5.id = "kilometers";
		
		lb_m_pChk = document.createElement("label");
		lb_m_pChk.style.left = "30px";
		lb_m_pChk.style.top = "150px";
		lb_m_pChk.style.position = "absolute";
		lb_m_pChk.htmlFor = m_LenthToolRadio5.id;
		sp = pNode.ownerDocument.createElement("span");
		lb_m_pChk.appendChild(sp);
		
		var m_LenthToolRadioText5 = document.createElement("label");
		m_LenthToolRadioText5.style.left = "55px";
		m_LenthToolRadioText5.style.top = "150px";
		m_LenthToolRadioText5.style.position = "absolute";
		m_LenthToolRadioText5.innerHTML = "Kilometers";
		m_LenthToolRadioText5.htmlFor = "kilometers";
		pNode.appendChild(m_LenthToolRadio5);
		pNode.appendChild(lb_m_pChk);
		pNode.appendChild(m_LenthToolRadioText5);
		AttachEvent(m_LenthToolRadio5, "click", function()
		{
			activateDrawing("LINESTRING", "Kilometers");
			rReset(0, 1E3, "Kilometers");
		}, false);
		
		
		var p_lAreaToolTitle = document.createElement("label");
		p_lAreaToolTitle.style.position = "absolute";
		p_lAreaToolTitle.style.left = "20px";
		p_lAreaToolTitle.style.top = "200px";
		p_lAreaToolTitle.style.fontSize = "18px";
		p_lAreaToolTitle.innerHTML = "Measure area";
		pNode.appendChild(p_lAreaToolTitle);
		
		
		hrNode = document.createElement("hr");
		hrNode.style.width = "85%";
		hrNode.style.top = "220px";
		hrNode.style.left = "20px";
		hrNode.style.position = "absolute";
		pNode.appendChild(hrNode);
		
		var m_AreaToolRadio1 = document.createElement("input");
		m_AreaToolRadio1.style.left = "30px";
		m_AreaToolRadio1.style.top = "245px";
		m_AreaToolRadio1.style.position = "absolute";
		m_AreaToolRadio1.type = "radio";
		m_AreaToolRadio1.name = "measure";
		m_AreaToolRadio1.id = "s_feet";
		
		lb_m_pChk = document.createElement("label");
		lb_m_pChk.style.left = "30px";
		lb_m_pChk.style.top = "245px";
		lb_m_pChk.style.position = "absolute";
		lb_m_pChk.htmlFor = m_AreaToolRadio1.id;
		sp = pNode.ownerDocument.createElement("span");
		lb_m_pChk.appendChild(sp);
		
		var m_AreaToolRadioText1 = document.createElement("lebal");
		m_AreaToolRadioText1.style.left = "55px";
		m_AreaToolRadioText1.style.top = "245px";
		m_AreaToolRadioText1.style.position = "absolute";
		m_AreaToolRadioText1.innerHTML = "Square feet";
		m_AreaToolRadioText1.htmlFor = "s_feet";
		pNode.appendChild(m_AreaToolRadio1);
		pNode.appendChild(lb_m_pChk);
		pNode.appendChild(m_AreaToolRadioText1);
		AttachEvent(m_AreaToolRadio1, "click", function()
		{
			activateDrawing("POLYGON" , "Square Feet");
			rReset(1, .09290304, "Square Feet");
		}, false);
		
		
		var m_AreaToolRadio2 = document.createElement("input");
		m_AreaToolRadio2.style.left = "150px";
		m_AreaToolRadio2.style.top = "245px";
		m_AreaToolRadio2.style.position = "absolute";
		m_AreaToolRadio2.type = "radio";
		m_AreaToolRadio2.name = "measure";
		m_AreaToolRadio2.id = "s_yard";
		
		lb_m_pChk = document.createElement("label");
		lb_m_pChk.style.left = "150px";
		lb_m_pChk.style.top = "245px";
		lb_m_pChk.style.position = "absolute";
		lb_m_pChk.htmlFor = m_AreaToolRadio2.id;
		sp = pNode.ownerDocument.createElement("span");
		lb_m_pChk.appendChild(sp);
		
		var m_AreaToolRadioText2 = document.createElement("lebal");
		m_AreaToolRadioText2.style.left = "175px";
		m_AreaToolRadioText2.style.top = "245px";
		m_AreaToolRadioText2.style.position = "absolute";
		m_AreaToolRadioText2.innerHTML = "Square yard";
		m_AreaToolRadioText2.htmlFor = "s_yard";
		pNode.appendChild(m_AreaToolRadio2);
		pNode.appendChild(lb_m_pChk);
		pNode.appendChild(m_AreaToolRadioText2);
		AttachEvent(m_AreaToolRadio2, "click", function()
		{
			activateDrawing("POLYGON", "Square Yards");
			rReset(1, .83612736, "Square Yards");
		}, false);

		var m_AreaToolRadio3 = document.createElement("input");
		m_AreaToolRadio3.style.left = "30px";
		m_AreaToolRadio3.style.top = "275px";
		m_AreaToolRadio3.style.position = "absolute";
		m_AreaToolRadio3.type = "radio";
		m_AreaToolRadio3.name = "measure";
		m_AreaToolRadio3.id = "s_miles";
		
		lb_m_pChk = document.createElement("label");
		lb_m_pChk.style.left = "30px";
		lb_m_pChk.style.top = "275px";
		lb_m_pChk.style.position = "absolute";
		lb_m_pChk.htmlFor = m_AreaToolRadio3.id;
		sp = pNode.ownerDocument.createElement("span");
		lb_m_pChk.appendChild(sp);
			
		var m_AreaToolRadioText3 = document.createElement("lebal");
		m_AreaToolRadioText3.style.left = "55px";
		m_AreaToolRadioText3.style.top = "275px";
		m_AreaToolRadioText3.style.position = "absolute";
		m_AreaToolRadioText3.innerHTML = "Square miles";
		m_AreaToolRadioText3.htmlFor = "s_miles";
		pNode.appendChild(m_AreaToolRadio3);
		pNode.appendChild(lb_m_pChk);
		pNode.appendChild(m_AreaToolRadioText3);
		AttachEvent(m_AreaToolRadio3, "click", function()
		{
			activateDrawing("POLYGON", "Square Miles");
			rReset(1, 2589988.110336, "Square Miles");
		}, false);
		
		var m_AreaToolRadio4 = document.createElement("input");
		m_AreaToolRadio4.style.left = "150px";
		m_AreaToolRadio4.style.top = "275px";
		m_AreaToolRadio4.style.position = "absolute";
		m_AreaToolRadio4.type = "radio";
		m_AreaToolRadio4.name = "measure";
		m_AreaToolRadio4.id = "s_meters";
		
		lb_m_pChk = document.createElement("label");
		lb_m_pChk.style.left = "150px";
		lb_m_pChk.style.top = "275px";
		lb_m_pChk.style.position = "absolute";
		lb_m_pChk.htmlFor = m_AreaToolRadio4.id;
		sp = pNode.ownerDocument.createElement("span");
		lb_m_pChk.appendChild(sp);
			
		var m_AreaToolRadioText4 = document.createElement("lebal");
		m_AreaToolRadioText4.style.left = "175px";
		m_AreaToolRadioText4.style.top = "275px";
		m_AreaToolRadioText4.style.position = "absolute";
		m_AreaToolRadioText4.innerHTML = "Square meters";
		m_AreaToolRadioText4.htmlFor = "s_meters";
		pNode.appendChild(m_AreaToolRadio4);
		pNode.appendChild(lb_m_pChk);
		pNode.appendChild(m_AreaToolRadioText4);
		AttachEvent(m_AreaToolRadio4, "click", function()
		{
			activateDrawing("POLYGON", "Square Meters");
			rReset(1, 1, "Square Meters");
		}, false);
		
		var m_AreaToolRadio5 = document.createElement("input");
		m_AreaToolRadio5.style.left = "30px";
		m_AreaToolRadio5.style.top = "305px";
		m_AreaToolRadio5.style.position = "absolute";
		m_AreaToolRadio5.type = "radio";
		m_AreaToolRadio5.name = "measure";
		m_AreaToolRadio5.id = "s_kilometers";
		
		lb_m_pChk = document.createElement("label");
		lb_m_pChk.style.left = "30px";
		lb_m_pChk.style.top = "305px";
		lb_m_pChk.style.position = "absolute";
		lb_m_pChk.htmlFor = m_AreaToolRadio5.id;
		sp = pNode.ownerDocument.createElement("span");
		lb_m_pChk.appendChild(sp);
			
		var m_AreaToolRadioText5 = document.createElement("lebal");
		m_AreaToolRadioText5.style.left = "55px";
		m_AreaToolRadioText5.style.top = "305px";
		m_AreaToolRadioText5.style.position = "absolute";
		m_AreaToolRadioText5.innerHTML = "Square kilometers";
		m_AreaToolRadioText5.htmlFor = "s_kilometers";
		pNode.appendChild(m_AreaToolRadio5);
		pNode.appendChild(lb_m_pChk);
		pNode.appendChild(m_AreaToolRadioText5);
		AttachEvent(m_AreaToolRadio5, "click", function()
		{
			activateDrawing("POLYGON", "Square Kilometers");
			rReset(1, 1E6, "Square Kilometers");
		}, false);
		
		var TestText = document.createElement("label");
		TestText.style.position = "absolute";
		TestText.style.fontColor = "red";
		TestText.style.left = "20px";
		TestText.style.bottom = "5px";
		pNode.appendChild(TestText);
		
		gLayer = new sg.GraphicsLayer();
		pMapBase.AddLayer(gLayer);
		draw = new sg.Draw(pMapBase);
		sg.events.on(draw, "draw-end", function (e)
		{
			var graphic = new sg.Graphic();
			var countresult = "";
			var midpoint;
			graphic.geometry = e.geometry;
			if (e.geometry instanceof sg.geometry.Polygon || e.geometry instanceof sg.geometry.Extent)
			{
				graphic.symbol = new sg.symbols.SimpleFillSymbol();
				graphic.symbol.outline.setWidth(2);
				midpoint = graphic.geometry.rings[0].getMidPoint();
				var midpoint_temp = graphic.geometry.getExtent();
				midpoint.x = (midpoint_temp.xmax + midpoint_temp.xmin) / 2;
				midpoint.y = (midpoint_temp.ymax + midpoint_temp.ymin) / 2;
				countresult = graphic.geometry.getArea();
			}
			else if (e.geometry instanceof sg.geometry.LineString)
			{
				graphic.symbol = new sg.symbols.SimpleLineSymbol();
				graphic.symbol.setWidth(3);
				midpoint = graphic.geometry.getMidPoint();
				countresult = graphic.geometry.getLength();
			}
			var graphicLabel = new sg.symbols.TextSymbol();
			graphicLabel.text = "Total " + Math.abs(countresult) / m_dUnits + " " + m_sUnits;
			graphicLabel.className = "textlayer";
			graphicLabel.font.size = "15px";
			graphicLabel.font.family = "Verdana";
			graphicLabel.font.weight = "bold";
			graphicLabel.color.r = 0;
			graphicLabel.color.g = 0;
			graphicLabel.color.b = 0;
			var graphicLabelText = new sg.Graphic(midpoint, graphicLabel);
			gLayer.add(graphic);
			gLayer.add(graphicLabelText);
		});
		
			
		function rReset(nType, dUnits, sUnits)
		{
			m_nType = nType;
			m_dUnits = dUnits;
			m_sUnits = sUnits;
		}
		
		function activateDrawing(Did, unit)
		{
			draw.activate(sg.Draw[Did],
			{
				showToolTips: true
			});
			if (Did == "LINESTRING")
				draw.setTooltipContent("Line " + unit + " : Click to add point/vertex. Double-click to finish.");
			else if (Did == "POLYGON")
				draw.setTooltipContent("Polygon " + unit + " : Click to add point/vertex. Double-click to finish.");
		}
		
		this.ExitMapEvent = function()
		{
			if (that.activechecked == "active")
			{
				gpanTool.InitMapEvent(pMapBase);
				if (ft)
					ft.InitMapEvent(pMapBase);
				draw.deactivate();
				that.activechecked = "unactive";
			}
		};
		
		this.ActiveMeasureTool = function()
		{
			that.activechecked = "active";
			if (ft)
				ft.ExitMapEvent(pMapBase);
			gpanTool.ExitDbClickEvent();
			if (m_nType == 0)
				activateDrawing("LINESTRING" , m_sUnits);
			else if (m_nType == 1)
				activateDrawing("POLYGON" , m_sUnits);
		};
	}
	else
	{
		var mNode = document.createElement("div");
		var that = this;
		that.activechecked = "unactive";
		var draw;
		var gLayer;
		var pPanel = null;
		var hObj = pMapBase.getHPackage();
		var pTracker = null;
		var pResult = null;
		var m_nType = 0;
		var m_dUnits = .3048;
		var m_sUnits = "Feet";
		
		mNode.id = "Measuremenu";
		mNode.className = "toolbar";
        mNode.style.height = "70%";
        mNode.style.width = "70%";
        mNode.style.position = "absolute";
        mNode.style.top = "20%";
        mNode.style.left ="15%";
        mNode.style.display = "none";
		parentNode.appendChild(mNode);
		
		var mNode_RemoveImg = document.createElement("img");
		mNode_RemoveImg.src = "images/Mobile_OtherTool/Clean-All30.png";
		mNode_RemoveImg.style.position = "absolute";
		mNode_RemoveImg.style.left = "1%";
		mNode_RemoveImg.style.bottom = "2%";
		mNode_RemoveImg.style.height = "8%";
        
		var mNode_hrNode = document.createElement("hr");
		mNode_hrNode.style.position = "absolute";
		mNode_hrNode.style.bottom = "11%";
		mNode_hrNode.style.width = "100%";
		mNode.appendChild(mNode_hrNode);
		mNode.appendChild(mNode_RemoveImg);
		
		AttachEvent(mNode_RemoveImg, "click", function ()
		{
			if (gLayer)
				gLayer.clear();
		});
		
		var mNode_title = document.createElement("div");
		mNode_title.className = "toolbartitle";
		var mNode_title_h2 = document.createElement("h2");
		mNode_title_h2.innerHTML = "測量";
		var mNode_title_bkimg = document.createElement("img");
		mNode_title_bkimg.src = "images/right-arrow-of-straight-lines.png";
		AttachEvent(mNode_title_bkimg, "touchend", function ()
		{
			that.ExitMapEvent();
            mNode.style.display = 'none';
            
			FindXMLNodeById(document, "Coordinate").style.zIndex = "32767";
			
			var k = FindXMLNodes(mNode, "input");
			var t = k.length;
			for (var i = 0 ; i < t ; i++)
			{
				if (k[i].checked == true)
				{
					k[i].checked = false;
					return;
				}
			}
		});
		
		mNode_title.appendChild(mNode_title_h2);
		mNode_title.appendChild(mNode_title_bkimg);
		
		mNode.appendChild(mNode_title);
		
		var pNode = document.createElement("div");
		pNode.style.width = "100%";
		pNode.style.overflow = "auto";
		pNode.style.height = ((document.body.clientHeight * 0.7) - (document.body.clientHeight * 0.7 * 0.1)) + "px";
		mNode.appendChild(pNode);
		
		var measureLength = ["Feet", "Yards", "Miles", "Meters", "Kilometers"];
		var LengthDefine = [.3048, .9144, 1609.344, 1, 1E3];
		var AreaDefine = [.09290304, .83612736, 2589988.110336, 1, 1E6];
		
		var mL_title = document.createElement("div");
		mL_title.style.width = "100%";
		mL_title.style.height = "8%";
		mL_title.style.float = "left";
		pNode.appendChild(mL_title);
		
		var mL_title_label = document.createElement("label");
		mL_title_label.style.fontSize = "35pt";
		mL_title_label.style.marginLeft = "6%";
		mL_title_label.style.float = "left";
		mL_title_label.innerHTML = "線段測量";
		mL_title.appendChild(mL_title_label);
		
		var mL_title_hr = document.createElement("hr");
		mL_title_hr.style.width = "90%";
		pNode.appendChild(mL_title_hr);
		
		for (var i = 0 ; i < measureLength.length ; i++)
		{
			var div = document.createElement("div");
			div.style.width = "50%";
			div.style.marginBottom = "5%";
			div.style.float = "left";
			
			var rd = document.createElement("input");
			rd.type = "radio";
			rd.name = "measure";
			rd.id = measureLength[i];
			rd.style.marginLeft = "5%";
			rd.style.float = "left";
			rd.select_index = i;
            rd.style.width = '40px';
            rd.style.height = '40px';
            rd.style.marginTop = '10px';
			div.appendChild(rd);
			
			AttachEvent(rd, "change", function()
			{
				activateDrawing("LINESTRING", measureLength[rd.select_index]);
				rReset(0, LengthDefine[rd.select_index], measureLength[rd.select_index]);
				var tip = FindXMLNodeById(document, "mobiletip");
				var lab = document.createElement("label");
				lab.innerHTML = "Tap to add vertex. Long tap to finish editing.";
				lab.style.marginTop = "5%";
				lab.style.marginLeft = "5%";
				lab.style.float = "left";
				tip.appendChild(lab);
				tip.style.height = "10%";
                tip.style.display = 'block';
                mNode.style.display = 'none';
			}, false);
			
			var text = document.createElement("label");
			text.innerHTML = measureLength[i];
			text.htmlFor = measureLength[i];
            text.style.fontSize = "35pt";
			text.style.float = "left";
			div.appendChild(text);
			
			pNode.appendChild(div);
		}
		
		mL_title = document.createElement("div");
		mL_title.style.width = "100%";
		mL_title.style.height = "8%";
		mL_title.style.float = "left";
		pNode.appendChild(mL_title);
		
		mL_title_label = document.createElement("label");
		mL_title_label.style.fontSize = "35pt";
		mL_title_label.style.marginLeft = "6%";
		mL_title_label.style.float = "left";
		mL_title_label.innerHTML = "面積測量";
		mL_title.appendChild(mL_title_label);
		
		mL_title_hr = document.createElement("hr");
		mL_title_hr.style.width = "90%";
		pNode.appendChild(mL_title_hr);
		
		for (var i = 0 ; i < measureLength.length ; i++)
		{
			var div = document.createElement("div");
			
			if (i != 4)
			{
				div.style.width = "50%";
				div.style.marginBottom = "5%";
				div.style.float = "left";
			}
			else
			{
				div.style.width = "60%";
				div.style.marginBottom = "5%";
				div.style.float = "left";
			}
			
			var rd = document.createElement("input");
			rd.type = "radio";
			rd.name = "measure";
			rd.id = "sq" + measureLength[i];
			
			if (i != 4)
				rd.style.marginLeft = "5%";
			else
				rd.style.marginLeft = "3.5%";
			
			rd.style.float = "left";
			rd.select_index = i;
            rd.style.width = '40px';
            rd.style.height = '40px';
            rd.style.marginTop = '10px';
			div.appendChild(rd);
			
			AttachEvent(rd, "change", function()
			{
				activateDrawing("POLYGON", "Square " + measureLength[rd.select_index]);
				rReset(1, AreaDefine[rd.select_index], measureLength[rd.select_index]);
				var tip = FindXMLNodeById(document, "mobiletip");
				var lab = document.createElement("label");
				lab.innerHTML = "Tap to add vertex. Long tap to finish editing.";
				lab.style.marginTop = "5%";
				lab.style.marginLeft = "5%";
				lab.style.float = "left";
				tip.appendChild(lab);
				tip.style.height = "10%";
                tip.style.display = 'block';
                mNode.style.display = 'none';
			}, false);
			
			var text = document.createElement("label");
			text.innerHTML = "Sq " + measureLength[i];
			text.htmlFor = "sq" + measureLength[i];
			text.style.float = "left";
            text.style.fontSize = "35pt";
			div.appendChild(text);
			
			pNode.appendChild(div);
		}
		
		gLayer = new sg.GraphicsLayer();
		pMapBase.AddLayer(gLayer);
		draw = new sg.Draw(pMapBase);
		sg.events.on(draw, "draw-end", function (e)
		{
			var graphic = new sg.Graphic();
			var countresult = "";
			var midpoint;
			graphic.geometry = e.geometry;
			if (e.geometry instanceof sg.geometry.Polygon || e.geometry instanceof sg.geometry.Extent)
			{
				graphic.symbol = new sg.symbols.SimpleFillSymbol();
				graphic.symbol.outline.setWidth(2);
				midpoint = graphic.geometry.rings[0].getMidPoint();
				var midpoint_temp = graphic.geometry.getExtent();
				midpoint.x = (midpoint_temp.xmax + midpoint_temp.xmin) / 2;
				midpoint.y = (midpoint_temp.ymax + midpoint_temp.ymin) / 2;
				countresult = graphic.geometry.getArea();
			}
			else if (e.geometry instanceof sg.geometry.LineString)
			{
				graphic.symbol = new sg.symbols.SimpleLineSymbol();
				graphic.symbol.setWidth(3);
				midpoint = graphic.geometry.getMidPoint();
				countresult = graphic.geometry.getLength();
			}
            
			var graphicLabel = new sg.symbols.TextSymbol();
			graphicLabel.font.size = "20pt";
			graphicLabel.text = "Total " + Math.abs(countresult) / m_dUnits + " " + m_sUnits;
			graphicLabel.className = "textlayer";
			graphicLabel.font.size = "18pt";
			graphicLabel.font.family = "Verdana";
			graphicLabel.font.weight = "bold";
			graphicLabel.color.r = 0;
			graphicLabel.color.g = 0;
			graphicLabel.color.b = 0;
			var graphicLabelText = new sg.Graphic(midpoint, graphicLabel);
			gLayer.add(graphic);
			gLayer.add(graphicLabelText);
		});
		
		
		function rReset(nType, dUnits, sUnits)
		{
			m_nType = nType;
			m_dUnits = dUnits;
			m_sUnits = sUnits;
		}
		
		function activateDrawing(Did, unit)
		{
			draw.activate(sg.Draw[Did],
			{
				showToolTips: false
			});
		}
		
		this.ExitMapEvent = function()
		{
			if (that.activechecked == "active")
			{
				if (ft)
					ft.InitMapEvent(pMapBase);
                //pMapBase.SelectMapTool(gpanTool);
				draw.deactivate();
				that.activechecked = "unactive";
                var tip = FindXMLNodeById(document, "mobiletip");
                tip.innerHTML = '';
                tip.style.display = 'none';
			}
		};
		
		this.ActiveMeasureTool = function()
		{
			that.activechecked = "active";
			if (ft)
				ft.ExitMapEvent(pMapBase);
            //gpanTool.ExitMapEvent();
		};
	}
};
var FindTool = function(parentNode, pMapBase)
{
	var mobile = CheckDevice();
	if (!mobile)
	{
		var m_inputFilter = null;
		var m_pQuery = null;
		var pLyrs = pMapBase.getLayers();
		var pthat = this;
		var pthis;
		var selected_Index;
		var fieldvalue;
		pthat.activechecked = "unactive";
		
		var mNode = document.createElement("div");
		mNode.id = "Findmenu";
		mNode.className = "toolbar";
		mNode.style.height = (document.body.clientHeight - headerHeight) + "px";
		parentNode.appendChild(mNode);
		
		var mNode_hrNode = document.createElement("hr");
		mNode_hrNode.style.position = "absolute";
		mNode_hrNode.style.bottom = "30px";
		mNode_hrNode.style.width = "100%";
		mNode.appendChild(mNode_hrNode);
		
		var mNode_queryimg = document.createElement("img");
		mNode_queryimg.src = "images/PC_OtherTool/Go-Search.png";
		mNode_queryimg.style.position = "absolute";
		mNode_queryimg.style.bottom = "5px";
		mNode_queryimg.style.left = "10px";
		mNode_queryimg.style.height = "25px";
		mNode_queryimg.style.width = "25px";
		mNode_queryimg.title = "Query";
		mNode.appendChild(mNode_queryimg);
		AttachEvent(mNode_queryimg, "click", function ()
		{ //Query button Event
			pthat.pQueryFunc();
		});
		
		var mNode_title = document.createElement("div");
		mNode_title.className = "toolbartitle";
		var mNode_title_h2 = document.createElement("h2");
		mNode_title_h2.innerHTML = "Find";
		var mNode_title_bkimg = document.createElement("img");
		mNode_title_bkimg.src = "images/right-arrow-of-straight-lines.png";
		mNode_title_bkimg.title = "Exit this tool";
		
		AttachEvent(mNode_title_bkimg, "click", function ()
		{ //Exit Tool
			mNode.style.width = "0px";
			FindXMLNodeById(document, "Coordinate").style.zIndex = "32767";
			pthat.ExitMapEvent(true);
		});
		
		mNode_title.appendChild(mNode_title_h2);
		mNode_title.appendChild(mNode_title_bkimg);
		
		mNode.appendChild(mNode_title);
		
		var pNode = document.createElement("div");
		pNode.style.width = "100%";
		pNode.style.overflow = "auto";
		pNode.style.height = (document.body.clientHeight - headerHeight - 90) + "px";
		mNode.appendChild(pNode);
		
		var pQuery_Select_title = document.createElement("label");
		pQuery_Select_title.style.position = "absolute";
		pQuery_Select_title.style.marginTop = "10px";
		pQuery_Select_title.style.left = "10px";
		pQuery_Select_title.fontSize = "12px";
		pQuery_Select_title.innerHTML = "Select Target Layer:";
		pNode.appendChild(pQuery_Select_title);
		
		var pQuery_Select = document.createElement("select");
		pQuery_Select.style.position = "absolute";
		pQuery_Select.style.marginTop = "30px";
		pQuery_Select.style.left = "10px";
		pQuery_Select.style.width = "260px";
		pNode.appendChild(pQuery_Select);
		
		var layers;
		pQuery_Select.onchange = function()
		{
			selected_Index = pQuery_Select.selectedIndex;
			layers = pQuery_Select.options[selected_Index].layer;
			pthat.ExitMapEvent(true);
			pthat.ActiveMapEvent();
		};
		
		for (var i = 0 ; i < pLyrs.length ; i++)
		{
			if (pLyrs[i] instanceof MapLayer || pLyrs[i] instanceof MapCachedLayer)
			{
				layers = pLyrs[i].getLayers();
				for (var j = 0 ; j < layers.length ; j++)
				{
					var opt = new Option(layers[j].getTitle());
					opt.layer = layers;
					pQuery_Select.options.add(opt);
				}
			}
		}
		
		selected_Index = pQuery_Select.selectedIndex;
		if (selected_Index >= 0)
			layers = pQuery_Select.options[selected_Index].layer;
		
		var pQuery_Result = document.createElement("div");
		pQuery_Result.id = "Query_Result";
		pQuery_Result.style.position = "absolute";
		pQuery_Result.style.marginTop = "60px";
		pQuery_Result.style.left = "10px";
		pQuery_Result.style.width = "95%";
		pQuery_Result.style.height = (document.body.clientHeight - headerHeight - 150) + "px";
		pQuery_Result.style.overflow = "auto";
		pNode.appendChild(pQuery_Result);
		
		var pQuery_ResultPage = document.createElement("div");//append result page
		pQuery_ResultPage.id = "QueryResultmenu";
		pQuery_ResultPage.className = "toolbar";
		pQuery_ResultPage.style.height = (document.body.clientHeight - headerHeight) + "px";
		parentNode.appendChild(pQuery_ResultPage);
		
		var ResultPage_resetimg = document.createElement("img");
		ResultPage_resetimg.src = "images/Mobile_OtherTool/Reset.png";
		ResultPage_resetimg.style.position = "absolute";
		ResultPage_resetimg.style.bottom = "5px";
		ResultPage_resetimg.style.left = "10px";
		ResultPage_resetimg.style.height = "25px";
		ResultPage_resetimg.style.width = "25px";
		ResultPage_resetimg.title = "Reset Find Tool";
		pQuery_ResultPage.appendChild(ResultPage_resetimg);
		
		AttachEvent(ResultPage_resetimg, "click", function ()
		{//Reset button Event
			ResultPage_Result.innerHTML = ""; //Clear Last Result
			paging.innerHTML = "";
			result_count.innerHTML = "";
			m_inputFilter.value = "";
			fieldvalue.value = "";
			pQuery_ResultPage.style.width = "0px";
		});
		
		var ResultPage_hrNode = document.createElement("hr");
		ResultPage_hrNode.style.position = "absolute";
		ResultPage_hrNode.style.bottom = "30px";
		ResultPage_hrNode.style.width = "100%";
		pQuery_ResultPage.appendChild(ResultPage_hrNode);
		
		var ResultPage_title = document.createElement("div");
		ResultPage_title.className = "toolbartitle";
		var ResultPage_title_h2 = document.createElement("h2");
		ResultPage_title_h2.innerHTML = "Result";
		var ResultPage_title_bkimg = document.createElement("img");
		ResultPage_title_bkimg.src = "images/right-arrow-of-straight-lines.png";
		ResultPage_title_bkimg.title = "Close Result Page";
		
		AttachEvent(ResultPage_title_bkimg, "click", function ()
		{ //Reset button Event
			ResultPage_Result.innerHTML = ""; //Clear Last Result
			paging.innerHTML = "";
			result_count.innerHTML = "";
			m_inputFilter.value = "";
			fieldvalue.value = "";
			pQuery_ResultPage.style.width = "0px";
		});	
		
		ResultPage_title.appendChild(ResultPage_title_h2);
		ResultPage_title.appendChild(ResultPage_title_bkimg);
		pQuery_ResultPage.appendChild(ResultPage_title);
		
		var ResultPage_Result = document.createElement("div");
		ResultPage_Result.id = "QueryReultpage_Result";
		ResultPage_Result.style.position = "absolute";
		ResultPage_Result.style.marginTop = "40px";
		ResultPage_Result.style.left = "0px";
		ResultPage_Result.style.width = "100%";
		ResultPage_Result.style.height = (document.body.clientHeight - headerHeight - 155) + "px";
		ResultPage_Result.style.overflow = "auto";
		pQuery_ResultPage.appendChild(ResultPage_Result);
		
		var paging = document.createElement("div");//append paging
		paging.id = "result_paging";
		paging.style.position = "absolute";
		paging.style.marginTop = 40 + (document.body.clientHeight - headerHeight - 155) + "px";
		paging.style.width = "100%";
		paging.style.height = "40px";
		pQuery_ResultPage.appendChild(paging);
		
		var result_count = pNode.ownerDocument.createElement("div");
		result_count.style.width = "100%";
		result_count.style.float = "left";
		result_count.style.position = "absolute";
		result_count.style.left = "10px";
		result_count.style.bottom = "45px";
		pQuery_ResultPage.appendChild(result_count);
		
		this.MapCommand = function ()
		{
			var tlyer = layers[selected_Index];
			var pFlds = tlyer.getFields();
			if (pFlds == null)
			{
				pQuery_Result.innerHTML = "This layer not has field can query!";
				return;
			}
			this.pQueryFunc = function()
			{
				if (m_pQuery)
					pMapBase.RemoveElement(m_pQuery);
				m_pQuery = null;
				if (m_inputFilter.value != "")
				{
					pQuery_ResultPage.style.width = "300px"; //Open Result page
					m_pQuery = new MapSelectResult(pMapBase);
					m_pQuery.ExecuteQuery(tlyer, m_inputFilter.value, false);
					pMapBase.AddElement(m_pQuery);
				}
				else
					alert("Please enter the expression!");
			};
			var pClearFunc = function()
			{
				if (m_pQuery)
					pMapBase.RemoveElement(m_pQuery);
				m_pQuery = null;
			};
			var fieldgroup = document.createElement("div");
			fieldgroup.style.width = "100%";
			fieldgroup.style.float = "left";
			pQuery_Result.appendChild(fieldgroup);
			var field = document.createElement("select");
			field.id = "FieldQuery";
			for (var i = 0;i < pFlds.length;i++)
				field.options[i] = new Option(pFlds[i], pFlds[i]);
			field.style.float = "left";
			fieldgroup.appendChild(field);
			var oper = document.createElement("select");
			oper.id = "Oper";
			oper.style.float = "left";
			oper.options[0] = new Option("=", " = ");
			oper.options[1] = new Option("<", " < ");
			oper.options[2] = new Option(">", " > ");
			oper.options[3] = new Option("<=", " <= ");
			oper.options[4] = new Option(">=", " >= ");
			oper.options[5] = new Option("!=", " != ");
			oper.options[6] = new Option("Like", " LIKE ");
			oper.style.marginLeft = "10px";
			fieldgroup.appendChild(oper);
			fieldgroup = document.createElement("div");
			fieldgroup.style.width = "100%";
			fieldgroup.style.float = "left";
			pQuery_Result.appendChild(fieldgroup);
			fieldvalue = document.createElement("input");
			fieldvalue.value = "";
			fieldvalue.style.float = "left";
			fieldvalue.id = "FieldValue";
			fieldvalue.placeholder = "Field Value";
			fieldvalue.size = 20;
			fieldvalue.style.marginTop = "5px";
			fieldgroup.appendChild(fieldvalue);
			inp = pNode.ownerDocument.createElement("input");
			inp.type = "button";
			inp.value = "Append";
			inp.style.marginLeft = "10px";
			inp.style.marginTop = "5px";
			inp.style.backgroundColor = "#FFF";
			inp.style.border = "1px solid #555555";
			inp.style.float = "left";
			AttachEvent(inp, "click", function()
			{
				m_inputFilter.value += "[" + field.options[field.selectedIndex].value + "]" + oper.options[oper.selectedIndex].value + "'" + fieldvalue.value + "'";
			}, false);
			fieldgroup.appendChild(inp);
			var compute_buttongroup = pNode.ownerDocument.createElement("div");
			compute_buttongroup.width = "100%";
			compute_buttongroup.style.float = "left";
			compute_buttongroup.style.marginTop = "30px";
			var inp = pNode.ownerDocument.createElement("input");
			inp.type = "button";
			inp.value = "And";
			inp.style.backgroundColor = "#FFF";
			inp.style.border = "1px solid #555555";
			AttachEvent(inp, "click", function()
			{
				m_inputFilter.value += " AND ";
			}, false);
			compute_buttongroup.appendChild(inp);
			
			inp = pNode.ownerDocument.createElement("input");
			inp.type = "button";
			inp.value = "Or";
			inp.style.marginLeft = "10px";
			inp.style.backgroundColor = "#FFF";
			inp.style.border = "1px solid #555555";
			AttachEvent(inp, "click", function()
			{
				m_inputFilter.value += " OR ";
			}, false);
			compute_buttongroup.appendChild(inp);
			
			inp = pNode.ownerDocument.createElement("input");
			inp.type = "button";
			inp.value = "Not";
			inp.style.marginLeft = "10px";
			inp.style.backgroundColor = "#FFF";
			inp.style.border = "1px solid #555555";
			AttachEvent(inp, "click", function()
			{
				m_inputFilter.value += " NOT ";
			}, false);
			compute_buttongroup.appendChild(inp);
			
			inp = pNode.ownerDocument.createElement("input");
			inp.type = "button";
			inp.value = "(";
			inp.style.marginLeft = "10px";
			inp.style.backgroundColor = "#FFF";
			inp.style.border = "1px solid #555555";
			AttachEvent(inp, "click", function()
			{
				m_inputFilter.value += " ( ";
			}, false);
			compute_buttongroup.appendChild(inp);
			
			inp = pNode.ownerDocument.createElement("input");
			inp.type = "button";
			inp.value = ")";
			inp.style.marginLeft = "10px";
			inp.style.backgroundColor = "#FFF";
			inp.style.border = "1px solid #555555";
			AttachEvent(inp, "click", function()
			{
				m_inputFilter.value += " ) ";
			}, false);
			compute_buttongroup.appendChild(inp);
			
			pQuery_Result.appendChild(compute_buttongroup);
			
			m_inputFilter = pNode.ownerDocument.createElement("textarea");
			m_inputFilter.placeholder = "Expression";
			m_inputFilter.style.height = "300px";
			m_inputFilter.style.width = "270px";
			m_inputFilter.style.marginTop = "5px";
			m_inputFilter.style.resize = "none";
			pQuery_Result.appendChild(m_inputFilter);
		};
		
		MapSelectResult.Results = new Array;
		function MapSelectResult(pMapBase, layer)
		{
			var pNode = pMapBase.getHPackage().ownerDocument.body;
			MapSelectResult.Results.push(this);
			var m_MainDiv;
			var m_pGraps = new Array;
			pThis = this;
			var mLayer = layer;
			
			this.RemoveSelf = function()
			{
				var i;
				for (i = 0 ; i < m_pGraps.length ; i++)
					pMapBase.drawingGraphicsLayer.remove(m_pGraps[i]);
					
				m_pGraps = new Array;
				for (i = 0 ; i < MapSelectResult.Results.length ; i++)
				{
					if (MapSelectResult.Results[i] == this)
					{
						MapSelectResult.Results.splice(i, 1);
						break;
					}
				}
			};
			this.RebuildElement = null;
			this.UpdateElement = null;
			this.GetGraphics = function()
			{
				return m_pGraps;
			};
			AttachEvent(ResultPage_title_bkimg, "click", function ()
			{
				pMapBase.RemoveElement(pThis);
			});
			AttachEvent(ResultPage_resetimg, "click", function ()
			{
				pMapBase.RemoveElement(pThis);
			});
			var InsertFeatures = function(pNodes)
			{
				var geometrys = new Array;
				ResultPage_Result.innerHTML = "";
				if (pNodes.length <= 0)
					return;
				var cnt = pNodes.length;
				function Func(GID, pValues, geometry)
				{
					var map = pMapBase;
					var content = document.createElement("div");
					content.style.width = "100%";
					content.style.float = "left";
					for (var j = 0 ; j < pValues.length ; j++)
					{
						var pValue = pValues.item(j);
						if (pValue.nodeType == 1)
						{
							var childcontent = document.createElement("div");
							childcontent.style.width = "100%";
							childcontent.style.height = "30px";
							childcontent.style.float = "left";
							var field = document.createElement("label");
							field.innerHTML = pValue.tagName.replace(/_x([0-9a-fA-F]{4})_/g, "&#x$1;") + ": ";
							field.style.float = "left";
							var field_text = document.createElement("label");
							field_text.style.float = "left";
							field_text.style.marginRight = "5px";
							
							if (pValue.firstChild != null)
								field_text.innerHTML = pValue.firstChild.nodeValue;
							else
								field_text.innerHTML = "&nbsp;";
							
							childcontent.appendChild(field);
							childcontent.appendChild(field_text);
							content.appendChild(childcontent);
						}
					}
					map.infoWindow.setContent(content);
                    
					if (geometry.geometry instanceof sg.geometry.Polygon || geometry.geometry instanceof sg.geometry.Extent)
					{
						midpoint = geometry.geometry.rings[0].getMidPoint();
						var midpoint_temp = geometry.geometry.getExtent();
						midpoint.x = (midpoint_temp.xmax + midpoint_temp.xmin) / 2;
						midpoint.y = (midpoint_temp.ymax + midpoint_temp.ymin) / 2;
					}
					else if (geometry.geometry instanceof sg.geometry.LineString)
						midpoint = geometry.geometry.getMidPoint();
					else if (geometry.geometry instanceof sg.geometry.Point)
						midpoint = geometry.geometry;
                    
					map.infoWindow.setTitle(GID);
					map.infoWindow.resize(350, 250);
					map.infoWindow.show(midpoint);
				}
				var tempResult = document.createElement("div");
				function ShowQuery(startindex, endindex)
				{
					if (endindex > cnt)
						endindex = cnt;
					for (var i = startindex ; i < endindex ; i++)
					{
						var GID = pNodes.item(i).getAttribute("ID");
						var pValues = GetXMLChildNode(pNodes.item(i), "Values").childNodes;
						var vDiv = document.createElement("div");
						vDiv.className  = "queryitem";
						var vDivLabel = document.createElement("label");
						vDivLabel.className  = "queryitemlabel";
						vDivLabel.innerHTML = GID;
						vDivLabel.title = GID;
                        
						var vDivImg = document.createElement("img");
						vDivImg.src = "images/PC_OtherTool/Go-Search.png";
						vDivImg.style.marginTop = "10px";
						vDivImg.style.marginRight = "10px";
						vDivImg.style.float = "right";
						vDivImg.title = "Move to feature and Show feature attributes.";
						vDivImg.value_index = i;
                        
						AttachEvent(vDivImg, "click", function()
						{
							var index = this.value_index;
							var GID = pNodes.item(index).getAttribute("ID");
							var pValues = GetXMLChildNode(pNodes.item(index), "Values").childNodes;
							pThis.ZoomToSelectTarget(geometrys[index]);
							Func(GID, pValues, geometrys[index]);
						}, false);
						
						vDiv.appendChild(vDivLabel);
						vDiv.appendChild(vDivImg);
						tempResult.appendChild(vDiv);//add tag
						
						var pGeoms = pNodes.item(i).getElementsByTagName("Geometry");
						if (pGeoms == null || pGeoms.length <= 0)
							continue;
                        
						var wkt = "";
						for (var cn = 0 ; cn < pGeoms[0].childNodes.length ; cn++)
							wkt += pGeoms[0].childNodes[cn].nodeValue;
						var geometry = sg.geometry.Geometry.fromWKT(wkt);
						geometrys.push(geometry);
						
						var e = new sg.Graphic;
						if (!geometry)
							continue;
						
						e.geometry = geometry.geometry; //draw geom
						if (e.geometry instanceof sg.geometry.MultiPolygon || e.geometry instanceof sg.geometry.Polygon || e.geometry instanceof sg.geometry.Extent)
						{
							e.symbol = (new sg.symbols.SimpleFillSymbol).setColor(new sg.Color(128, 128, 255, .5));
							e.symbol.outline.setWidth(3);
						}
						else if (e.geometry instanceof sg.geometry.MultiLineString || e.geometry instanceof sg.geometry.LineString)
						{
							e.symbol = (new sg.symbols.SimpleLineSymbol).setColor(new sg.Color(128, 255, 128, 1));
							e.symbol.setWidth(4);
						}
						else if (e.geometry instanceof sg.geometry.Point || e.geometry instanceof sg.geometry.MultiPoint)
						{
							var symbol = (new sg.symbols.SimpleMarkerSymbol).setSize(16).setOutline(new sg.symbols.SimpleLineSymbol);
							e.symbol = symbol;
						}
						if (pMapBase.drawingGraphicsLayer)
						{
							pMapBase.drawingGraphicsLayer.add(e);
							m_pGraps.push(e);
						}
					}
					ResultPage_Result.appendChild(tempResult);
					pMapBase.RefreshMap(true);
				}
				function ShowPaging(nowpage, page)
				{
					var pagestart;
					var pageend;
					var islast = false;
					var isfirst = false;
					if (nowpage < 2 || page <= 3)
					{
						pagestart = 0;
						pageend = 2;
						if (page < pageend)
							pageend = page - 1;
						if (nowpage == 0)
							isfirst = true;
						if (nowpage == page - 1)
							islast = true;
					}
					else
					{
						pagestart = nowpage - 1;
						pageend = nowpage + 1;
						if (nowpage == page - 1)
						{
							islast = true;
							pagestart = nowpage - 2;
							pageend = nowpage;
						}
					}
					if (!isfirst)
					{
						var tempdiv = document.createElement("label");
						tempdiv.innerHTML = "Previou";
						tempdiv.index = nowpage - 1;
						AttachEvent(tempdiv, "click", function()
						{
							ResultPage_Result.innerHTML = "";
							tempResult.innerHTML = "";
							paging.innerHTML = "";
							pMapBase.RemoveElement(pThis);
							var start = this.index * 2000 + 1;
							var end = (this.index + 1) * 2000;
							(function()
							{
								ShowQuery(start, end);
							}());
							ShowPaging(this.index, page);
						});
						paging.appendChild(tempdiv);
					}
					for (var i = pagestart ; i <= pageend ; i++)
					{
						var tempdiv = document.createElement("label");
						if (i == nowpage)
							tempdiv.style.textDecoration = "underline";
						tempdiv.innerHTML = i + 1;
						tempdiv.index = i;
						AttachEvent(tempdiv, "click", function()
						{
							ResultPage_Result.innerHTML = "";
							tempResult.innerHTML = "";
							paging.innerHTML = "";
							pMapBase.RemoveElement(pThis);
							var start = this.index * 2000 + 1;
							var end = (this.index + 1) * 2000;
							(function()
							{
								ShowQuery(start, end);
							}());
							ShowPaging(this.index, page);
						});
						paging.appendChild(tempdiv);
					}
					if (!islast)
					{
						var tempdiv = document.createElement("label");
						tempdiv.innerHTML = "Next";
						tempdiv.index = nowpage + 1;
						AttachEvent(tempdiv, "click", function()
						{
							ResultPage_Result.innerHTML = "";
							tempResult.innerHTML = "";
							paging.innerHTML = "";
							pMapBase.RemoveElement(pThis);
							var start = this.index * 2000 + 1;
							var end = (this.index + 1) * 2000;
							(function()
							{
								ShowQuery(start, end);
							}());
							ShowPaging(this.index, page);
						});
						paging.appendChild(tempdiv);
					}
				}
				
				var page = Math.ceil(cnt / 2000);
				var startindex = 0;
				var endindex;
				if (page == 1)
					endindex = cnt;
				else
					endindex = 2000;
				var nowpage = 0;
				ShowQuery(startindex, endindex);
				ShowPaging(nowpage, page);
				result_count.innerHTML = "Find " + cnt + " records.";
			};
			this.ZoomToSelectTarget = function(geometry)
			{
				if (geometry.geometry instanceof sg.geometry.Point)
					pMapBase.MoveMapTo(geometry.geometry.x, geometry.geometry.y);
				else
					pMapBase.ZoomMapTo(geometry.geometry.extent);
				pMapBase.RefreshMap(true);
			};
			this.ExecuteQuery = function(pLayer, expr, bGeom)
			{
				if (pLayer.ExecuteQuery == null)
				{
					ResultPage_Result.innerHTML = "Query failed";
					return;
				}
				ResultPage_Result.innerHTML = "Querying...................";
				pLayer.ExecuteQuery(expr, bGeom, function(pRequest)
				{
					var pDoc = pRequest.responseXML;
					var pNodes = FindXMLNodes(pDoc, "Feature");
					if (pNodes.length > 0)
						InsertFeatures(pNodes);
					else
						ResultPage_Result.innerHTML = "No data found";
				},
				function()
				{
					ResultPage_Result.innerHTML = "Query failed";
				});
			};
		}
		var GetResource = function ()
		{
			pthat.MapCommand();
		};
		this.ActiveMapEvent = function ()
		{
			pthat.activechecked = "active";
			GetResource();
		};
		this.ExitMapEvent = function (bClearAll)
		{
			pQuery_Result.innerHTML = "";
			pthat.activechecked = "unactive";
		};
		this.clearResult = function()
		{
			if (m_pQuery)
				pMapBase.RemoveElement(m_pQuery);
		};
	}
	else
	{
		var m_inputFilter = null;
		var m_pQuery = null;
		var pLyrs = pMapBase.getLayers();
		var pthat = this;
		var selected_Index;
		var fieldvalue;
		pthat.activechecked = "unactive";
		
		var mNode = document.createElement("div");
		mNode.id = "Findmenu";
		mNode.className = "toolbar";
        mNode.style.height = "70%";
        mNode.style.width = "70%";
        mNode.style.position = "absolute";
        mNode.style.top = "20%";
        mNode.style.left ="15%";
        mNode.style.display = "none";
		parentNode.appendChild(mNode);
				
		var mNode_title = document.createElement("div");
		mNode_title.className = "toolbartitle";
		var mNode_title_h2 = document.createElement("h2");
		mNode_title_h2.innerHTML = "搜尋";
		var mNode_title_bkimg = document.createElement("img");
		mNode_title_bkimg.src = "images/right-arrow-of-straight-lines.png";
		mNode_title_bkimg.title = "Exit this tool";
		
		AttachEvent(mNode_title_bkimg, "touchstart", function ()
		{   //Exit Tool
            mNode.style.display = 'none';
			FindXMLNodeById(document, "Coordinate").style.zIndex = "32767";
			pthat.ExitMapEvent(true);
		});
		
		mNode_title.appendChild(mNode_title_h2);
		mNode_title.appendChild(mNode_title_bkimg);
		
		mNode.appendChild(mNode_title);
		
		var pNode = document.createElement("div");
		pNode.style.width = "100%";
		pNode.style.overflow = "auto";
		pNode.style.height = ((document.body.clientHeight * 0.7) - (document.body.clientHeight * 0.7 * 0.1)) + "px";
		mNode.appendChild(pNode);
		
		var pQuery_Select_title = document.createElement("label");
		pQuery_Select_title.style.position = "absolute";
		pQuery_Select_title.style.marginTop = "2%";
		pQuery_Select_title.style.left = "10px";
		pQuery_Select_title.style.fontSize = "35pt";
		pQuery_Select_title.innerHTML = "查詢圖層:";
		pNode.appendChild(pQuery_Select_title);
		
		var pQuery_Select = document.createElement("select");
		pQuery_Select.style.position = "absolute";
		pQuery_Select.style.marginTop = "11%";
		pQuery_Select.style.fontSize = "35pt";
		pQuery_Select.style.marginBottom = "20px";
		pQuery_Select.style.left = "10px";
		pQuery_Select.style.width = "90%";
		pNode.appendChild(pQuery_Select);
		
		var layers;
		pQuery_Select.onchange = function()
		{
			selected_Index = pQuery_Select.selectedIndex;
			layers = pQuery_Select.options[selected_Index].layer;
			pthat.ExitMapEvent(true);
			pthat.ActiveMapEvent();
		};
		
		for (var i = 0 ; i < pLyrs.length ; i++)
		{
			if (pLyrs[i] instanceof MapLayer || pLyrs[i] instanceof MapCachedLayer)
			{
				layers = pLyrs[i].getLayers();
				for (var j = 0 ; j < layers.length ; j++)
				{
					var opt = new Option(layers[j].getTitle());
					opt.layer = layers;
					pQuery_Select.options.add(opt);
				}
			}
		}
		
		selected_Index = pQuery_Select.selectedIndex;
		if (selected_Index >= 0)
			layers = pQuery_Select.options[selected_Index].layer;
		
		var pQuery_Result = document.createElement("div");
		pQuery_Result.id = "Query_Result";
		pQuery_Result.style.position = "absolute";
		pQuery_Result.style.marginTop = "25%";
		pQuery_Result.style.left = "10px";
		pQuery_Result.style.width = "95%";
		pQuery_Result.style.height = ((document.body.clientHeight * 0.7) - (document.body.clientHeight * 0.7 * 0.22)) + "px";
		//pQuery_Result.style.overflow = "auto";
		pNode.appendChild(pQuery_Result);
		
		var pQuery_ResultPage = document.createElement("div");//append result page
		pQuery_ResultPage.id = "QueryResultmenu";
		pQuery_ResultPage.className = "toolbar";
		pQuery_ResultPage.style.height = "70%";
        pQuery_ResultPage.style.width = "70%";
        pQuery_ResultPage.style.position = "absolute";
        pQuery_ResultPage.style.top = "20%";
        pQuery_ResultPage.style.left ="15%";
        pQuery_ResultPage.style.display = "none";
		parentNode.appendChild(pQuery_ResultPage);
		
		var ResultPage_resetimg = document.createElement("img");
		ResultPage_resetimg.src = "images/Mobile_OtherTool/Reset.png";
		ResultPage_resetimg.style.position = "absolute";
		ResultPage_resetimg.style.bottom = "1%";
		ResultPage_resetimg.style.left = "10px";
		ResultPage_resetimg.style.height = "6%";
		ResultPage_resetimg.style.width = "10%";
		ResultPage_resetimg.title = "Reset Find Tool";
		pQuery_ResultPage.appendChild(ResultPage_resetimg);
		
		AttachEvent(ResultPage_resetimg, "touchstart", function ()
		{   //Reset button Event
			m_inputFilter.value = "";
			fieldvalue.value = "";
            pQuery_ResultPage.style.display = 'none';
            mNode.style.display = 'block';
			if(ft)
				ft.InitMapEvent(pMapBase);//Close Map tool
		});
				
		var ResultPage_title = document.createElement("div");
		ResultPage_title.className = "toolbartitle";
		var ResultPage_title_h2 = document.createElement("h2");
		ResultPage_title_h2.innerHTML = "查詢結果";
		var ResultPage_title_bkimg = document.createElement("img");
		ResultPage_title_bkimg.src = "images/right-arrow-of-straight-lines.png";
		ResultPage_title_bkimg.title = "Close Result Page";
		
		AttachEvent(ResultPage_title_bkimg, "touchstart", function ()
		{   //Reset button Event
			m_inputFilter.value = "";
			fieldvalue.value = "";
            pQuery_ResultPage.style.display = 'none';
			if(ft)
				ft.InitMapEvent(pMapBase);//Close Map tool
		});
		
		ResultPage_title.appendChild(ResultPage_title_h2);
		ResultPage_title.appendChild(ResultPage_title_bkimg);
		pQuery_ResultPage.appendChild(ResultPage_title);
		
		var ResultPage_Result = document.createElement("div");
		ResultPage_Result.id = "QueryReultpage_Result";
		//ResultPage_Result.style.position = "absolute";
		//ResultPage_Result.style.marginTop = document.body.clientHeight * 0.1 + "px";
		//ResultPage_Result.style.left = "0px";
		ResultPage_Result.style.width = "100%";
		ResultPage_Result.style.height = (document.body.clientHeight * 0.6 - (document.body.clientHeight * 0.1)) + "px";
		ResultPage_Result.style.overflow = "auto";
		pQuery_ResultPage.appendChild(ResultPage_Result);
		
		var result_count = pNode.ownerDocument.createElement("div");
		result_count.style.width = "100%";
		result_count.style.float = "left";
		result_count.style.position = "absolute";
		result_count.style.fontSize = "35pt";
		result_count.style.left = "10px";
		result_count.style.bottom = "6%";
		pQuery_ResultPage.appendChild(result_count);
		
		this.MapCommand = function ()
		{
			var tlyer = layers[selected_Index];
			var pFlds = tlyer.getFields();
			if (pFlds == null)
			{
				pQuery_Result.innerHTML = "This layer not has field can query!";
				return;
			}
			this.pQueryFunc = function()
			{
				if (m_pQuery)
					pMapBase.RemoveElement(m_pQuery);
				m_pQuery = null;
				if (m_inputFilter.value != "")
				{
					ResultPage_Result.innerHTML = ""; //Clear Last Result
                    pQuery_ResultPage.style.display = 'block';
					pQuery_ResultPage.style.zIndex = "32767";
					m_pQuery = new MapSelectResult(pMapBase);
					m_pQuery.ExecuteQuery(tlyer, m_inputFilter.value, false);
					pMapBase.AddElement(m_pQuery);
				}
				else
					alert("Please enter the expression!");
			};
			var pClearFunc = function()
			{
				if (m_pQuery)
					pMapBase.RemoveElement(m_pQuery);
				m_pQuery = null;
			};
			
			var fieldgroup = document.createElement("div");
			fieldgroup.style.width = "100%";
			fieldgroup.style.float = "left";
			fieldgroup.style.marginBottom = "10px";
			pQuery_Result.appendChild(fieldgroup);
			
			var field = document.createElement("select");
			field.id = "FieldQuery";
			field.style.fontSize = "35pt";
			
			for (var i = 0;i < pFlds.length;i++)
				field.options[i] = new Option(pFlds[i], pFlds[i]);
			
			field.style.float = "left";
			fieldgroup.appendChild(field);
					
			fieldgroup = document.createElement("div");
			fieldgroup.style.width = "100%";
			fieldgroup.style.float = "left";
			fieldgroup.style.marginBottom = "10px";
			pQuery_Result.appendChild(fieldgroup);
			
			var oper = document.createElement("select");
			oper.id = "Oper";
			oper.style.float = "left";
			oper.style.fontSize = "35pt";
			oper.options[0] = new Option("=", " = ");
			oper.options[1] = new Option("<", " < ");
			oper.options[2] = new Option(">", " > ");
			oper.options[3] = new Option("<=", " <= ");
			oper.options[4] = new Option(">=", " >= ");
			oper.options[5] = new Option("!=", " != ");
			oper.options[6] = new Option("Like", " LIKE ");
			oper.style.marginTop = "5px";
			
			fieldgroup.appendChild(oper);
			
			fieldvalue = document.createElement("input");
			fieldvalue.value = "";
			fieldvalue.style.fontSize = "35pt";
			fieldvalue.style.float = "left";
			fieldvalue.id = "FieldValue";
			fieldvalue.placeholder = "Field Value";
			fieldvalue.style.width = "60%";
			fieldvalue.style.marginLeft = "10px";
			fieldvalue.style.marginTop = "5px";
			fieldgroup.appendChild(fieldvalue);
			
			var fieldgroup = document.createElement("div");
			fieldgroup.style.width = "100%";
			fieldgroup.style.float = "left";
			fieldgroup.style.marginBottom = "10px";
			pQuery_Result.appendChild(fieldgroup);

			inp = pNode.ownerDocument.createElement("div");
			inp.type = "button";
			inp.innerHTML = "Append";
            inp.style.textAlign = 'center';
            inp.style.width = '180px';
			inp.style.fontSize = "35pt";
			inp.style.marginTop = "5px";
			inp.style.backgroundColor = "#FFF";
			inp.style.border = "1px solid #555555";
			inp.style.float = "left";
			AttachEvent(inp, "touchstart", function()
			{
				m_inputFilter.value += "[" + field.options[field.selectedIndex].value + "]" + oper.options[oper.selectedIndex].value + "'" + fieldvalue.value + "'";
			}, false);
			fieldgroup.appendChild(inp);
			
			var compute_buttongroup = pNode.ownerDocument.createElement("div");
			compute_buttongroup.style.width = "100%";
			compute_buttongroup.style.float = "left";
			compute_buttongroup.style.marginTop = "10px";
			var inp = pNode.ownerDocument.createElement("div");
			inp.type = "button";
			inp.innerHTML = "And";
            inp.style.textAlign = 'center';
            inp.style.width = '100px';
            inp.style.float = 'left';
			inp.style.fontSize = "35pt";
			inp.style.backgroundColor = "#FFF";
			inp.style.border = "1px solid #555555";
			AttachEvent(inp, "touchstart", function()
			{
				m_inputFilter.value += " AND ";
			}, false);
			compute_buttongroup.appendChild(inp);
			
			inp = pNode.ownerDocument.createElement("div");
			inp.type = "button";
			inp.innerHTML = "Or";
            inp.style.textAlign = 'center';
            inp.style.width = '60px';
            inp.style.float = 'left';
			inp.style.fontSize = "35pt";
			inp.style.marginLeft = "10px";
			inp.style.backgroundColor = "#FFF";
			inp.style.border = "1px solid #555555";
			AttachEvent(inp, "touchstart", function()
			{
				m_inputFilter.value += " OR ";
			}, false);
			compute_buttongroup.appendChild(inp);
			
			inp = pNode.ownerDocument.createElement("div");
			inp.type = "button";
			inp.innerHTML = "Not";
            inp.style.textAlign = 'center';
            inp.style.width = '80px';
            inp.style.float = 'left';
			inp.style.fontSize = "35pt";
			inp.style.marginLeft = "10px";
			inp.style.backgroundColor = "#FFF";
			inp.style.border = "1px solid #555555";
			AttachEvent(inp, "touchstart", function()
			{
				m_inputFilter.value += " NOT ";
			}, false);
			compute_buttongroup.appendChild(inp);
			
			inp = pNode.ownerDocument.createElement("div");
			inp.type = "button";
			inp.innerHTML = "(";
            inp.style.textAlign = 'center';
            inp.style.width = '40px';
            inp.style.float = 'left';
			inp.style.fontSize = "35pt";
			inp.style.marginLeft = "10px";
			inp.style.backgroundColor = "#FFF";
			inp.style.border = "1px solid #555555";
			AttachEvent(inp, "touchstart", function()
			{
				m_inputFilter.value += " ( ";
			}, false);
			compute_buttongroup.appendChild(inp);
			
			inp = pNode.ownerDocument.createElement("div");
			inp.type = "button";
			inp.innerHTML = ")";
            inp.style.textAlign = 'center';
            inp.style.width = '40px';
            inp.style.float = 'left';
			inp.style.fontSize = "35pt";
			inp.style.marginLeft = "10px";
			inp.style.backgroundColor = "#FFF";
			inp.style.border = "1px solid #555555";
			AttachEvent(inp, "touchstart", function()
			{
				m_inputFilter.value += " ) ";
			}, false);
			compute_buttongroup.appendChild(inp);
			
			m_inputFilter = pNode.ownerDocument.createElement("textarea");
			m_inputFilter.placeholder = "Expression";
			m_inputFilter.style.fontSize = "35pt";
			m_inputFilter.style.height = "45%";
			m_inputFilter.style.width = "90%";
			m_inputFilter.style.marginTop = "5px";
			m_inputFilter.style.resize = "none";
                        
            inp = pNode.ownerDocument.createElement("div");
			inp.type = "button";
			inp.innerHTML = "確定";
			inp.style.fontSize = "45pt";
			inp.style.marginTop = "5px";
			inp.style.backgroundColor = "#FFF";
			inp.style.border = "1px solid #555555";
			inp.style.float = "left";
            
            AttachEvent(inp, "touchstart", function ()
		    { //Query button Event
		    	if (ft)
		    		ft.ExitMapEvent(pMapBase);//Close Map tool
		    	pthat.pQueryFunc();
		    });
            
			pQuery_Result.appendChild(m_inputFilter);
			pQuery_Result.appendChild(compute_buttongroup);
            pQuery_Result.appendChild(inp);
		};
		
		MapSelectResult.Results = new Array;
		function MapSelectResult(pMapBase, layer)
		{
			var pNode = pMapBase.getHPackage().ownerDocument.body;
			MapSelectResult.Results.push(this);
			var m_MainDiv;
			var m_pGraps = new Array;
			var pThis = this;
			var mLayer = layer;
			
			this.RemoveSelf = function()
			{
				var i;
				for (i = 0 ; i < m_pGraps.length ; i++)
					pMapBase.drawingGraphicsLayer.remove(m_pGraps[i]);
					
				m_pGraps = new Array;
				for (i = 0 ; i < MapSelectResult.Results.length ; i++)
				{
					if (MapSelectResult.Results[i] == this)
					{
						MapSelectResult.Results.splice(i, 1);
						break;
					}
				}
			};

			this.RebuildElement = null;
			this.UpdateElement = null;
			this.GetGraphics = function()
			{
				return m_pGraps;
			};
			AttachEvent(ResultPage_title_bkimg, "touchstart", function ()
			{
				pMapBase.RemoveElement(pThis);
			});
			AttachEvent(ResultPage_resetimg, "touchstart", function ()
			{
				pMapBase.RemoveElement(pThis);
			});
			var InsertFeatures = function(pNodes)
			{
				var geometrys = new Array;
				ResultPage_Result.innerHTML = "";
				//paging.innerHTML = "";
				result_count.innerHTML = "";
				if (pNodes.length <= 0)
					return;
				var cnt = pNodes.length;
				function Func(GID, pValues, geometry, idx)
				{
					var map = pMapBase;
					var content = document.createElement("div");
					content.style.width = "100%";
					content.style.float = "left";
					
					for (var j = 0 ; j < pValues.length ; j++)
					{
						var pValue = pValues.item(j);
						if (pValue.nodeType == 1)
						{
                            var childcontent = document.createElement("div");
                            childcontent.style.width = "100%";
                            childcontent.style.marginTop = "1%";
                            childcontent.style.height = "10%";
                            childcontent.style.float = "left";
                            var field = document.createElement("label");
                            field.innerHTML = pValue.tagName.replace(/_x([0-9a-fA-F]{4})_/g, "&#x$1;");
                            field.style.float = "left";
                            field.style.marginLeft = "15px";
                            field.style.fontSize = "35pt";
                            
                            if (field.innerHTML != '照片')
                            {
                                var field_text = document.createElement("label");
                                field_text.style.fontSize = "35pt";
                                field_text.style.float = "right";
                                field_text.style.marginRight = "15px";
                                if (pValue.firstChild != null)
                                    field_text.innerHTML = pValue.firstChild.nodeValue;
                                else
                                    field_text.innerHTML = "&nbsp;";
                            
                                childcontent.appendChild(field);
                                childcontent.appendChild(field_text);
                                content.appendChild(childcontent);
                            }
                            else
                            {
                                var field_text = CreateInput(childcontent, "text", i, "");
                                field_text.style.fontSize = "35pt";
                                field_text.style.float = "right";
                                field_text.style.marginRight = "15px";
                                field_text.style.width = '60%';
                                field_text.style.display = 'none';

                                if (pValue.firstChild != null)
                                    field_text.value = pValue.firstChild.nodeValue;
                                else
                                    field_text.value = "";
                                
                                var v = field_text.value;
                                if (v == '')
                                {
                                    var lab = document.createElement("label");
					                lab.innerHTML = "無照片.";
					                lab.style.fontSize = "35pt";
					                lab.style.float = "right";
					                lab.style.marginRight = "15px";
                                    childcontent.appendChild(lab);
                                }
                                else
                                {
                                    var vs = v.split(';');
                                    var primg = document.createElement("img");
                                    primg.src = "PhotoUpload/" + GID + "/" + vs[0];
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
					                    tar_title_label.style.fontSize = "35pt";
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
                                            
                                            var img = document.createElement("img");
                                            img.style.width = '100%';
                                            img.style.height = '100%';
                                            img.src = "PhotoUpload/" + GID + "/" + values[i];
                                            div.appendChild(img);
                                    
                                            tar_body.appendChild(div);
                                        }

                                        tar.style.display = 'block';
                                        tar.style.zIndex = '32767';
	                                }, false);
                                }
                            }
                            childcontent.appendChild(field);
                            content.appendChild(childcontent);
						}
					}
					var moNode = FindXMLNodeById(document, "mobilebox");
					moNode.innerHTML = "";
					
					var mobile_result_title = document.createElement("div");
					mobile_result_title.style.float = "left";
					mobile_result_title.style.width = "100%";
					mobile_result_title.style.height = "10%";
					mobile_result_title.style.overflow = "hidden";
					mobile_result_title.style.backgroundColor = "#2F9BDA";
					moNode.appendChild(mobile_result_title);
					
					var mobile_result_title_label = document.createElement("label");
					mobile_result_title_label.style.float = "left";
					mobile_result_title_label.style.color = "#FFF";
					mobile_result_title_label.style.fontSize = "35pt";
					mobile_result_title_label.style.marginLeft = "2%";
					mobile_result_title_label.style.marginTop = "2%";
					mobile_result_title.appendChild(mobile_result_title_label);

					var mobile_result_body = document.createElement("div");
					mobile_result_body.style.float = "left";
					mobile_result_body.style.width = "100%";
					mobile_result_body.style.height = "80%";
					mobile_result_body.style.overflow = "auto";
					moNode.appendChild(mobile_result_body);
					
					var mobile_result_bottom = document.createElement("div");
					mobile_result_bottom.style.borderTop = "solid";
					mobile_result_bottom.style.float = "left";
					mobile_result_bottom.style.width = "100%";
					mobile_result_bottom.style.height = "10%";
					moNode.appendChild(mobile_result_bottom);
					
					var previous_btn = document.createElement("input");
					previous_btn.style.fontSize = "35pt";
					previous_btn.value = "Previous";
					previous_btn.type = "button";
					previous_btn.style.marginLeft = "15px";
					previous_btn.style.marginTop = "3%";
					previous_btn.style.backgroundColor = "#FFF";
					previous_btn.style.border = "1px solid #555555";
					mobile_result_bottom.appendChild(previous_btn);
					AttachEvent(previous_btn, "click", function ()
					{
						var k = FindXMLNodesByClassName (document, "searchimg");
						var j;
						for (j = 0 ; j < k.length ; j++)
						{
							if (k[j].value_index == (idx - 1))
								break;
						}
						if (j != k.length)
						{
							var index = j;
							var GID = pNodes.item(index).getAttribute("ID");
							var pValues = GetXMLChildNode(pNodes.item(index), "Values").childNodes;
							pThis.ZoomToSelectTarget(geometrys[index]);
							Func(GID, pValues, geometrys[index], index);
						}
					});
					
					var Next_btn = document.createElement("input");
					Next_btn.style.fontSize = "35pt";
					Next_btn.value = "Next";
					Next_btn.type = "button";
					Next_btn.style.marginLeft = "15px";
					Next_btn.style.marginTop = "3%";
					Next_btn.style.backgroundColor = "#FFF";
					Next_btn.style.border = "1px solid #555555";
					mobile_result_bottom.appendChild(Next_btn);
					AttachEvent(Next_btn, "click", function ()
					{
						var k = FindXMLNodesByClassName (document, "searchimg");
						var j;
						for (j = 0 ; j < k.length ; j++)
						{
							if(k[j].value_index == (idx + 1))
								break;
						}
						if (j != k.length)
						{
							var index = j;
							var GID = pNodes.item(index).getAttribute("ID");
							var pValues = GetXMLChildNode(pNodes.item(index), "Values").childNodes;
							pThis.ZoomToSelectTarget(geometrys[index]);
							Func(GID, pValues, geometrys[index], index);
						}
					});
					
					var Back_btn = document.createElement("input");
					Back_btn.id = "E_Clear";
					Back_btn.style.fontSize = "35pt";
					Back_btn.value = "Back to list";
					Back_btn.type = "button";
					Back_btn.style.marginLeft = "15px";
					Back_btn.style.marginTop = "3%";
					Back_btn.style.backgroundColor = "#FFF";
					Back_btn.style.border = "1px solid #555555";
					mobile_result_bottom.appendChild(Back_btn);
					AttachEvent(Back_btn, "click", function ()
					{
						map.infoWindow.hide();
                        moNode.style.display = 'none';
						moNode.innerHTML = "";
						//pQuery_ResultPage.style.width = "80%";
                        pQuery_ResultPage.style.display = 'block';
					});
					
					mobile_result_title_label.innerHTML = GID;
					mobile_result_body.appendChild(content);
					map.infoWindow.setContent("...................");
					
					if (geometry.geometry instanceof sg.geometry.Polygon || geometry.geometry instanceof sg.geometry.Extent)
					{
						midpoint = geometry.geometry.rings[0].getMidPoint();
						var midpoint_temp = geometry.geometry.getExtent();
						midpoint.x = (midpoint_temp.xmax + midpoint_temp.xmin) / 2;
						midpoint.y = (midpoint_temp.ymax + midpoint_temp.ymin) / 2;
					}
					else if (geometry.geometry instanceof sg.geometry.LineString)
						midpoint = geometry.geometry.getMidPoint();
					else if (geometry.geometry instanceof sg.geometry.Point)
						midpoint = geometry.geometry;
					
					//moNode.style.height = "50%";
					moNode.style.zIndex = "32767";
					//mNode.style.width = "0px";
                    moNode.style.display = 'block';
                    mNode.style.display = 'none';
					//pQuery_ResultPage.style.width = "0px";
                    pQuery_ResultPage.style.display = 'none';
					map.infoWindow.setTitle("target");
					map.infoWindow.resize(80, 50);
					map.infoWindow.show(midpoint);
				}
				
				for (var i = 0 ; i < cnt ; i++)
				{
					var GID = pNodes.item(i).getAttribute("ID");
					var pValues = GetXMLChildNode(pNodes.item(i), "Values").childNodes;
					var vDiv = document.createElement("div");
					vDiv.style.width = "100%";
					vDiv.style.height = "12%";
					vDiv.style.float = "left";
					var vDivLabel = document.createElement("label");
					vDivLabel.style.fontSize = "45pt";
					vDivLabel.style.marginTop = "2%";
					vDivLabel.style.marginLeft = "20px";
					vDivLabel.style.float = "left";
					vDivLabel.style.width = "80%";
					vDivLabel.style.overflow = "hidden";
					vDivLabel.innerHTML = GID;
					vDivLabel.title = GID;
					var vDivImg = document.createElement("img");
					vDivImg.src = "images/PC_OtherTool/Go-Search.png";
					vDivImg.style.marginTop = "2%";
					//vDivImg.style.marginRight = "10px";
					//vDivImg.style.width = "8%";
					vDivImg.style.height = "70%";
					vDivImg.style.float = "right";
					vDivImg.className = "searchimg";
					vDivImg.title = "Move to feature and Show feature attributes.";
					vDivImg.value_index = i;

					if (i % 2 == 1)
						vDiv.style.backgroundColor = "#DCDCDC";
					
					vDiv.appendChild(vDivLabel);
					vDiv.appendChild(vDivImg);
					ResultPage_Result.appendChild(vDiv);
					
					var pGeoms = pNodes.item(i).getElementsByTagName("Geometry");
					if (pGeoms == null || pGeoms.length <= 0)
						continue;
					
					var wkt = "";
					for (var cn = 0 ; cn < pGeoms[0].childNodes.length ; cn++)
						wkt += pGeoms[0].childNodes[cn].nodeValue;
					var geometry = sg.geometry.Geometry.fromWKT(wkt);
					geometrys.push(geometry);
					
					AttachEvent(vDivImg, "touchstart", function()
					{
						var index = this.value_index;
						var GID = pNodes.item(index).getAttribute("ID");
						var pValues = GetXMLChildNode(pNodes.item(index), "Values").childNodes;
						pThis.ZoomToSelectTarget(geometrys[index]);
						Func(GID, pValues, geometrys[index], index);
					}, false);
					
					var e = new sg.Graphic;
					if (!geometry)
						return;
					e.id = GID;
					e.geometry = geometry.geometry;
					if (e.geometry instanceof sg.geometry.MultiPolygon || e.geometry instanceof sg.geometry.Polygon || e.geometry instanceof sg.geometry.Extent)
					{
						e.symbol = (new sg.symbols.SimpleFillSymbol).setColor(new sg.Color(128, 128, 255, .5));
						e.symbol.outline.setWidth(3);
					}
					else if (e.geometry instanceof sg.geometry.MultiLineString || e.geometry instanceof sg.geometry.LineString)
					{
						e.symbol = (new sg.symbols.SimpleLineSymbol).setColor(new sg.Color(128, 255, 128, 1));
						e.symbol.setWidth(4);
					}
					else if (e.geometry instanceof sg.geometry.Point || e.geometry instanceof sg.geometry.MultiPoint)
					{
						var symbol = (new sg.symbols.SimpleMarkerSymbol).setSize(16).setOutline(new sg.symbols.SimpleLineSymbol);
						e.symbol = symbol;
					}
					if (pMapBase.drawingGraphicsLayer)
					{
						pMapBase.drawingGraphicsLayer.add(e);
						m_pGraps.push(e);
					}
					pMapBase.RefreshMap(true);
				}
				result_count.innerHTML = "Find " + cnt + " records.";
			};
			this.ZoomToSelectTarget = function(geometry)
			{
				if (geometry.geometry instanceof sg.geometry.Point)
					pMapBase.MoveMapTo(geometry.geometry.x, geometry.geometry.y);
				else
					pMapBase.ZoomMapTo(geometry.geometry.extent);
				pMapBase.RefreshMap(true);
			};
			this.ExecuteQuery = function(pLayer, expr, bGeom)
			{
				if (pLayer.ExecuteQuery == null)
				{
					ResultPage_Result.innerHTML = "Query failed";
					return;
				}
				ResultPage_Result.innerHTML = "Querying...................";
				pLayer.ExecuteQuery(expr, bGeom, function(pRequest)
				{
					var pDoc = pRequest.responseXML;
					var pNodes = FindXMLNodes(pDoc, "Feature");
					if (pNodes.length > 0)
						InsertFeatures(pNodes);
					else
						ResultPage_Result.innerHTML = "No data found";
				},
				function()
				{
					ResultPage_Result.innerHTML = "Query failed";
				});
			};
		}
		
		var GetResource = function ()
		{
			pthat.MapCommand();
		};
		
		this.ActiveMapEvent = function ()
		{
			pthat.activechecked = "active";
			GetResource();
		};
		
		this.ExitMapEvent = function (bClearAll)
		{
			pQuery_Result.innerHTML = "";
			pthat.activechecked = "unactive";
		};
		
		this.clearResult = function()
		{
			if (m_pQuery)
				pMapBase.RemoveElement(m_pQuery);
		};
	}
};
(function ()
{
	sg.FeatureInfoTool = function (pMapCont)
	{
		this.ExitMapEvent = null;
		var hObj = null;
		var pGeomertry = null;
		var activeGraphics = [];
		var pthat = this;
		this.active = false;
		var findtype;
		var mobile = CheckDevice();
		
		if (!mobile)
		{
			this.InitMapEvent = function (pMapBase)
			{
				hObj = pMapBase.getHPackage();
				pthat.active = true;
				
				var Values = new Array;
				var onClick = function (tEvent)
				{
					if (pMapCont == null || pthat.active == false)
						return;
					for (var i = 0 ; i < pMapCont.length ; i++)
					{
						var targetLayer = pMapCont[i];
						if (targetLayer.ExecuteQuery == null)
							continue;
						var OffsetPt2 = pMapBase.getCursorPosition(tEvent);
						var MousePt = pMapBase.ToMapPoint(OffsetPt2.X, OffsetPt2.Y);
						var cpt1 = pMapBase.ToMapPoint(OffsetPt2.X - 15, OffsetPt2.Y - 15);
						var cpt2 = pMapBase.ToMapPoint(OffsetPt2.X + 15, OffsetPt2.Y + 15);
						var expr = "RC( " + cpt1.X + " " + cpt1.Y + "," + cpt2.X + " " + cpt2.Y + " )";
						findtype = false;
						
						targetLayer.ExecuteQuery(expr, true, function(pRequest)
						{
							var pDoc = pRequest.responseXML;
							var pNodes = pDoc.documentElement.getElementsByTagName("Feature");
							if (pNodes.length <= 0 || findtype == true)
								return;
							var pValues = GetXMLChildNode(pNodes.item(0), "Values").childNodes;
							var pGeoms = pNodes.item(0).getElementsByTagName("Geometry");
							if (pGeoms == null || pGeoms.length <= 0)
								return;
							var wkt = "";
							for (var cn = 0 ; cn < pGeoms[0].childNodes.length ; cn++)
								wkt += pGeoms[0].childNodes[cn].nodeValue;
							var geometry = sg.geometry.Geometry.fromWKT(wkt);
							
							var content = document.createElement("div");
							for (var j = 0 ; j < pValues.length ; j++)
							{
								var pValue = pValues.item(j);
								if (pValue.nodeType == 1)
								{
									var childcontent = document.createElement("div");
									childcontent.style.width = "100%";
									childcontent.style.height = "30px";
									childcontent.style.float = "left";
									var field = document.createElement("label");
									field.innerHTML = pValue.tagName.replace(/_x([0-9a-fA-F]{4})_/g, "&#x$1;");
									field.innerHTML += " : ";
									field.style.float = "left";
									
									if (pValue.firstChild != null)
										field.innerHTML += pValue.firstChild.nodeValue;
									else
										field.innerHTML += "&nbsp;";
									childcontent.appendChild(field);
									content.appendChild(childcontent);
								}
							}
							pthat.clearResult();
							var e = new sg.Graphic;
							e.geometry = geometry.geometry;
							if (e.geometry instanceof sg.geometry.MultiPolygon || e.geometry instanceof sg.geometry.Polygon || e.geometry instanceof sg.geometry.Extent)
							{
								e.symbol = (new sg.symbols.SimpleFillSymbol).setColor(new sg.Color(128, 128, 255, .5));
								e.symbol.outline.setWidth(3);
							}
							else if (e.geometry instanceof sg.geometry.MultiLineString || e.geometry instanceof sg.geometry.LineString)
							{
								e.symbol = (new sg.symbols.SimpleLineSymbol).setColor(new sg.Color(128, 255, 128, 1));
								e.symbol.setWidth(4);
							}
							else if (e.geometry instanceof sg.geometry.Point || e.geometry instanceof sg.geometry.MultiPoint)
							{
								var symbol = (new sg.symbols.SimpleMarkerSymbol).setSize(16).setOutline(new sg.symbols.SimpleLineSymbol);
								e.symbol = symbol;
							}
							if (pMapBase.drawingGraphicsLayer)
							{
								pMapBase.drawingGraphicsLayer.add(e);
								activeGraphics.push(e);
							}
							pMapBase.RefreshMap(true);
							
							var midpoint;
							if (geometry.geometry instanceof sg.geometry.Polygon || geometry.geometry instanceof sg.geometry.Extent)
							{
								midpoint = geometry.geometry.rings[0].getMidPoint();
								var midpoint_temp = geometry.geometry.getExtent();
								midpoint.x = (midpoint_temp.xmax + midpoint_temp.xmin) / 2;
								midpoint.y = (midpoint_temp.ymax + midpoint_temp.ymin) / 2;
							}
							else if (geometry.geometry instanceof sg.geometry.LineString)
								midpoint = geometry.geometry.getMidPoint();
							else if (geometry.geometry instanceof sg.geometry.Point)
								midpoint = geometry.geometry;
							
							var mousept = new sg.geometry.Point;
							mousept.x = MousePt.X;
							mousept.y = MousePt.Y;
							
							pMapBase.infoWindow.setTitle("Feature attributes");
							pMapBase.infoWindow.setCloseEvent(pthat.clearResult);
							pMapBase.infoWindow.setContent(content);
							pMapBase.infoWindow.resize(300, 240);
							pMapBase.infoWindow.show(mousept);
							findtype = true;
						});
					}
				};
				this.ExitMapEvent = function ()
				{
					pthat.active = false;
					pMapBase.infoWindow.hide();
					pthat.clearResult();
					activeGraphics = [];
					cEvent.remove();
				};
				this.clearResult = function()
				{
					for (var i = 0; i < activeGraphics.length; i++)
						pMapBase.drawingGraphicsLayer.remove(activeGraphics[i]);
				};
				var cEvent = pMapBase.on("click", onClick);
			};
		}
		else
		{
			this.InitMapEvent = function (pMapBase)
			{
				hObj = pMapBase.getHPackage();
				var Values = new Array;
				var ondrag = false;
				var that = this;
				var onstart = function(tEvent)
				{
					that.start = tEvent.point;
				};
				var onmove = function (tEvent)
				{
					ondrag = true;
					tEvent.preventDefault();
				};
				var onClick = function (tEvent)
				{
					if (pMapCont == null || ondrag == true || tEvent.touches.length > 0)
					{
						ondrag = false;
						return;
					}
					if (!that.start || (that.start.x != tEvent.point.x && that.start.y != tEvent.point.y))
					{
						return;
					}
					
					for (var i = 0 ; i < pMapCont.length ; i++)
					{
						var targetLayer = pMapCont[i];
						if (targetLayer.ExecuteQuery == null)
							continue;
						var OffsetPt2 = pMapBase.getCursorPosition(tEvent);
						var MousePt = pMapBase.ToMapPoint(OffsetPt2.X, OffsetPt2.Y);
						var cpt1 = pMapBase.ToMapPoint(OffsetPt2.X - 30, OffsetPt2.Y - 30);
						var cpt2 = pMapBase.ToMapPoint(OffsetPt2.X + 30, OffsetPt2.Y + 30);
						var expr = "RC( " + cpt1.X + " " + cpt1.Y + "," + cpt2.X + " " + cpt2.Y + " )";
						findtype = false;
						targetLayer.ExecuteQuery(expr, true, function(pRequest)
						{
							var pDoc = pRequest.responseXML;
							var pNodes = pDoc.documentElement.getElementsByTagName("Feature");
							if (pNodes.length <= 0 || findtype == true)
								return;
                            var GID = pNodes.item(0).getAttribute("ID");
							var pValues = GetXMLChildNode(pNodes.item(0), "Values").childNodes;
							var pGeoms = pNodes.item(0).getElementsByTagName("Geometry");
							if (pGeoms == null || pGeoms.length <= 0)
								return;
                            
							var wkt = "";
							for (var cn = 0 ; cn < pGeoms[0].childNodes.length ; cn++)
								wkt += pGeoms[0].childNodes[cn].nodeValue;
							var geometry = sg.geometry.Geometry.fromWKT(wkt);
							
							var content = document.createElement("div");
							for (var j = 0 ; j < pValues.length ; j++)
							{
								var pValue = pValues.item(j);
								if (pValue.nodeType == 1)
								{
									var childcontent = document.createElement("div");
									childcontent.style.width = "100%";
									childcontent.style.marginTop = "1%";
									childcontent.style.height = "10%";
									childcontent.style.float = "left";
									var field = document.createElement("label");
									field.innerHTML = pValue.tagName.replace(/_x([0-9a-fA-F]{4})_/g, "&#x$1;");
									field.style.float = "left";
									field.style.marginLeft = "15px";
									field.style.fontSize = "35pt";
									
							        if (field.innerHTML != '照片')
                                    {
                                        var field_text = document.createElement("label");
                                        field_text.style.fontSize = "35pt";
                                        field_text.style.float = "right";
                                        field_text.style.marginRight = "15px";
                                        if (pValue.firstChild != null)
                                            field_text.innerHTML = pValue.firstChild.nodeValue;
                                        else
                                            field_text.innerHTML = "&nbsp;";
                            
                                        childcontent.appendChild(field);
                                        childcontent.appendChild(field_text);
                                        content.appendChild(childcontent);
                                    }
                                    else
                                    {
                                        var field_text = CreateInput(childcontent, "text", i, "");
                                        field_text.style.fontSize = "35pt";
                                        field_text.style.float = "right";
                                        field_text.style.marginRight = "15px";
                                        field_text.style.width = '60%';
                                        field_text.style.display = 'none';

                                        if (pValue.firstChild != null)
                                            field_text.value = pValue.firstChild.nodeValue;
                                        else
                                            field_text.value = "";
                                
                                        var v = field_text.value;
                                        if (v == '')
                                        {
                                            var lab = document.createElement("label");
					                        lab.innerHTML = "無照片.";
					                        lab.style.fontSize = "35pt";
					                        lab.style.float = "right";
					                        lab.style.marginRight = "15px";
                                            childcontent.appendChild(lab);
                                        }
                                        else
                                        {
                                            var vs = v.split(';');
                                            var primg = document.createElement("img");
                                            primg.src = "PhotoUpload/" + GID + "/" + vs[0];
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
					                            tar_title_label.style.fontSize = "35pt";
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
                                            
                                                    var img = document.createElement("img");
                                                    img.style.width = '100%';
                                                    img.style.height = '100%';
                                                    img.src = "PhotoUpload/" + GID + "/" + values[i];
                                                    div.appendChild(img);
                                    
                                                    tar_body.appendChild(div);
                                                }

                                                tar.style.display = 'block';
                                                tar.style.zIndex = '32767';
	                                        }, false);
                                        }
                                    }                                   
									childcontent.appendChild(field);
									content.appendChild(childcontent);
								}
							}
							pthat.clearResult();
							var e = new sg.Graphic;
							e.geometry = geometry.geometry;
							if (e.geometry instanceof sg.geometry.MultiPolygon || e.geometry instanceof sg.geometry.Polygon || e.geometry instanceof sg.geometry.Extent)
							{
								e.symbol = (new sg.symbols.SimpleFillSymbol).setColor(new sg.Color(128, 128, 255, .5));
								e.symbol.outline.setWidth(3);
							}
							else if (e.geometry instanceof sg.geometry.MultiLineString || e.geometry instanceof sg.geometry.LineString)
							{
								e.symbol = (new sg.symbols.SimpleLineSymbol).setColor(new sg.Color(128, 255, 128, 1));
								e.symbol.setWidth(4);
							}
							else if (e.geometry instanceof sg.geometry.Point || e.geometry instanceof sg.geometry.MultiPoint)
							{
								var symbol = (new sg.symbols.SimpleMarkerSymbol).setSize(16).setOutline(new sg.symbols.SimpleLineSymbol);
								e.symbol = symbol;
							}
							if (pMapBase.drawingGraphicsLayer)
							{
								pMapBase.drawingGraphicsLayer.add(e);
								activeGraphics.push(e);
							}
							pMapBase.RefreshMap(true);
							
							var toolpage = FindXMLNodeById(document, "Editmenu");
							
							var mobile_result_title = document.createElement("div");
							mobile_result_title.style.float = "left";
							mobile_result_title.style.width = "100%";
							mobile_result_title.style.height = "10%";
							mobile_result_title.style.overflow = "hide";
							mobile_result_title.style.backgroundColor = "#2F9BDA";
							
							var mobile_result_title_label = document.createElement("label");
							mobile_result_title_label.style.float = "left";
							mobile_result_title_label.style.color = "#FFF";
							mobile_result_title_label.style.fontSize = "40pt";
							mobile_result_title_label.style.marginLeft = "5%";
							mobile_result_title_label.style.marginTop = "2%";
							mobile_result_title.appendChild(mobile_result_title_label);
				
							var mobile_result_body = document.createElement("div");
							mobile_result_body.style.float = "left";
							mobile_result_body.style.width = "100%";
							mobile_result_body.style.height = "90%";
							mobile_result_body.style.overflow = "auto";
							
							//var mobile_result_bottom = document.createElement("div");
							//mobile_result_bottom.style.borderTop = "solid";
							//mobile_result_bottom.style.float = "left";
							//mobile_result_bottom.style.width = "100%";
							//mobile_result_bottom.style.height = "16%";
							
							var resultNode = FindXMLNodeById(document, "mobilebox");
							resultNode.innerHTML = "";
							resultNode.appendChild(mobile_result_title);
							resultNode.appendChild(mobile_result_body);
							//resultNode.appendChild(mobile_result_bottom);
							mobile_result_title_label.innerHTML = "查詢結果";
							mobile_result_body.appendChild(content);
							
                            var bkimg = document.createElement("img");
		                    bkimg.src = "images/right-arrow-of-straight-lines.png";
                            bkimg.style.float = 'right';
                            bkimg.style.height =  '60%';
                            bkimg.style.width =  '10%';
                            bkimg.style.maxHeight = '100%';
                            bkimg.style.maxWidth = '100%';
                            bkimg.style.marginTop = '3%';
                            bkimg.style.marginRight = '5%';
		                    AttachEvent(bkimg, "click", function ()
		                    {
								pMapBase.infoWindow.hide();
                                resultNode.style.display = 'none'; 
								resultNode.innerHTML = "";
								pthat.clearResult();
		                    });
                            mobile_result_title.appendChild(bkimg);
							//var Close_btn = CreateInput(mobile_result_bottom, "button", "Close", "Close");
							//Close_btn.id = "E_Clear";
							//Close_btn.style.float = "left";
							//Close_btn.style.fontSize = "30pt";
							//Close_btn.style.marginTop = "4%";
							//Close_btn.style.marginLeft = "10px";
							//Close_btn.style.backgroundColor = "#FFF";
							//Close_btn.style.border = "1px solid #555555";
							
							//AttachEvent(Close_btn, "click", function ()
							//{
							//	pMapBase.infoWindow.hide();
							//	//resultNode.style.height = "0px";
                            //    resultNode.style.display = 'none';
							//	resultNode.innerHTML = "";
							//	pthat.clearResult();
							//});
							
							var mousept = new sg.geometry.Point;
							mousept.x = MousePt.X;
							mousept.y = MousePt.Y;
							pMapBase.infoWindow.setTitle("Feature attributes");
							pMapBase.infoWindow.setContent("...................");
							pMapBase.infoWindow.resize(80, 50);
							pMapBase.infoWindow.show(mousept);
                            resultNode.style.display = 'block';
							//resultNode.style.height = "50%";
							resultNode.style.zIndex = "32767";
							findtype = true;
						});
					}
				};
				this.ExitMapEvent = function ()
				{
					pthat.active = false;
					pMapBase.infoWindow.hide();
					pthat.clearResult();
					activeGraphics = [];
					aEvemt.remove();
					bEvent.remove();
					cEvent.remove();
				};
				this.clearResult = function()
				{
					for (var i = 0; i < activeGraphics.length; i++)
						pMapBase.drawingGraphicsLayer.remove(activeGraphics[i]);
				};
				var aEvemt = pMapBase.on("touchstart", onstart)
				var bEvent = pMapBase.on("touchmove", onmove);
				var cEvent = pMapBase.on("touchend", onClick);
			};
		}
	};
})();
