sg.fx = sg.fx || function()
{
	var fx = {};
	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	window.requestAnimationFrame = requestAnimationFrame;
	var cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;
	window.cancelAnimationFrame = cancelAnimationFrame;
	fx.easing = {
		linear: function(t)
		{
			return t;
		},
		quadIn: function(t)
		{
			return t * t;
		},
		quadOut: function(t)
		{
			return t * (2 - t);
		},
		quadInOut: function(t)
		{
			return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
		},
		cubicIn: function(t)
		{
			return t * t * t;
		},
		cubicOut: function(t)
		{
			return --t * t * t + 1;
		},
		cubicInOut: function(t)
		{
			return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
		},
		quartIn: function(t)
		{
			return t * t * t * t;
		},
		quartOut: function(t)
		{
			return 1 - --t * t * t * t;
		},
		quartInOut: function(t)
		{
			return t < .5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
		},
		quintIn: function(t)
		{
			return t * t * t * t * t;
		},
		quintOut: function(t)
		{
			return 1 + --t * t * t * t * t;
		},
		quintInOut: function(t)
		{
			return t < .5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
		}
	};
	fx.createAnimation = function(param)
	{
		var easing = param.easing ? param.easing : fx.easing.linear;
		var duration = typeof param.duration == "number" ? param.duration : 350;
		var onAnimation = typeof param.onAnimation == "function" ? param.onAnimation : null;
		var onEnd = typeof param.onEnd == "function" ? param.onEnd : null;
		var onStart = typeof param.onStart == "function" ? param.onStart : null;
		var type = param.type ? param.type : "setTimeout";
		var repeat = typeof param.repeat == "boolean" ? param.repeat : false;
		var rate = param.rate ? param.rate : 20;
		var delay = param.delay ? param.delay : 0;
		var timerId;
		var start = null;
		var timestamp;
		var stop = false;
		
		var step = function(frametimestamp)
		{
			if (stop)
				return;
			if (start === null)
			{
				if (onStart)
					onStart.call(this);
				start = type == "setTimeout" ? new Date : frametimestamp;
			}
			timestamp = type == "setTimeout" ? new Date : frametimestamp;
			var progress;
			if (type == "setTimeout")
				progress = Math.abs(timestamp.getTime() - start.getTime());
			else
				progress = Math.abs(frametimestamp - start);
			
			percent = easing(progress / duration);
			if (onAnimation)
				onAnimation.call(this, percent);
			if (percent < 1 && progress < duration)
				timerId = type == "setTimeout" ? setTimeout(step, rate) : requestAnimationFrame(step);
			else if (repeat)
			{
				percent = percent % 1;
				start = type == "setTimeout" ? new Date : frametimestamp;
				timerId = type == "setTimeout" ? setTimeout(step, rate) : requestAnimationFrame(step);
			}
			else if (onEnd)
				onEnd.call(this);
		};
		var aniObj = {
			play: function()
			{
				start = null;
				if (type == "setTimeout")
				{
					if (delay)
						setTimeout(step, delay);
					else
						step();
				}
				else if (delay)
				{
					setTimeout(function()
					{
						requestAnimationFrame(step);
					}, delay);
				}
				else
					requestAnimationFrame(step);
			},
			stop: function()
			{
				stop = true;
				if (timerId)
				{
					if (type == "setTimeout")
						clearTimeout(timerId);
					else
						cancelAnimationFrame(timerId);
				}
			}
		};
		return aniObj;
	};
	return fx;
}();