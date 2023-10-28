function MercatorProjection(centralMeridian, falseEasting, falseNorthing, scaleFactor)
{
	this.centralMeridian = centralMeridian;
	this.falseEasting = falseEasting;
	this.falseNorthing = falseNorthing;
	this.scaleFactor = scaleFactor;
	
	this.Forward = function(ellip, pnt)
	{
		var tpt = CPoint3((pnt.X-centralMeridian)*Math.PI/180, pnt.Y*Math.PI/180, pnt.Z);
		if (ellip.es == 0)
			pnt = SpheroidForward(ellip, tpt);
		else
			pnt = EllipseForward(ellip, tpt);
		pnt.X = pnt.X*scaleFactor*ellip.SemiMajorAxis + falseEasting;
		pnt.Y = pnt.Y*scaleFactor*ellip.SemiMajorAxis + falseNorthing;
		return pnt;
	};
	this.Inverse = function(ellip, pnt)
	{
		var tpt = CPoint3((pnt.X-falseEasting)/ellip.SemiMajorAxis/scaleFactor, (pnt.Y-falseNorthing)/ellip.SemiMajorAxis/scaleFactor, pnt.Z);
		if (ellip.es == 0)
			pnt = SpheroidInverse(ellip, tpt);
		else
			pnt = EllipseInverse(ellip, tpt);
		pnt.X = pnt.X*180/Math.PI+centralMeridian;
		pnt.Y = pnt.Y*180/Math.PI;
		return pnt;
	};
	
	var HALFPI = Math.PI / 2;
	var FORTPI = Math.PI / 4;
	function pj_tsfn(phi, sinphi, e)
	{
		sinphi *= e;
		return (Math.tan (.5 * (HALFPI - phi)) /
		   Math.pow((1. - sinphi) / (1. + sinphi), .5 * e));
	}
	
	function pj_phi2(ts, e)
	{
		var eccnth = .5 * e;
		var Phi = HALFPI - 2. * Math.atan(ts);
		i = 15;
		do {
			var con = e * Math.sin (Phi);
			var dphi = HALFPI - 2. * Math.atan (ts * Math.pow((1. - con) / (1. + con), eccnth)) - Phi;
			Phi += dphi;
		} while ( Math.abs(dphi) > 1.0e-10 && --i);
		return Phi;
	}
	
	function EllipseForward(ellip, pnt)
	{
		if (Math.abs(Math.abs(pnt.Y) - HALFPI) <= 1.e-10) return null;
		var tmx = pnt.X;
		var tmy = -Math.log(pj_tsfn(pnt.Y, Math.sin(pnt.Y), Math.sqrt(ellip.es)));
		return new CPoint3(tmx, tmy, pnt.Z);
	}
	function SpheroidForward(ellip, pnt)
	{
		if (Math.abs(Math.abs(pnt.Y) - HALFPI) <= 1.e-10) return null;
		var tmx = pnt.X;
		var tmy = Math.log(Math.tan(FORTPI + .5 * pnt.Y));
		return new CPoint3(tmx, tmy, pnt.Z);
	}
	function EllipseInverse(ellip, pnt)
	{
		var lat = pj_phi2(Math.exp(- pnt.Y), Math.sqrt(ellip.es));
		//if (lat == HUGE_VAL) return null;
		var lon = pnt.X;
		return new CPoint3(lon, lat, pnt.Z);
	}
	function SpheroidInverse(ellip, pnt)
	{
		var lat = HALFPI - 2. * Math.atan(Math.exp(-pnt.Y));
		var lon = pnt.X;
		return new CPoint3(lon, lat, pnt.Z);
	}
	return this;
}