ESTDesigner.connection.Connection = draw2d.Connection.extend({
			init : function(attr) {
				this.name = null;
				this.callback = null;
				this.condition = null;
				this.sourceRef = null;
				this.targetRef = null;
				this.startX = null;
				this.startY = null;
				this.endX = null;
				this.endY = null;
				this.listeners = new draw2d.util.ArrayList();
				this._super($.extend({
							id : ESTDesigner.tool.UUID.create(),
							router : new draw2d.layout.connection.InteractiveManhattanConnectionRouter(),
							outlineStroke : 1,
							outlineColor : "#303030",
							stroke : 2,
							color : "#00a8f0",
							radius : 4,
							targetDecorator : new draw2d.decoration.connection.ArrowDecorator()
						}, attr));
				this.connectionNameLabel = new draw2d.shape.basic.Label();
				this.connectionNameLabel.setText("Connection Name");
				this.connectionNameLabel.setStroke(0);
				var editor = new draw2d.ui.LabelInplaceEditor({
							// called after the value has been set to the LabelFigure
							onCommit : $.proxy(function(value) {
										this.name = value;
									}, this)
						});
				this.connectionNameLabel.installEditor(editor);
				this.add(this.connectionNameLabel,
						new draw2d.layout.locator.ParallelMidpointLocator());
			},
			setLabel : function(name) {
				this.connectionNameLabel.setText(name);
				this.name = name;
			},
			getListener : function(id) {
				for (var i = 0; i < this.listeners.getSize(); i++) {
					var listener = this.listeners.get(i);
					if (listener.getId() === id) {
						return listener;
					}
				}
			},
			deleteListener : function(id) {
				var listener = this.getListener(id);
				this.listeners.remove(listener);
			},
			addListener : function(listener) {
				this.listeners.add(listener);
			},
			setListeners : function(listeners) {
				this.listeners = listeners;
			},
			onContextMenu : function(x, y) {
				$.contextMenu({
							selector : 'body',
							events : {
								hide : function() {
									$.contextMenu('destroy');
								}
							},
							callback : $.proxy(function(key, options) {
										switch (key) {
											case "Properties" :
												this.contextmenuHandler();
												break;
											case "Delete" :
												// without undo/redo support
												// this.getCanvas().remove(this);

												// with undo/redo support
												var cmd = new draw2d.command.CommandDelete(this);
												this.getCanvas().getCommandStack().execute(cmd);
											default :
												break;
										}

									}, this),
							x : x,
							y : y,
							items : {
								"Properties" : {
									name : "属性"
								},
								"sep1" : "---------",
								"Delete" : {
									name : "删除"
								}
							}
						});
			},
			contextmenuHandler : function() {
				;
				if (this.callback != undefined && this.callback != null
						&& typeof this.callback == "function") {
					this.callback();
				}
			},
			getConditionXML : function() {
				var xml = '';
				if (this.condition != null && this.condition != '') {
					xml = '<conditionExpression xsi:type="tFormalExpression"><![CDATA['
							+ this.condition + ']]></conditionExpression>\n';
				}
				return xml;
			},
			getListenersXML : function() {
				var xml = '';
				for (var i = 0; i < this.listeners.getSize(); i++) {
					var listener = this.listeners.get(i);
					xml = xml + listener.toXML();
				}
				return xml;
			},
			getExtensionElementsXML : function() {
				if (this.listeners.getSize() == 0)
					return '';
				var xml = '<extensionElements>\n';
				xml = xml + this.getListenersXML();
				xml = xml + '</extensionElements>\n';
				return xml;
			},
			toXML : function() {
				var sourceId = this.getSource().getParent().id;
				var targetId = this.getTarget().getParent().id;
				var name = this.id;
				var lineName = this.name;
				if (lineName != null && lineName != "")
					name = lineName;
				var xml = '<sequenceFlow id="' + this.id + '" name="' + name + '" sourceRef="'
						+ sourceId + '" targetRef="' + targetId + '">\n';
				xml = xml + this.getConditionXML();
				xml = xml + this.getExtensionElementsXML();
				xml = xml + '</sequenceFlow>\n';
				return xml;
			},
			toBpmnDI : function() {
				var xml = '<bpmndi:BPMNEdge bpmnElement="' + this.getId() + '" id="BPMNEdge_'
						+ this.getId() + '">\n';
				var startX = this.getSource().getAbsoluteX();
				var startY = this.getSource().getAbsoluteY();
				var endX = this.getTarget().getAbsoluteX();
				var endY = this.getTarget().getAbsoluteY();
				xml = xml + '<omgdi:waypoint x="' + startX + '" y="' + startY + '"/>\n';
				xml = xml + '<omgdi:waypoint x="' + endX + '" y="' + endY + '"/>\n';
				xml = xml + '</bpmndi:BPMNEdge>\n';
				return xml;
			}
		});