(function()
{
	var fillAttributes = function(g, value)
	{
		var fields = value.childNodes;
		var flenth = fields.length;
		for (var f = 0 ; f < flenth ; f++)
		{
			var field = fields[f];
			if (field.nodeType != 1)
				continue;
			
			var fieldName = field.nodeName;
			var value = "";
			
			var clength = field.childNodes.length;
			for (var cn = 0 ; cn < clength ; cn++)
				value += field.childNodes[cn].nodeValue;
			
			g.attributes[fieldName] = field.childNodes[0] ? field.childNodes[0].nodeValue : "";
		}
	};
	
	sg.tasks = {};
	var tasks = sg.tasks;
	tasks.FeatureSet = sg.Class.extend(
	{
		initialize:function()
		{
			this.features = [];
		},
		features: null,
		geometryType: null
	});
	tasks.RelationshipQuery = sg.Class.extend({relationName: null, gid: null});
	tasks.Query = sg.Class.extend({where: null, text: null, geometry: null});
	tasks.QueryTask = sg.Class.extend(
	{
		url: null,
		layer: null,
		initialize: function(url, layer, options)
		{
			this.url = url;
			this.layer = layer;
		},
		execute: function(parameters, callback, errBack)
		{
			var that = this;
			var url = this.url + "/Query?layer=" + encodeURIComponent(this.layer);
			if (parameters.where)
				url += "&expr=" + encodeURIComponent(parameters.where);
			if (parameters.text)
				url += "&expr=" + encodeURIComponent('LIKE "%' + parameters.text + '%"');
			if (parameters.geometry)
				url += "&geom=" + encodeURIComponent(parameters.geometry.toWkt());
			var ajax = new AjaxAgent(url + "&rnd=" + parseInt(Math.random() * 99999), false, false);
			
			ajax.SendRequest("", function(xmlhttp)
			{
				var r = xmlhttp.responseXML;
				var features = r.documentElement.getElementsByTagName("Feature");
				
				if (!features || !features.length)
				{
					if (errBack)
						errBack.call(that, new Error("No feature found"));
					that.trigger("error");
					return;
				}
				var featureSet = new tasks.FeatureSet;
				for (var i = 0 ; i < features.length ; i++)
				{
					var feature = features[i];
					var fid = feature.getAttribute("ID");
					var geometry = feature.getElementsByTagName("Geometry");
					var value = feature.getElementsByTagName("Values")[0];
					var wkt = "";
					for (var cn = 0 ; cn < geometry[0].childNodes.length ; cn++)
						wkt += geometry[0].childNodes[cn].nodeValue;
					
					var result = sg.geometry.Geometry.fromWKT(wkt);
					var g = new sg.Graphic;
					g.geometry = result.geometry;
					g.id = fid;
					fillAttributes(g, value);
					featureSet.features.push(g);
				}
				if (callback)
					callback.call(that, featureSet);
				that.trigger("complete", featureSet);
			}, null);
		},
		executeRelationshipQuery: function(query, callback, errBack)
		{
			var that = this;
			var relationName = query.relationName;
			var gid = query.gid;
			
			if (typeof this.url !== "string")
				throw "Not a valid featurelayer url";
			
			var pAgent = new AjaxAgent(this.url + "/QueryRelatedTable", true, true);
			pAgent.SendRequest("Layer=" + escape(this.layer) + "&RelationName=" + relationName + "&GID=" + gid, function(xmlhttp)
			{
				var r = xmlhttp.responseXML;
				var features = r.documentElement.getElementsByTagName("Feature");
				if (!features || !features.length)
				{
					if (errBack)
						errBack.call(that, new Error("No feature found"));
					that.trigger("error");
					return;
				}
				var featureSet = new tasks.FeatureSet;
				for (var i = 0 ; i < features.length ; i++)
				{
					var feature = features[i];
					var fid = feature.getAttribute("ID");
					var geometry = feature.getElementsByTagName("Geometry");
					var value = feature.getElementsByTagName("Values")[0];
					var result;
					if (geometry.length)
					{
						var wkt = "";
						for (var cn = 0 ; cn < geometry[0].childNodes.length ; cn++)
							wkt += geometry[0].childNodes[cn].nodeValue;
						result = sg.geometry.Geometry.fromWKT(wkt);
					}
					var g = new sg.Graphic;
					if (result)
						g.geometry = result.geometry;
					g.id = fid;
					fillAttributes(g, value);
					featureSet.features.push(g);
				}
				if (callback)
					callback.call(that, featureSet);
				
				that.trigger("execute-relationship-query-complete", featureSet);
				that.trigger("complete", featureSet);
			}, null, errBack);
		},
		events:["complete", "error", "execute-relationship-query-complete"]
	});
})();