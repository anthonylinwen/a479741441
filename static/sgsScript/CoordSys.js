function CPoint3(dX, dY, dZ)
{
	this.X = dX;
	this.Y = dY;
	this.Z = dZ;
	return this;
}

CPoint3.prototype.toString = function()
{
	return "(" + this.X + "," + this.Y + "," + this.Z + ")";
};
CPoint3.prototype.Distance = function()
{
	return Math.sqrt(this.X * this.X + this.Y * this.Y + this.Z * this.Z);
};

function GeographicTransform(dx,dy,dz,rx,ry,rz,sf)
{
	
	function RotX(vect, r)
	{
		var sx = Math.sin(r);
		var cx = Math.cos(r);
		return new CPoint3(
			vect.X,
			cx * vect.Y + sx * vect.Z,
			-sx * vect.Y + cx * vect.Z);
	}
	function RotY(vect, r)
	{
		var sy = Math.sin(r);
		var cy = Math.cos(r);
		return new CPoint3(
			cy * vect.X - sy * vect.Z,
			vect.Y,
			sy * vect.X + cy * vect.Z);
	}
	function RotZ(vect, r)
	{
		var sz = Math.sin(r);
		var cz = Math.cos(r);
		return new CPoint3(
			cz * vect.X + sz * vect.Y,
			-sz * vect.X + cz * vect.Y,
			vect.Z);
	}
	this.BursaWolfTransform = function(vect)
	{
/*	
		var x_tmp = (vect.X - dx) / (1+sf);
		var y_tmp = (vect.Y - dy) / (1+sf);
		var z_tmp = (vect.Z - dz) / (1+sf);
		
		return new CPoint3(
			    x_tmp + rz*y_tmp - ry*z_tmp,
			-rz*x_tmp +    y_tmp + rx*z_tmp,
			 ry*x_tmp - rx*y_tmp +    z_tmp);
*/
/*
		return new CPoint3(
			dx+(1+sf)*(    vect.X + rz*vect.Y - ry*vect.Z),
			dy+(1+sf)*(-rz*vect.X +    vect.Y + rx*vect.Z),
			dz+(1+sf)*( ry*vect.X - rx*vect.Y +    vect.Z));
*/
		vect = RotZ(RotY(RotX(vect, rx), ry), rz);
		return new CPoint3(
			dx+(1+sf)*vect.X,
			dy+(1+sf)*vect.Y,
			dz+(1+sf)*vect.Z);
/*
		return new CPoint3(
			dx+(1+sf)*(    vect.X + rz*vect.Y - ry*vect.Z),
			dy+(1+sf)*(-rz*vect.X +    vect.Y + rx*vect.Z),
			dz+(1+sf)*( ry*vect.X - rx*vect.Y +    vect.Z));
*/
	}
	this.MolodenskyBadekasTransform = function(vect)
	{
		return new CPoint3(
			dx+sf*vect.X+(    vect.X + rz*vect.Y - ry*vect.Z),
			dy+sf*vect.Y+(-rz*vect.X +    vect.Y + rx*vect.Z),
			dz+sf*vect.Z+( ry*vect.X - rx*vect.Y +    vect.Z));
	}
	return this;
}

function HorizontalDatum(SemiMajorAxis, Flattening)
{
	this.SemiMajorAxis = SemiMajorAxis;
	this.Flattening = Flattening;
	
	this.SemiMinorAxis = this.SemiMajorAxis*(1-this.Flattening);
	this.es = 1-(1-this.Flattening)*(1-this.Flattening);
	this.et2 = this.es/(1-this.es);
	return this;
}

HorizontalDatum.prototype.CartesianFromGeodetic = function(locat)
{
	if (locat.Y == 90 || locat.Y == -90)
		return new CPoint3(0, 0, ((locat.Y==-90)?-1:1)*this.SemiMajorAxis * (1 - this.es) + locat.Z);

	var lat = locat.Y * Math.PI / 180.0;
	var lon = locat.X * Math.PI / 180.0;

	var Sin_Lat = Math.sin(lat);
	var Cos_Lat = Math.cos(lat);
	var N = this.SemiMajorAxis / Math.sqrt(1 - this.es * Sin_Lat * Sin_Lat);
	var dX = (N + locat.Z) * Cos_Lat * Math.cos(lon);
	var dY = (N + locat.Z) * Cos_Lat * Math.sin(lon);
	var dZ = ((1 - this.es) * N + locat.Z) * Sin_Lat;
	return new CPoint3(dX, dY, dZ);
};

HorizontalDatum.prototype.GeodeticFromCartesian = function(locat)
{
	if (locat.X == 0.0 && locat.Y == 0.0)
		return new CPoint3(0.0, (locat.Z>=0.0)?90:-90, Math.abs(locat.Z)-this.SemiMinorAxis);
		
	var AD_C = 1.0026000;
	var COS_67P5 = 0.38268343236508977;

	var W2 = locat.X*locat.X + locat.Y*locat.Y;
	var W = Math.sqrt(W2);
	var T0 = locat.Z * AD_C;
	var S0 = Math.sqrt(T0 * T0 + W2);
	var Sin_B0 = T0 / S0;
	var Cos_B0 = W / S0;
	var Sin3_B0 = Sin_B0 * Sin_B0 * Sin_B0;
	var T1 = locat.Z + this.SemiMinorAxis * this.et2 * Sin3_B0;
	var Sum = W - this.SemiMajorAxis * this.es * Cos_B0 * Cos_B0 * Cos_B0;
	var S1 = Math.sqrt(T1*T1 + Sum * Sum);
	var Sin_p1 = T1 / S1;
	var Cos_p1 = Sum / S1;
	var Rn = this.SemiMajorAxis / Math.sqrt(1.0 - this.es * Sin_p1 * Sin_p1);
	
	var dZ=0;
	if (Cos_p1 >= COS_67P5)
		dZ = W / Cos_p1 - Rn;
	else if (Cos_p1 <= -COS_67P5)
		dZ = W / -Cos_p1 - Rn;
	else
		dZ = locat.Z / Sin_p1 - Rn * (1.0 - this.es);
	
	var dY = Math.atan(Sin_p1 / Cos_p1) * 180 / Math.PI;
	var dX=((locat.X!=0.0)?Math.atan2(locat.Y,locat.X)*180/Math.PI:((locat.Y > 0)?90:-90));
	return new CPoint3(dX, dY, dZ);
};

function TransverseMercatorProjection(centralMeridian, falseEasting, falseNorthing, latitudeOfOrigin, scaleFactor)
{
	this.centralMeridian = centralMeridian;
	this.falseEasting = falseEasting;
	this.falseNorthing = falseNorthing;
	this.latitudeOfOrigin = latitudeOfOrigin;
	this.scaleFactor = scaleFactor;
	
	this.Forward = function(ellip, pnt)
	{
		pnt = EllipseForward(ellip, CPoint3((pnt.X-centralMeridian)*Math.PI/180, pnt.Y*Math.PI/180, pnt.Z));
		pnt.X = pnt.X*scaleFactor*ellip.SemiMajorAxis + falseEasting;
		pnt.Y = pnt.Y*scaleFactor*ellip.SemiMajorAxis + falseNorthing;
		return pnt;
	}
	this.Inverse = function(ellip, pnt)
	{
		pnt = EllipseInverse(ellip, CPoint3((pnt.X-falseEasting)/ellip.SemiMajorAxis/scaleFactor, (pnt.Y-falseNorthing)/ellip.SemiMajorAxis/scaleFactor, pnt.Z));
		pnt.X = pnt.X*180/Math.PI+centralMeridian;
		pnt.Y = pnt.Y*180/Math.PI;
		return pnt;
	}

	function pj_mlfn(phi, sphi, cphi, es) 
	{
		var tt;
		var en0 = 1 - es * (.25 + es * (.046875 + es * (.01953125 + es * .01068115234375)));
		var en1 = es * (.75 - es * (.046875 + es * (.01953125 + es * .01068115234375)));
		var en2 = (tt = es * es) * (.46875 - es * (.01302083333333333333 + es * .00712076822916666666));
		var en3 = (tt *= es) * (.36458333333333333333 - es * .00569661458333333333);
		var en4 = tt * es * .3076171875;
		
		cphi *= sphi;
		sphi *= sphi;
		return(en0 * phi - cphi * (en1 + sphi*(en2 + sphi*(en3 + sphi*en4))));
	}
	
	function pj_inv_mlfn(arg, es) 
	{
		var k = 1./(1.-es);
		var phi = arg;
		
		var i;
		for (i = 10; i ; --i) 
		{ /* rarely goes over 2 iterations */
			var s = Math.sin(phi);
			var t = 1. - es * s * s;
			phi -= t = (pj_mlfn(phi, s, Math.cos(phi), es) - arg) * (t * Math.sqrt(t)) * k;
			if (Math.abs(t) < 1e-11)
				return phi;
		}
		return phi;
	}

	function EllipseForward(ellip, pnt)
	{
		var sinphi = Math.sin(pnt.Y); 
		var cosphi = Math.cos(pnt.Y);
		var t = Math.abs(cosphi) > 1e-10 ? sinphi/cosphi : 0.;
		t *= t;
		var al = cosphi * pnt.X;
		var als = al * al;
		al /= Math.sqrt(1. - ellip.es * sinphi * sinphi);
		var n = ellip.et2 * cosphi * cosphi;
		var tmx = al * (1 +
			als / 6 * (1. - t + n +
			als / 20 * (5. + t * (t - 18.) + n * (14. - 58. * t)
			+ als / 42 * (61. + t * ( t * (179. - t) - 479. ) )
			)));

		var lat0 = latitudeOfOrigin*Math.PI/180;
		var ml0 = pj_mlfn(lat0, Math.sin(lat0), Math.cos(lat0), ellip.es);
		
		var tmy = pj_mlfn(pnt.Y, sinphi, cosphi, ellip.es) - ml0 +
			sinphi * al * pnt.X / 2 * ( 1. +
			als / 12 * (5. - t + n * (9. + 4. * n) +
			als / 30 * (61. + t * (t - 58.) + n * (270. - 330 * t)
			+ als / 56 * (1385. + t * ( t * (543. - t) - 3111.) )
			)));

		return new CPoint3(tmx, tmy, pnt.Z);
	}

	function EllipseInverse(ellip, pnt)
	{
		var lat0 = latitudeOfOrigin*Math.PI/180;
		var ml0 = pj_mlfn(lat0, Math.sin(lat0), Math.cos(lat0), ellip.es);
		var lat = pj_inv_mlfn(ml0 + pnt.Y, ellip.es);
		
		var HALFPI = Math.PI / 2;
		if (Math.abs(lat) >= HALFPI)
			return new CPoint3(0, (pnt.Y < 0. ? -HALFPI : HALFPI), pnt.Z);
			
		var sinphi = Math.sin(lat);
		var cosphi = Math.cos(lat);
		var t = Math.abs(cosphi) > 1e-10 ? sinphi/cosphi : 0.;
		var n = ellip.et2 * cosphi * cosphi;
		var con = 1. - ellip.es * sinphi * sinphi
		var d = pnt.X * Math.sqrt(con);
		con *= t;
		t *= t;
		var ds = d * d;
		lat -= (con * ds / (1.-ellip.es)) / 2 * (1. -
			ds / 12 * (5. + t * (3. - 9. *  n) + n * (1. - 4 * n) -
			ds / 30 * (61. + t * (90. - 252. * n +
				45. * t) + 46. * n
		   - ds / 56 * (1385. + t * (3633. + t * (4095. + 1574. * t)) )
			)));
		var lon = d*(1 -
			ds / 6 * ( 1. + 2.*t + n -
			ds / 20 * (5. + t*(28. + 24.*t + 8.*n) + 6.*n
		   - ds /42 * (61. + t * (662. + t * (1320. + 720. * t)) )
			))) / cosphi;
			
		return new CPoint3(lon, lat, pnt.Z);
	}
/*	
	function M(phi, es)
	{
		if (phi == 0.0)
			return 0.0;
		else {
			return (1.0 - es / 4.0 - 3.0 * es * es / 64.0 - 5.0 * es * es * es / 256.0) * phi -
				(3.0 * es / 8.0 + 3.0 * es * es / 32.0 + 45.0 * es * es * es / 1024.0) * Math.sin(2.0 * phi) +
				(15.0 * es * es / 256.0 + 45.0 * es * es * es / 1024.0) * Math.sin(4.0 * phi) -
				(35.0 * es * es * es / 3072.0) * Math.sin(6.0 * phi);
		}
	}
	
	function SphereForward(ellip, pnt)
	{
		var cosphi = Math.cos(pnt.Y);
		var b = cosphi * Math.sin(pnt.X);
		if (Math.abs(Math.abs(b) - 1.) <= 1.e-10) return null;
		var lat0 = latitudeOfOrigin*Math.PI/180;
		
		var tmx = Math.log((1. + b) / (1. - b)) * .5;
		var tmy = cosphi * Math.cos(pnt.X) / Math.sqrt(1. - b * b);
		b = Math.abs(tmy);
		if (b < 1.) tmy = Math.acos(tmy);
		else if ((b - 1.) < 1.e-10) tmy = 0;
		else return null;

		if (pnt.Y < 0.) tmy = -tmy;
		tmy = tmy - lat0;
		
		return new CPoint3(tmx, tmy, pnt.Z);
	}

	function EllipseForward(ellip, pnt)
	{
		var lat0 = latitudeOfOrigin*Math.PI/180;
		var es = ellip.es;
		var et2 = ellip.et2;
		var m0 = M(lat0, es);
		var m = M(pnt.Y, es);
		var n = 1 / Math.sqrt(1 - es * Math.pow(Math.sin(pnt.Y), 2.0));
		var t = Math.tan(pnt.Y);
		t *= t;
		var c = Math.cos(pnt.Y);
		c = et2 * c * c;
		var A = pnt.X * Math.cos(pnt.Y);

		var tmx = n * 
			(A + (1.0 - t + c) * A * A * A / 6.0 
				+ (5.0 - 18.0 * t + t * t + 72.0 * c - 58.0 * et2) * Math.pow(A, 5.0) / 120.0);
		var tmy = m - m0 + n * Math.tan(pnt.Y) * 
			(A * A / 2.0
				+ (5.0 - t + 9.0 * c + 4 * c * c) * Math.pow(A, 4.0) / 24.0
				+ (61.0 - 58.0 * t + t * t + 600.0 * c - 330.0 * et2) * Math.pow(A, 6.0) / 720.0);
		return new CPoint3(tmx, tmy, pnt.Z);
	}

	function SphereInverse(ellip, pnt)
	{
		var lat0 = latitudeOfOrigin*Math.PI/180;
		
		var h = Math.exp(pnt.X);
		var g = .5 * (h - 1. / h);
		h = Math.cos(lat0 + pnt.Y);
		var lat = Math.asin(Math.sqrt((1. - h * h) / (1. + g * g)));
		if (pnt.Y < 0.) lat = -lat;
		var lon = (g || h) ? Math.atan2(g, h) : 0.;
		
		return new CPoint3(lon, lat, pnt.Z);
	}
	
	function EllipseInverse2(ellip, pnt)
	{
		var lat0 = latitudeOfOrigin*Math.PI/180;
		
		var es = ellip.es;
		var et2 = ellip.et2;
	
		var e1 = (1.0 - Math.sqrt(1.0 - es)) / (1.0 + Math.sqrt(1.0 - es));
		var mu1 = (3.0 * e1 / 2.0 - 27.0 * Math.pow(e1, 3.0) / 32.0);
		var mu2 = (21.0 * e1 * e1 / 16.0 - 55.0 * Math.pow(e1, 4.0) / 32.0);
		var mu3 = 151.0 * Math.pow(e1, 3.0) / 96.0;
		var mu4 = 1097.0 * Math.pow(e1, 4.0) / 512.0;
		
		var l = 1/ (1.0 - es / 4.0 - 3.0 * es * es / 64.0 - 5.0 * es * es * es / 256.0);
		var m0 = M(lat0, es);
		var m = m0 + pnt.Y;
		var mu = m * l;
		var phi1 = mu + mu1 * Math.sin(2.0 * mu)
				+ mu2 * Math.sin(4.0 * mu) 
				+ mu3 * Math.sin(6.0 * mu)
				+ mu4 * Math.sin(8.0 * mu);

		var c1 = et2 * Math.pow(Math.cos(phi1), 2.0);
		var t1 = Math.pow(Math.tan(phi1), 2.0);
		var n1 = 1 / Math.sqrt(1 - es * Math.pow(Math.sin(phi1), 2.0));
		var r1 = (1.0 - es) / Math.pow(1.0 - es * Math.pow(Math.sin(phi1), 2.0), 1.5);
		var d = pnt.X / n1;

		var lat = (phi1 - n1 * Math.tan(phi1) / r1
				* (d * d / 2.0 - (5.0 + 3.0 * t1 + 10.0 * c1 - 4.0 * c1 * c1 - 9.0 * et2)
				* Math.pow(d, 4.0) / 24.0 + (61.0 + 90.0 * t1 + 298.0 * c1 + 45.0 * t1 * t1
				- 252.0 * et2 - 3.0 * c1 * c1) * Math.pow(d, 6.0) / 720.0));
		var lon = (d - (1.0 + 2.0 * t1 + c1) * Math.pow(d, 3.0) / 6.0
				+ (5.0 -2.0 * c1 + 28.0 * t1 - 3.0 * c1 * c1 + 8.0 * et2 + 24.0 * t1 * t1)
				* Math.pow(d, 5.0) / 120.0) / Math.cos(phi1);
		return new CPoint3(lon, lat, pnt.Z);
	}
*/

	return this;
}

function CoordinateTransform(sourceCoord, sourceProj, destCoord, destProj, gTrans, locate)
{
	var srcLocat = locate;
	if (sourceProj)
		srcLocat = sourceProj.Inverse(sourceCoord, srcLocat);
	if (sourceCoord && destCoord && sourceCoord != destCoord)
	{
		srcLocat = sourceCoord.CartesianFromGeodetic(srcLocat);	
		if (gTrans)
			srcLocat = gTrans.BursaWolfTransform(srcLocat);
		srcLocat = destCoord.GeodeticFromCartesian(srcLocat);
	}
	if (destProj)
		srcLocat = destProj.Forward(destCoord, srcLocat);
	return srcLocat;
}