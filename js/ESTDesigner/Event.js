ESTDesigner.event.BaseEvent = draw2d.shape.basic.Image.extend({
	init : function(attr) {
		this.name = null;
		this._super($.extend({
			id : ESTDesigner.tool.UUID.create(),
			width : 40,
			height : 40,
			resizeable : false
		}, attr));
	},
	toXML : function() {
		return "";
	},
	toBpmnDI : function() {
		var w = this.getWidth();
		var h = this.getHeight();
		var x = this.getAbsoluteX();
		var y = this.getAbsoluteY();
		var xml = '<bpmndi:BPMNShape bpmnElement="' + this.getId()
				+ '" id="BPMNShape_' + this.getId() + '">\n';
		xml = xml + '<omgdc:Bounds height="' + h + '" width="' + w + '" x="'
				+ x + '" y="' + y + '"/>\n';
		xml = xml + '</bpmndi:BPMNShape>\n';
		return xml;
	}
});
ESTDesigner.event.Start = ESTDesigner.event.BaseEvent
		.extend({
			init : function(attr) {
				this.type = "ESTDesigner.event.Start";
				this._super($.extend({
					path : "js/ESTDesigner/icons/type.startevent.none.png"
				}, attr));
				this.createPort("output",
						new draw2d.layout.locator.LeftLocator());
				this.createPort("output",
						new draw2d.layout.locator.RightLocator());
				this.createPort("output",
						new draw2d.layout.locator.BottomLocator());
				this.createPort("output",
						new draw2d.layout.locator.TopLocator());
			},
			toXML : function() {
				var xml = '<startEvent id="'
						+ this.id
						+ '" name="'
						+ (this.name != null ? this.name : this.id)
						+ '" activiti:initiator="_wf_default_v_applicant"></startEvent>\n';
				return xml;
			}
		});

ESTDesigner.event.End = ESTDesigner.event.BaseEvent
		.extend({
			init : function(attr) {
				this.type = "ESTDesigner.event.End";
				this._super($.extend({
					path : "js/ESTDesigner/icons/type.endevent.none.png"
				}, attr));
				this.createPort("input",
						new draw2d.layout.locator.LeftLocator());
				this.createPort("input",
						new draw2d.layout.locator.RightLocator());
				this.createPort("input",
						new draw2d.layout.locator.BottomLocator());
				this
						.createPort("input",
								new draw2d.layout.locator.TopLocator());
			},
			toXML : function() {
				var xml = '<endEvent id="' + this.id + '" name="'
						+ (this.name != null ? this.name : this.id)
						+ '"></endEvent>\n';
				return xml;
			}
		});