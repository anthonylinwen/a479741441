(function () {
    sg.OperationBase = sg.Class.extend({
        label: null,
        type: null,
        initialize: function (params) {
            if (typeof (params.label) == "string")
                this.label = params.label;
            if (typeof (params.type) == "string")
                this.type == params.type
        },
        performRedo: function () {
        },
        performUndo: function () {
        }
    });
})();