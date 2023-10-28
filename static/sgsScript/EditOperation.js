var EditOperation = sg.OperationBase.extend
({
	graphicLayer: null,
	handleGraphics: null,
	type: null,
	initialize: function (graphicLayer , handleGraphics, attribute, GID, beforeGraphics, type)
	{
		this.ID = GID;
		this.type = type;
		this.layer = graphicLayer;
		this.attribute = attribute;
		this.handleGraphics = handleGraphics;
		this.beforeGraphics = beforeGraphics;
	},
	performUndo: function ()
	{
		if (this.type == "Save")
		{
			if (this.beforeGraphics)
			{
				for (var i = 0; i < this.attribute.Inputs.length; i++)
					this.attribute.SetValue(this.attribute.Inputs[i].name, this.attribute.Inputs[i].value);
				this.layer.ExecuteUpdate(this.handleGraphics.id, this.beforeGraphics.geometry.toWkt(), this.attribute.GetValues(), function ()
				{
				}, false);
			}
			else
			{
				this.layer.ExecuteDelete(this.ID, function ()
				{
				}, false);
			}
		}
		else if (this.type == "Delete")
		{
			this.layer.ExecuteUpdate(this.ID, this.handleGraphics.geometry.toWkt(), this.attribute.GetValues(), function ()
			{
			}, false);
		}
	},
	performRedo: function()
	{
		if (this.type == "Save")
		{
			if (this.beforeGraphics)
			{
				for (var i = 0; i < this.attribute.Inputs.length; i++)
					this.attribute.SetValue(this.attribute.Inputs[i].name, this.attribute.Inputs[i].value);
				
				this.layer.ExecuteUpdate(this.handleGraphics.id, this.handleGraphics.geometry.toWkt(), this.attribute.GetValues(), function ()
				{
				}, false);
			}
			else
			{
				this.layer.ExecuteUpdate(this.ID, this.handleGraphics.geometry.toWkt(), this.attribute.GetValues(), function ()
				{
				}, false);
			}
		}
		else if (this.type == "Delete")
		{
			this.layer.ExecuteDelete(this.ID, function ()
			{
			}, false);
		}
	}
});