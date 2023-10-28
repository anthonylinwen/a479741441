function DragTracker(pEventElement, pDragElement)
{
	this.MoveEvent = null;
	this.DropEvent = null;
	var pThis = this;
	var pMouseMove = function(tEvent)
	{
		var ox = tEvent.screenX - MouseCurX;
		var oy = tEvent.screenY - MouseCurY;
		
		MouseCurX = tEvent.screenX;
		MouseCurY = tEvent.screenY;
		
		CurX = CurX + ox;
		CurY = CurY + oy;
		pDragElement.style.left = ((CurX<0)?0:CurX) + "px";
		pDragElement.style.top = ((CurY<0)?0:CurY) + "px";
		if (pThis.MoveEvent)
			pThis.MoveEvent.call(pThis);
	};
	
	var pMouseUp = function(tEvent)
	{
		if (pThis.DropEvent)
			pThis.DropEvent.call(pThis);
		DetachEvent(pEventElement.ownerDocument.body, "mousemove", pMouseMove, true);
		DetachEvent(pEventElement.ownerDocument.body, "mouseup", pMouseUp, false);
	};
		
	var pMouseDown = function(tEvent)
	{
		if (pDragElement.style.left == "") pDragElement.style.left = pDragElement.offsetLeft + "px";
		if (pDragElement.style.top == "") pDragElement.style.top = pDragElement.offsetTop + "px";
		MouseCurX = tEvent.screenX;
		MouseCurY = tEvent.screenY;
		CurX = parseInt(pDragElement.style.left);
		CurY = parseInt(pDragElement.style.top);
		AttachEvent(pEventElement.ownerDocument.body, "mousemove", pMouseMove, true);
		AttachEvent(pEventElement.ownerDocument.body, "mouseup", pMouseUp, false);
	};
	PreventDefault(pEventElement,'mousedown');
	AttachEvent(pEventElement, "mousedown", pMouseDown, false);
	
	this.FinalRelease = function()
	{
		DetachEvent(pEventElement, "mousedown", pMouseDown, false);
	};
}

function RectangleTracker(pMapBase, tEvent, pEndFunc)
{
	var hObj = pMapBase.getHObject();
	var CursorPos = pMapBase.getCursorPosition(tEvent);
	var MouseDownX = CursorPos.X;
	var MouseDownY = CursorPos.Y;
	var m_hObj;
	m_hObj = hObj.ownerDocument.createElement("div");
	hObj.appendChild(m_hObj);
	m_hObj.style.position = "absolute";
	m_hObj.style.overflow = "hidden";
	m_hObj.style.left = MouseDownX + "px";
	m_hObj.style.top = MouseDownY + "px";
	m_hObj.style.width = "0px";
	m_hObj.style.height = "0px";
	m_hObj.style.border = "inset 2px red";
	
	var pMouseMove = function(tEvent)
	{
		var CursorPos = pMapBase.getCursorPosition(tEvent);
		var ox = CursorPos.X - MouseDownX;
		var oy = CursorPos.Y - MouseDownY;
		
		m_hObj.style.left = (MouseDownX + (ox<0?ox:0)) + "px";
		m_hObj.style.width = Math.max(Math.abs(ox),1) + "px";
		
		m_hObj.style.top = (MouseDownY + (oy<0?oy:0)) + "px";
		m_hObj.style.height = Math.max(Math.abs(oy),1) + "px";
	};
	
	var pMouseUp = function(tEvent)
	{
		DetachEvent(hObj, "mousemove", pMouseMove, true);
		DetachEvent(hObj, "mouseup", pMouseUp, true);

		hObj.removeChild(m_hObj);
		m_hObj = null;
		
		var CursorPos = pMapBase.getCursorPosition(tEvent);
		if (MouseDownX == CursorPos.X || MouseDownY == CursorPos.Y)
			return;
		var cpt1 = pMapBase.ToMapPoint(Math.min(MouseDownX, CursorPos.X), Math.min(MouseDownY, CursorPos.Y));
		var cpt2 = pMapBase.ToMapPoint(Math.max(MouseDownX, CursorPos.X), Math.max(MouseDownY, CursorPos.Y));
		if (pEndFunc)
			pEndFunc(cpt1.X, cpt1.Y, cpt2.X, cpt2.Y);
	};
	
	//hObj.ownerDocument.body.onselectstart = function() {event.returnValue = false; return false;};
	AttachEvent(hObj, "mouseup", pMouseUp, true);
	AttachEvent(hObj, "mousemove", pMouseMove, true);
}

function LineTracker(pMapBase, tEvent, pEndFunc)
{
	var m_pGeom = null;
	
	var hObj = pMapBase.getHObject().ownerDocument.body;
	var pMouseMove = null;
	var pThis = this;

	pMouseMove = function(tEvent)
	{
		var CursorPos = pMapBase.getCursorPosition(tEvent);
		var pt = pMapBase.ToMapPoint(CursorPos.X, CursorPos.Y);
		
		m_pGeom.MovePoint(-1, pt);
		m_pGeom.RebuildElement();
	};
	
	var pMouseUp = function() 
	{
		if (pEndFunc)
			pEndFunc(tEvent);
		pThis.Terminate();
	};

	var pMouseDown = function(tEvent) 
	{
		var CursorPos = pMapBase.getCursorPosition(tEvent);
		var pt = pMapBase.ToMapPoint(CursorPos.X, CursorPos.Y);
		if (m_pGeom == null)
		{
			m_pGeom = new Polyline(pMapBase);
			m_pGeom.AddPoint(pt);
			AttachEvent(hObj, "mouseup", pMouseUp, false);
			if (pMouseMove)
				AttachEvent(hObj, "mousemove", pMouseMove, false);
		}
		m_pGeom.AddPoint(new MapPoint(pt.X, pt.Y));
		m_pGeom.UpdateElement();
	};
	
	this.getGeometry = function() {return m_pGeom;};
		
	this.Terminate = function() 
	{
		if (pMouseMove)
			DetachEvent(hObj, "mousemove", pMouseMove, false);
		DetachEvent(hObj, "mouseup", pMouseUp, false);
		DetachEvent(hObj, "mousedown", pMouseDown, true);
		m_pGeom.Destroy();
		m_pGeom = null;
	};
		
	pMouseDown(tEvent);
	PreventDefault(hObj, "mousedown");
	AttachEvent(hObj, "mousedown", pMouseDown,true);
}

function LineStringTracker(pMapBase, tEvent, pEndFunc, pMoveFunc)
{
	var m_pGeom = null;
	
	var hObj = pMapBase.getHPackage();

	var pMouseMove = null;
	var pThis = this;
	
	var pDblClick = function(tEvent)
	{
		if (pEndFunc)
			pEndFunc(tEvent);
		pThis.Terminate();
	};

	pMouseMove = function(tEvent)
	{
		var CursorPos = pMapBase.getCursorPosition(tEvent);
		var pt = pMapBase.ToMapPoint(CursorPos.X, CursorPos.Y);
		m_pGeom.MovePoint(-1, pt);
		m_pGeom.RebuildElement();
		
		if (pMoveFunc)
			pMoveFunc(tEvent);
	};

	var pMouseDown = function(tEvent) 
	{
		var CursorPos = pMapBase.getCursorPosition(tEvent);
		var pt = pMapBase.ToMapPoint(CursorPos.X, CursorPos.Y);
		if (m_pGeom == null)
		{
			m_pGeom = new Polyline(pMapBase);
			m_pGeom.AddPoint(pt);
			AttachEvent(hObj, "dblclick", pDblClick, false);
			if (pMouseMove)
				AttachEvent(hObj, "mousemove", pMouseMove, false);
		}
		m_pGeom.AddPoint(new MapPoint(pt.X, pt.Y));
		m_pGeom.UpdateElement();
	}
	
	this.getGeometry = function() {return m_pGeom;};
		
	this.Terminate = function() 
	{
		if (pMouseMove)
			DetachEvent(hObj, "mousemove", pMouseMove, false);
		DetachEvent(hObj, "dblclick", pDblClick, false);
		DetachEvent(hObj, "mousedown", pMouseDown, false);
		m_pGeom.Destroy();
		m_pGeom = null;
	};
	
	pMouseDown(tEvent);
	PreventDefault(hObj, "mousedown");
	AttachEvent(hObj, "mousedown", pMouseDown,false);
}

function PolygonTracker(pMapBase, tEvent, pEndFunc, pMoveFunc)
{
	var m_pGeom = null;
	
	var hObj = pMapBase.getHPackage();

	var pMouseMove = null;
	var pThis = this;
	
	var pDblClick = function(tEvent)
	{
		if (pEndFunc)
			pEndFunc(tEvent);
		pThis.Terminate();
	};

	pMouseMove = function(tEvent)
	{
		var CursorPos = pMapBase.getCursorPosition(tEvent);
		var pt = pMapBase.ToMapPoint(CursorPos.X, CursorPos.Y);
		var pts = m_pGeom.getPoints();
		pts[0][pts[0].length - 1] = pt;
		m_pGeom.RebuildElement();
		
		if (pMoveFunc)
			pMoveFunc(tEvent)
	};

	var pMouseDown = function(tEvent) 
	{
		var CursorPos = pMapBase.getCursorPosition(tEvent);
		var pt = pMapBase.ToMapPoint(CursorPos.X, CursorPos.Y);
		if (m_pGeom == null)
		{
			m_pGeom = new Polygon(pMapBase);
			m_pGeom.AddPoint(0, pt);
			AttachEvent(hObj, "dblclick", pDblClick, false);
			if (pMouseMove)
				AttachEvent(hObj, "mousemove", pMouseMove, false);
		}
		m_pGeom.AddPoint(0, new MapPoint(pt.X, pt.Y));
		m_pGeom.UpdateElement();
	};
	
	this.getGeometry = function() {return m_pGeom;};
		
	this.Terminate = function() 
	{
		if (pMouseMove)
			DetachEvent(hObj, "mousemove", pMouseMove, false);
		DetachEvent(hObj, "dblclick", pDblClick, false);
		DetachEvent(hObj, "mousedown", pMouseDown, false);
		m_pGeom.Destroy();
		m_pGeom = null;
	};
	
	pMouseDown(tEvent);
	PreventDefault(hObj, "mousedown");
	AttachEvent(hObj, "mousedown", pMouseDown,false);
}