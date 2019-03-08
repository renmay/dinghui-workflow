var ESTDesigner = {
	init : function() {

	},
	event : {},
	task : {},
	gateway : {},
	connection : {},
	container : {},
	model : {},
	tool : {}
};
var DefaultModelTypeEnum = [

];

ESTDesigner.tool.UUID = {
	create : function() {
		var segment = function() {
			return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
		};
		return (segment() + segment() + segment() + segment() + segment() + segment() + segment() + segment());
	}
};

ESTDesigner.tool.Parser = Class.extend({
	init : function(canvas, xml) {
		this.canvas = canvas;
		this.xml = xml;
		this.descriptor = $(xml);
		this.shapeList = new draw2d.util.ArrayList();
		this.edgeList = new draw2d.util.ArrayList();
		this.taskList = new draw2d.util.ArrayList();
		this.connectionList = new draw2d.util.ArrayList();
		this.eventList = new draw2d.util.ArrayList();
		this.gatewayList = new draw2d.util.ArrayList();
		this.subProcessList = new draw2d.util.ArrayList();
	},
	parse : function() {
		this._parseProcess();
		this._parseShape();
		this._parseEdge();
		this._parseEvent();
		this._parseTask();
		this._parseSubProcess();
		this._parseGateway();
		this._deleteDupDataObject();
		this._drawSubProcess();
		this._drawFigure();
		// 画线操作必须在最后
		this._parseConnection();
		this._drawConnection();
	},
	_drawFigure : function() {
		this._drawEvent();
		this._drawTask();
		this._drawGateway();

	},
	_drawSubProcess : function() {
		for (var i = 0; i < this.subProcessList.getSize(); i++) {
			var subProcess = this.subProcessList.get(i);
			this.canvas.add(subProcess, subProcess.x, subProcess.y);
		}
	},
	_drawTask : function() {
		for (var i = 0; i < this.taskList.getSize(); i++) {
			var task = this.taskList.get(i);
			this.canvas.add(task, task.x, task.y);
		}
	},
	_drawEvent : function() {
		for (var i = 0; i < this.eventList.getSize(); i++) {
			var event = this.eventList.get(i);
			this.canvas.add(event, event.x, event.y);
		}
	},
	_drawGateway : function() {
		for (var i = 0; i < this.gatewayList.getSize(); i++) {
			var gateway = this.gatewayList.get(i);
			this.canvas.add(gateway, gateway.x, gateway.y);
		}
	},
	_drawConnection : function() {
		for (var i = 0; i < this.connectionList.getSize(); i++) {
			var connection = this.connectionList.get(i);
			this.canvas.add(connection);
		}
	},
	_parseProcess : function() {
		var parser = new ESTDesigner.tool.Parser.ProcessParser();
		parser.parseProcess(this.descriptor, this.canvas.process);
	},
	_parseSubProcess : function() {
		var subProcesses = this.descriptor.find('subProcess');
		var parser = new ESTDesigner.tool.Parser.SubProcessParser();
		var subProcessList = this.subProcessList;
		subProcesses.each(function(i) {
					var subProcess = new ESTDesigner.container.SubProcess();
					parser.parseContainer($(this), subProcess);
					subProcessList.add(subProcess);
				});
		for (var i = 0; i < this.subProcessList.getSize(); i++) {
			this._loadFigureLocation(this.subProcessList.get(i));
		}
	},
	_parseShape : function() {
		var shapes = this.descriptor.find('bpmndi\\:BPMNShape');
		var shapeList = this.shapeList;
		shapes.each(function(i) {
					var id = $(this).attr('bpmnElement');
					var x = parseInt($(this).find('omgdc\\:Bounds').attr('x'));
					var y = parseInt($(this).find('omgdc\\:Bounds').attr('y'));
					var w = parseInt($(this).find('omgdc\\:Bounds').attr('width'));
					var h = parseInt($(this).find('omgdc\\:Bounds').attr('height'));
					var shape = new ESTDesigner.tool.Parser.BPMNShape(id, x, y, w, h);
					shapeList.add(shape);
				});
	},
	_parseEdge : function() {
		var edges = this.descriptor.find('bpmndi\\:BPMNEdge');
		var edgeList = this.edgeList;
		edges.each(function(i) {
					var id = $(this).attr('bpmnElement');
					var points = $(this).find('omgdi\\:waypoint');
					var startX = $(points[0]).attr('x');
					var startY = $(points[0]).attr('y');
					var endX = $(points[1]).attr('x');
					var endY = $(points[1]).attr('y');
					var edge = new ESTDesigner.tool.Parser.BPMNEdge(id, startX, startY, endX, endY);
					edgeList.add(edge);
				});
	},
	_parseTask : function() {
		for (var i = 0; i < TASK_PARSER_MAP.length; i++) {
			var map = TASK_PARSER_MAP[i];
			this._addTask(map.tagName, map.parser, map.model);
		}
		for (var i = 0; i < this.taskList.getSize(); i++) {
			this._loadFigureLocation(this.taskList.get(i));
		}
	},
	_addTask : function(tagName, taskParser, model) {
		var tasks = this.descriptor.find(tagName);
		var taskList = this.taskList;
		tasks.each(function(i) {
					var task = eval("new " + model);
					taskParser.parseTask($(this), task);
					// console.dir(task);
					taskList.add(task);
				});
	},
	_parseEvent : function() {
		var startEvent = this.descriptor.find('startEvent');
		var endEvent = this.descriptor.find('endEvent');
		var eventList = this.eventList;
		startEvent.each(function(i) {
					var start = new ESTDesigner.event.Start();
					start.id = $(this).attr('id');
					start.name = $(this).attr('name');
					eventList.add(start);
				});
		endEvent.each(function(i) {
					var end = new ESTDesigner.event.End();
					end.id = $(this).attr('id');
					end.name = $(this).attr('name');
					eventList.add(end);
				});
		for (var i = 0; i < eventList.getSize(); i++) {
			this._loadFigureLocation(eventList.get(i));
		}
	},
	_parseConnection : function() {
		var lines = this.descriptor.find('sequenceFlow');
		var connectionList = this.connectionList;
		var canvas = this.canvas;
		var edgeList = this.edgeList;
		lines.each(function(i) {
					var lid = $(this).attr('id');
					var name = $(this).attr('name');
					var condition = $(this).find('conditionExpression').text();
					var sourceRef = $(this).attr('sourceRef');
					var targetRef = $(this).attr('targetRef');
					var connectionEdge = null;
					for (var i = 0; i < edgeList.getSize(); i++) {
						var edge = edgeList.get(i);
						if (edge.id == lid) {
							connectionEdge = edge;
							break;
						}
					}
					var source = canvas.getFigure(sourceRef);
					var target = canvas.getFigure(targetRef);
					var sPorts = source.getPorts();
					var tPorts = target.getPorts();
					var startPort = null;
					var endPort = null;
					for (var i = 0; i < sPorts.getSize(); i++) {
						var s = sPorts.get(i);
						var x = s.getAbsoluteX();
						var y = s.getAbsoluteY();
						if (x == connectionEdge.startX && y == connectionEdge.startY) {
							startPort = s;
							break;
						}
					}
					for (var i = 0; i < tPorts.getSize(); i++) {
						var t = tPorts.get(i);
						var x = t.getAbsoluteX();
						var y = t.getAbsoluteY();
						if (x == connectionEdge.endX && y == connectionEdge.endY) {
							endPort = t;
							break;
						}
					}
					var connection = canvas.createConnection(startPort, endPort);
					connection.id = lid;
					connection.name = name;
					connection.condition = condition;
					connection.sourceRef = sourceRef;
					connection.targetRef = targetRef;
					connectionList.add(connection);
				});
		// for (var i = 0; i < connectionList.getSize(); i++) {
		// this._loadConnectionLocation(connectionList.get(i));
		// }
	},
	_parseGateway : function() {
		var exclusiveGateway = this.descriptor.find('exclusiveGateway');
		var parallelGateway = this.descriptor.find('parallelGateway');
		var gatewayList = this.gatewayList;
		exclusiveGateway.each(function(i) {
					var gateway = new ESTDesigner.gateway.ParallelGateway();
					var id = $(this).attr('id');
					var name = $(this).attr('name');
					gateway.id = gtwid;
					gateway.name = gtwname;
					gatewayList.add(gateway);
				});
		parallelGateway.each(function(i) {
					var gateway = new ESTDesigner.gateway.ExclusiveGateway();
					var gtwid = $(this).attr('id');
					var gtwname = $(this).attr('name');
					gateway.id = gtwid;
					gateway.name = gtwname;
					gatewayList.add(gateway);
				});
		for (var i = 0; i < gatewayList.getSize(); i++) {
			this._loadFigureLocation(gatewayList.get(i));
		}
	},
	_loadFigureLocation : function(figure) {
		for (var i = 0; i < this.shapeList.getSize(); i++) {
			var shape = this.shapeList.get(i);
			if (shape.id == figure.id) {
				figure.x = shape.x;
				figure.y = shape.y;
				figure.width = shape.width;
				figure.height = shape.height;
				return;
			}
		}
	},
	_loadConnectionLocation : function(connection) {
		for (var i = 0; i < this.edgeList.getSize(); i++) {
			var edge = this.edgeList.get(i);
			if (edge.id == connection.id) {
				connection.startX = edge.startX;
				connection.startY = edge.startY;
				connection.endX = edge.endX;
				connection.endY = edge.endY;
				return;
			}
		}
	},
	_deleteDupDataObject : function(){
		for(var i=0;i<this.subProcessList.getSize();i++){
			var subProcess=this.subProcessList.get(i);
			for(var j=0;j<subProcess.dataObjects.getSize();j++){
				var sbDataObj = subProcess.dataObjects.get(i);
				this.canvas.process.deleteDataObject(sbDataObj.id);
			}
		}
	}
});
ESTDesigner.tool.Parser.BaseParser = Class.extend({
			init : function() {

			},
			_parseListener : function(listeners, listenerType, fieldType) {
				var parsedListeners = new draw2d.util.ArrayList();
				listeners.each(function(i) {
							var listener = eval("new " + listenerType + "()");

							listener.event = $(this).attr('event');
							var expression = $(this).attr('expression');
							var clazz = $(this).attr('class');
							if (expression != null && expression != "") {
								listener.serviceType = 'expression';
								listener.serviceExpression = expression;
							} else if (clazz != null && clazz != "") {
								listener.serviceType = 'javaClass';
								listener.serviceClass = clazz;
							}
							var fields = $(this).find('activiti\\:field');
							fields.each(function(i) {
										var field = eval("new " + fieldType + "()");
										this._parseField($(this), field);
										listener.setField(field);
									});
							parsedListeners.add(listener);
						});
				return parsedListeners;
			},
			_parseField : function(xmlNode, field) {
				field.name = xmlNode.attr('name');
				var string = xmlNode.find('activiti\\:string').text();
				var expression = xmlNode.find('activiti\\:expression').text();
				if (string != null && string != "") {
					field.type = 'string';
					field.value = string;
				} else if (expression != null && expression != "") {
					field.type = 'expression';
					field.value = expression;
				}
			},
			_parseDataObject : function(xmlNode, dataObjectList) {
				var dataObjects = xmlNode.find('dataObject');
				dataObjects.each(function(i) {
							var dataObject = new ESTDesigner.model.DataObject();
							dataObject.id = $(this).attr('id');
							dataObject.name = $(this).attr('name');
							dataObject.type = $(this).attr('itemSubjectRef').split(":")[1];
							dataObject.value = $.trim($(this)
									.find('extensionElements > activiti\\:value').text());
							dataObjectList.add(dataObject);
						});
			}
		});
ESTDesigner.tool.Parser.ProcessParser = ESTDesigner.tool.Parser.BaseParser.extend({
			init : function() {
				this._super();
			},
			parseProcess : function(xmlNode, process) {
				var definitions = this._parseDefinitions(xmlNode);
				var processNode = xmlNode.find('process');
				process.category = definitions.attr('targetNamespace');
				process.id = processNode.attr('id');
				process.name = processNode.attr('name');
				var documentation = $.trim(xmlNode.find('process > documentation').text());
				if (documentation != null && documentation != "")
					process.documentation = documentation;
				var extentsion = xmlNode.find('process > extensionElements');
				if (extentsion != null) {
					var listeners = extentsion.find('activiti\\:executionListener');
					process.setListeners(this._parseListener(listeners,
							"ESTDesigner.model.Listener", "ESTDesigner.model.Field"));
				}
				this._parseDataObject(xmlNode,process.dataObjects);
				
			},
			_parseDefinitions : function(xmlNode) {
				var definitions = null;
				xmlNode.each(function(i) {
							if ("DEFINITIONS" == this.nodeName) {
								definitions = $(this)
								return;
							}
						});
				return definitions;
			}
		});
ESTDesigner.tool.Parser.TaskParser = ESTDesigner.tool.Parser.BaseParser.extend({
			init : function() {
				this._super();
			},
			parseTask : function(xmlNode, task) {
				this._parseTaskGeneralProp(xmlNode, task);
				this._parseTaskMultiInstance(xmlNode, task);
				this._parseExecutionListener(xmlNode, task);
				this._parseCustomizeProp(xmlNode, task);
			},
			_parseCustomizeProp : function(xmlNode, task) {

			},
			_parseExecutionListener : function(xmlNode, task) {
				var executionListeners = xmlNode.find('extensionElements')
						.find('activiti\\:executionListener');
				task.setListeners(this._parseListener(executionListeners,
						"ESTDesigner.model.Listener", "ESTDesigner.model.Field"));
			},
			_parseTaskGeneralProp : function(xmlNode, task) {
				var tid = xmlNode.attr('id');
				var tname = xmlNode.attr('name');
				var async = $(this).attr('activiti:async');
				var exclusive = $(this).attr('activiti:exclusive');
				var documentation = $.trim(xmlNode.find('documentation').text());
				if (documentation != null && documentation != "") {
					task.documentation = documentation;
				}
				task.id = tid;
				task.name = tname;
				if (tid != tname)
					task.setTaskName(tname);
				if (async != null && async != "") {
					task.asynchronous = async;
				}
				if (exclusive != null && exclusive != "") {
					task.exclusive = exclusive;
				}
			},
			_parseTaskMultiInstance : function(xmlNode, task) {
				var multiInstance = xmlNode.find('multiInstanceLoopCharacteristics');
				if (multiInstance != null && multiInstance.length > 0) {
					task.isSequential = true;
					var elementVariable = multiInstance.attr('activiti:elementVariable');
					var collection = multiInstance.attr('activiti:collection');
					var loopCardinality = multiInstance.find('loopCardinality').text();
					var completionCondition = multiInstance.find('completionCondition').text();
					task._elementVariable = elementVariable;
					task._collection = collection;
					task._loopCardinality = loopCardinality;
					task._completionCondition = completionCondition;
				}
			}
		});
ESTDesigner.tool.Parser.UserTaskParser = ESTDesigner.tool.Parser.TaskParser.extend({
			init : function() {
				this._super();
			},
			_parseCustomizeProp : function(xmlNode, task) {
				var _parseUserTaskCandidate = this._parseUserTaskCandidate;
				var dueDate = xmlNode.attr('activiti:dueDate');
				var priority = xmlNode.attr('activiti:priority');
				var formKey = xmlNode.attr('activiti:formKey');
				if (dueDate != null && dueDate != "") {
					task.dueDate = dueDate;
				}
				if (formKey != null && formKey != "") {
					task.formKey = formKey;
				}
				if (priority != null && priority != "") {
					task.priority = priority;
				}
				_parseUserTaskCandidate(xmlNode, task);

				var taskListeners = xmlNode.find('extensionElements')
						.find('activiti\\:taskListener');
				task.setTaskListeners(this._parseListener(taskListeners,
						"ESTDesigner.model.TaskListener", "ESTDesigner.model.Field"));

				this._parseTaskFormProp(xmlNode, task);
				this._parseTaskPerformer(xmlNode, task);
				// console.dir(task);
			},
			_parseUserTaskCandidate : function(xmlNode, task) {
				var candidataUsers = xmlNode.attr('activiti:candidateUsers');
				var candidataGroups = xmlNode.attr('activiti:candidateGroups');
				var assignee = xmlNode.attr('activiti:assignee');
				if (assignee != null && assignee != "") {
					task.isUseExpression = true;
					task.performerType = "assignee";
					task.expression = assignee;
				} else if (candidataUsers != null && candidataUsers != "") {
					task.isUseExpression = true;
					task.performerType = "candidateUsers";
					task.expression = candidataUsers;
				} else if (candidataGroups != null && candidataGroups != "") {
					task.isUseExpression = true;
					task.performerType = "candidateGroups";
					task.expression = candidataGroups;
				}
			},
			_parseTaskPerformer : function(xmlNode, task) {
				var performersExpression = xmlNode.find('potentialOwner')
						.find('resourceAssignmentExpression').find('formalExpression').text();
				if (performersExpression.indexOf('user(') != -1) {
					task.performerType = "candidateUsers";
				} else if (performersExpression.indexOf('group(') != -1) {
					task.performerType = "candidateGroups";
				}
				var performers = performersExpression.split(',');
				$.each(performers, function(i, n) {
							var start = 0;
							var end = n.lastIndexOf(')');
							if (n.indexOf('user(') != -1) {
								start = 'user('.length;
								var performer = n.substring(start, end);
								task.addCandidateUser({
											sso : performer
										});
							} else if (n.indexOf('group(') != -1) {
								start = 'group('.length;
								var performer = n.substring(start, end);
								task.addCandidateGroup(performer);
							}
						});
			},
			_parseTaskFormProp : function(xmlNode, task) {
				var formProperties = xmlNode.find('extensionElements')
						.find('activiti\\:formProperty');
				formProperties.each(function(i) {
							var formProperty = new ESTDesigner.model.FormProperty();
							formProperty.id = $(this).attr('id');
							formProperty.name = $(this).attr('name');
							formProperty.type = $(this).attr('type');
							formProperty.expression = $(this).attr('expression');
							formProperty.variable = $(this).attr('variable');
							formProperty.defaultValue = $(this).attr('default');
							formProperty.datePattern = $(this).attr('datePattern');
							formProperty.readable = $(this).attr('readable');
							formProperty.writeable = $(this).attr('writeable');
							formProperty.required = $(this).attr('required');
							var values = $(this).find('activiti\\:value');
							values.each(function(i) {
										var formValue = new ESTDesigner.model.FormValue();
										formValue.id = $(this).attr('id');
										formValue.name = $(this).attr('name');
										formProperty.addValues(formValue);
									});
							task.addFormProperties(formProperty);
						});
			}
		});
ESTDesigner.tool.Parser.ManualTaskParser = ESTDesigner.tool.Parser.TaskParser.extend({
			init : function() {
				this._super();
			},
			_parseCustomizeProp : function(xmlNode, task) {
			}
		});
ESTDesigner.tool.Parser.ServiceTaskParser = ESTDesigner.tool.Parser.TaskParser.extend({
			init : function() {
				this._super();
			},
			_parseCustomizeProp : function(xmlNode, task) {
				var clazz = xmlNode.attr('activiti:class');
				var expression = xmlNode.attr('activiti:expression');
				var delegateExpression = xmlNode.attr('activiti:delegateExpression');
				if (clazz != null && clazz != '') {
					task._javaClass = clazz;
					task._type = 'javaClass';
				}
				if (expression != null && expression != '') {
					task._expression = expression;
					task._type = 'expression';
				}
				if (delegateExpression != null && delegateExpression != '') {
					task.delegateExpression = delegateExpression;
					task._type = 'delegateExpression';
				}
				var resultVarName = xmlNode.attr('activiti:resultVariableName');
				var fields = xmlNode.find('extensionElements').find('activiti\\:field');

				task.resultVariable = resultVarName;
				fields.each(function(i) {
							var field = new ESTDesigner.model.Field();
							this._parseField($(this), field);
							task.fields.add(field);
						});
			}
		});
ESTDesigner.tool.Parser.ScriptTaskParser = ESTDesigner.tool.Parser.TaskParser.extend({
			init : function() {
				this._super();
			},
			_parseCustomizeProp : function(xmlNode, task) {
				task.scriptLanguage = xmlNode.attr('scriptFormat');
				task.script = xmlNode.find('script').text();
			}
		});
ESTDesigner.tool.Parser.MailTaskParser = ESTDesigner.tool.Parser.TaskParser.extend({
			init : function() {
				this._super();
			},
			_parseCustomizeProp : function(xmlNode, task) {
				var fields = xmlNode.find('extensionElements').find('activiti\\:field');
				fields.each(function(i) {
							var name = $(this).attr('name');
							var val = $(this).find('activiti\\:string').text();
							if (name == 'to') {
								task.to = val;
							}
							if (name == 'from') {
								task.from = val;
							}
							if (name == 'subject') {
								task.subject = val;
							}
							if (name == 'cc') {
								task.cc = val;
							}
							if (name == 'bcc') {
								task.bcc = val;
							}
							if (name == 'charset') {
								task._charset = val;
							}
							if (name == 'charset') {
								task._charset = val;
							}
							if (name == 'text') {
								task._text = val;
							}
						});
			}
		});
ESTDesigner.tool.Parser.ReceiveTaskParser = ESTDesigner.tool.Parser.TaskParser.extend({
			init : function() {
				this._super();
			},
			_parseCustomizeProp : function(xmlNode, task) {
			}
		});
ESTDesigner.tool.Parser.BusinessRuleTaskParser = ESTDesigner.tool.Parser.TaskParser.extend({
			init : function() {
				this._super();
			},
			_parseCustomizeProp : function(xmlNode, task) {
				task.inputVariable = xmlNode.attr('activiti:ruleVariablesInput');
				task.ruleName = xmlNode.attr('activiti:rules');
				task.resultVariable = xmlNode.attr('activiti:resultVariable');
				task.excluded = xmlNode.attr('activiti:exclude');
			}
		});
ESTDesigner.tool.Parser.CallActivityParser = ESTDesigner.tool.Parser.TaskParser.extend({
			init : function() {
				this._super();
			},
			_parseCustomizeProp : function(xmlNode, task) {
				var inParams = xmlNode.find('extensionElements').find('activiti\\:in');
				this._parseInputParams(inParams, task);
				var outParams = xmlNode.find('extensionElements').find('activiti\\:out');
				this._parseOutputParams(outParams, task);
			},
			_parseInputParams : function(xmlNode, task) {
				xmlNode.each(function(i) {
							var param = new ESTDesigner.task.CallActivityTask.Parameter.InputParameter();
							this._parseParam($(this), param);
							task.inputParams.add(param);
						})
			},
			_parseOutputParams : function(xmlNode, task) {
				xmlNode.each(function(i) {
							var param = new ESTDesigner.task.CallActivityTask.Parameter.OutputParameter();
							this._parseParam($(this), param);
							task.outputParams.add(param);
						})
			},
			_parseParam : function(xmlNode, param) {
				param.source = xmlNode.attr('source');
				param.sourceExpression = xmlNode.attr('sourceExpression');
				param.target = xmlNode.attr('target');
			}
		});
ESTDesigner.tool.Parser.BPMNShape = Class.extend({
			init : function(id, x, y, width, height) {
				this.id = id;
				this.x = x;
				this.y = y;
				this.width = width;
				this.height = height;
			}
		});
ESTDesigner.tool.Parser.BPMNEdge = Class.extend({
			init : function(id, startX, startY, endX, endY) {
				this.id = id;
				this.startX = startX;
				this.startY = startY;
				this.endX = endX;
				this.endY = endY;
			}
		});
ESTDesigner.tool.Parser.ContainerParser = ESTDesigner.tool.Parser.BaseParser.extend({
			init : function() {
				this._super();
			},
			parseContainer : function(xmlNode, container) {
				this._parseGeneralProp(xmlNode, container);
				this._parseMultiInstance(xmlNode, container);
				this._parseExecutionListener(xmlNode, container);
				this._parseDataObject(xmlNode, container.dataObjects);
				this._parseCustomizeProp(xmlNode, container);
			},
			_parseCustomizeProp : function(xmlNode, container) {

			},
			_parseExecutionListener : function(xmlNode, container) {
				var executionListeners = xmlNode.find('extensionElements')
						.find('activiti\\:executionListener');
				container.setListeners(this._parseListener(executionListeners,
						"ESTDesigner.model.Listener", "ESTDesigner.model.Field"));
			},
			_parseGeneralProp : function(xmlNode, container) {
				var tid = xmlNode.attr('id');
				var tname = xmlNode.attr('name');
				var async = $(this).attr('activiti:async');
				var exclusive = $(this).attr('activiti:exclusive');
				var documentation = $.trim(xmlNode.find('documentation').text());
				if (documentation != null && documentation != "") {
					container.documentation = documentation;
				}
				container.id = tid;
				container.name = tname;
				if (tid != tname)
					container.setContainerName(tname);
				if (async != null && async != "") {
					container.asynchronous = async;
				}
				if (exclusive != null && exclusive != "") {
					container.exclusive = exclusive;
				}
			},
			_parseMultiInstance : function(xmlNode, container) {
				var multiInstance = xmlNode.find('multiInstanceLoopCharacteristics');
				if (multiInstance != null && multiInstance.length > 0) {
					container.isSequential = true;
					var elementVariable = multiInstance.attr('activiti:elementVariable');
					var collection = multiInstance.attr('activiti:collection');
					var loopCardinality = multiInstance.find('loopCardinality').text();
					var completionCondition = multiInstance.find('completionCondition').text();
					container._elementVariable = elementVariable;
					container._collection = collection;
					container._loopCardinality = loopCardinality;
					container._completionCondition = completionCondition;
				}
			}
		});
ESTDesigner.tool.Parser.SubProcessParser = ESTDesigner.tool.Parser.ContainerParser.extend({
			init : function() {
				this._super();
			}
		});
ESTDesigner.model.BaseModel = Class.extend({
			init : function() {

			}
		});
ESTDesigner.model.Process = ESTDesigner.model.BaseModel.extend({
			init : function() {
				this._super();
				this.id = ESTDesigner.tool.UUID.create();
				this.name = null;
				this.category = null;
				this.documentation = null;
				this.listeners = new draw2d.util.ArrayList();
				this.variables = new draw2d.util.ArrayList();
				this.dataObjects = new draw2d.util.ArrayList();
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
			getVariable : function(id) {
				for (var i = 0; i < this.variables.getSize(); i++) {
					var variable = this.variables.get(i);
					if (variable.id === id) {
						return variable;
					}
				}
			},
			deleteVariable : function(id) {
				var variable = this.getVariable(id);
				this.variables.remove(variable);
			},
			addVariable : function(variable) {
				this.variables.add(variable);
			},
			getVariablesJSONObject : function() {
				return JSON.stringify(this.variables.data);
			},
			getDataObject : function(id) {
				for (var i = 0; i < this.dataObjects.getSize(); i++) {
					var dataObject = this.dataObjects.get(i);
					if (dataObject.id === id) {
						return dataObject;
					}
				}
			},
			deleteDataObject : function(id) {
				var dataObject = this.getDataObject(id);
				this.dataObjects.remove(dataObject);
			},
			addDataObject : function(dataObject) {
				this.dataObjects.add(dataObject);
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
			getDocumentationXML : function() {
				var documentation = $.trim(this.documentation);
				if (documentation == null || documentation == '')
					return '';
				var xml = '<documentation>';
				xml = xml + this.documentation;
				xml = xml + '</documentation>';
				return xml;
			},
			getDataObjectsXML : function() {
				var xml = '';
				for (var i = 0; i < this.dataObjects.getSize(); i++) {
					var dataObject = this.dataObjects.get(i);
					xml = xml + dataObject.toXML();
				}
				return xml;
			}
		});
ESTDesigner.model.Variable = ESTDesigner.model.BaseModel.extend({
			init : function() {
				this.id = ESTDesigner.tool.UUID.create();
				this.name = null;
				this.type = null;
				this.scope = null;
				this.defaultValue = null;
				this.remark = null;
			}
		});
ESTDesigner.model.DataObject = ESTDesigner.model.BaseModel.extend({
			init : function() {
				this.id = ESTDesigner.tool.UUID.create();
				this.name = null;
				this.type = null;
				this.value = null;
			},
			getValueXML : function() {
				var xml = "<activiti:value>" + this.value + "</activiti:value>\n";
				return xml;
			},
			getExtensionElementsXML : function() {
				var xml = '<extensionElements>\n';
				xml = xml + this.getValueXML();
				xml = xml + '</extensionElements>\n';
				return xml;
			},
			toXML : function() {
				var xml = '<dataObject id="' + this.id + '" name="' + this.name
						+ '" itemSubjectRef="';
				if (this.type == 'string') {
					xml = xml + 'xsd:string';
				} else if (this.type == 'double') {
					xml = xml + 'xsd:double';
				} else if (this.type == 'boolean') {
					xml = xml + 'xsd:boolean';
				} else if (this.type == 'long') {
					xml = xml + 'xsd:long';
				} else if (this.type == 'int') {
					xml = xml + 'xsd:int';
				} else if (this.type == 'datetime') {
					xml = xml + 'xsd:datetime';
				}
				xml = xml + '">\n';
				xml = xml + this.getExtensionElementsXML();
				xml = xml + '</dataObject>\n'
				return xml;
			}
		});
// excution listener object
ESTDesigner.model.Listener = ESTDesigner.model.BaseModel.extend({
			init : function() {
				this.id = ESTDesigner.tool.UUID.create();
				this.event = null;
				this.serviceType = null;
				this.serviceClass = null;
				this.serviceExpression = null;
				this.fields = new draw2d.util.ArrayList();
			},
			setId : function(id) {
				this.id = id;
			},
			getId : function() {
				return this.id;
			},
			setField : function(field) {
				this.fields.add(field);
			},
			getField : function(id) {
				for (var i = 0; i < this.fields.getSize(); i++) {
					var field = this.fields.get(i);
					if (field.id == id) {
						return field;
					}
				}
			},
			deleteField : function(id) {
				var field = this.getField(id);
				this.fields.remove(field);
			},
			getServiceImplementation : function() {
				if (this.serviceType == 'javaClass')
					return this.serviceClass;
				else if (this.serviceType == 'expression')
					return this.serviceExpression;
			},
			getFieldsString : function() {
				var f = '';
				var v = '';
				for (var i = 0; i < this.fields.getSize(); i++) {
					var field = this.fields.get(i);
					f = f + field.name + ":" + field.value + ",";
				}
				return f;
			},
			toJSON : function() {
				var json = {
					id : this.id,
					event : this.event,
					serviceType : this.serviceType,
					serviceClass : this.serviceClass,
					serviceExpression : this.serviceExpression,
					fields : this.fields.data
				};
				return JSON.stringify(json);
			},
			parseJSON : function() {
				var jsonString = this.toJSON();
				return JSON._parse(jsonString);
			},
			getFieldsXML : function() {
				var xml = "";
				for (var i = 0; i < this.fields.getSize(); i++) {
					var field = this.fields.get(i);
					xml = xml + field.toXML();
				}
				return xml;
			},
			toXML : function() {
				var xml = '<activiti:executionListener event="' + this.event + '" ';
				if (this.serviceType == 'javaClass') {
					xml = xml + 'class="' + this.serviceClass + '" ';
				} else if (this.serviceType == 'expression') {
					xml = xml + 'expression="' + this.serviceExpression + '" ';
				}
				xml = xml + '>\n';
				xml = xml + this.getFieldsXML();
				xml = xml + '</activiti:executionListener>\n'
				return xml;
			}
		});
/**
 * Process field object
 */
ESTDesigner.model.Field = ESTDesigner.model.BaseModel.extend({
			init : function() {
				this.id = ESTDesigner.tool.UUID.create();
				this.name = null;
				this.type = null;
				this.value = null;
			},
			toJSON : function() {
				var json = {
					id : this.id,
					name : this.name,
					type : this.type,
					value : this.value
				};
				return JSON.stringify(json);
			},
			toXML : function() {
				var xml = '<activiti:field name="' + this.name + '">\n';
				if (this.type == 'string') {
					xml = xml + '<activiti:string>' + this.value + '</activiti:string>\n';
				} else if (this.type = 'expression') {
					xml = xml + '<activiti:expression>' + this.value + '</activiti:expression>\n';
				}
				xml = xml + '</activiti:field>\n';
				return xml
			}
		});
// form porperties object
ESTDesigner.model.FormProperty = ESTDesigner.model.BaseModel.extend({
			init : function() {
				this.id = null;
				this.name = null;
				this.type = null;
				this.expression = null;
				this.variable = null;
				this.defaultValue = null;
				this.datePattern = null;
				this.readable = null;
				this.writeable = null;
				this.required = null;
				this.values = new draw2d.util.ArrayList();
			},
			addValues : function(value) {
				this.values.add(value);
			},
			getPropValuesXML : function() {
				var xml = "";
				for (var i = 0; i < this.values.getSize(); i++) {
					var val = this.values.get(i);
					xml = xml + val.toXML();
				}
				return xml;
			},
			toXML : function() {
				var xml = '<activiti:formProperty id="' + this.id + '" name="' + this.name + '" ';
				if (this.type != null) {
					xml = xml + 'type="' + this.type + '" ';
				}
				if (this.expression != null && this.expression != '') {
					xml = xml + 'expression="' + this.expression + '" ';
				}
				if (this.variable != null && this.variable != '') {
					xml = xml + 'variable="' + this.variable + '" ';
				}
				if (this.defaultValue != null && this.defaultValue != '') {
					xml = xml + 'default="' + this.defaultValue + '" ';
				}
				if (this.datePattern != null && this.datePattern != '') {
					xml = xml + 'datePattern="' + this.datePattern + '" ';
				}
				if (this.readable != null && this.readable != '') {
					xml = xml + 'readable="' + this.readable + '" ';
				}
				if (this.writeable != null && this.writeable != '') {
					xml = xml + 'writeable="' + this.writeable + '" ';
				}
				if (this.required != null && this.required != '') {
					xml = xml + 'required="' + this.required + '" ';
				}
				xml = xml + '>\n';
				xml = xml + this.getPropValuesXML();
				xml = xml + '</activiti:formProperty>\n'
				return xml;
			},
			getFormValue : function(id) {
				for (var i = 0; i < this.values.getSize(); i++) {
					var v = this.values.get(i);
					if (v.id == id) {
						return v;
					}
				}
			},
			deleteFormValue : function(id) {
				var field = this.getFormValue(id);
				this.values.remove(field);
			},
			getValuesString : function() {
				var f = '';
				for (var i = 0; i < this.values.getSize(); i++) {
					var v = this.values.get(i);
					f = f + v.id + ":" + v.name + ",";
				}
				return f;
			}
		});
ESTDesigner.model.FormValue = ESTDesigner.model.BaseModel.extend({
			init : function() {
				this.id = null;
				this.name = null;
			},
			toXML : function() {
				var xml = '<activiti:value id="' + this.id + '" name="' + this.name
						+ '"></activiti:value>\n';
				return xml
			}
		});
/**
 * Task listener object definition
 */
ESTDesigner.model.TaskListener = ESTDesigner.model.Listener.extend({
			init : function() {
				this._super();
			},
			toXML : function() {
				var xml = '<activiti:taskListener event="' + this.event + '" ';
				if (this.serviceType == 'javaClass') {
					xml = xml + 'class="' + this.serviceClass + '" ';
				} else if (this.serviceType == 'expression') {
					xml = xml + 'expression="' + this.serviceExpression + '" ';
				}
				xml = xml + '>\n';
				xml = xml + this.getFieldsXML();
				xml = xml + '</activiti:taskListener>\n'
				return xml;
			}
		});
/**
 * Line listener object definition
 */
ESTDesigner.model.ConnectionListener = ESTDesigner.model.Listener.extend({
			init : function() {
				this._super();
			},
			toXML : function() {
				var xml = '<activiti:executionListener ';
				if (this.serviceType == 'javaClass') {
					xml = xml + 'class="' + this.serviceClass + '" ';
				} else if (this.serviceType == 'expression') {
					xml = xml + 'expression="' + this.serviceExpression + '" ';
				}
				xml = xml + '>\n';
				xml = xml + this.getFieldsXML();
				xml = xml + '</activiti:executionListener>\n'
				return xml;
			}
		});
var TASK_PARSER_MAP = [{
			tagName : 'userTask',
			parser : new ESTDesigner.tool.Parser.UserTaskParser(),
			model : 'ESTDesigner.task.UserTask'
		}, {
			tagName : 'task',
			parser : new ESTDesigner.tool.Parser.ManualTaskParser(),
			model : 'ESTDesigner.task.ManualTask'
		}, {
			tagName : 'serviceTask',
			parser : new ESTDesigner.tool.Parser.ServiceTaskParser(),
			model : 'ESTDesigner.task.ServiceTask'
		}, {
			tagName : 'scriptTask',
			parser : new ESTDesigner.tool.Parser.ScriptTaskParser(),
			model : 'ESTDesigner.task.ScriptTask'
		}, {
			tagName : 'serviceTask',
			parser : new ESTDesigner.tool.Parser.ServiceTaskParser(),
			model : 'ESTDesigner.task.ServiceTask'
		}, {
			tagName : 'receiveTask',
			parser : new ESTDesigner.tool.Parser.ReceiveTaskParser(),
			model : 'ESTDesigner.task.ReceiveTask'
		}, {
			tagName : 'businessRuleTask',
			parser : new ESTDesigner.tool.Parser.BusinessRuleTaskParser(),
			model : 'ESTDesigner.task.BusinessRuleTask'
		}, {
			tagName : 'callActivity',
			parser : new ESTDesigner.tool.Parser.CallActivityParser(),
			model : 'ESTDesigner.task.CallActivityTask'
		}]
function formatXml(text) {
	// 去掉多余的空格
	text = '\n' + text.replace(/(<\w+)(\s.*?>)/g, function($0, name, props) {
				return name + ' ' + props.replace(/\s+(\w+=)/g, " $1");
			}).replace(/>\s*?</g, ">\n<");

	// 把注释编码
	text = text.replace(/\n/g, '\r').replace(/<!--(.+?)-->/g, function($0, text) {
				var ret = '<!--' + escape(text) + '-->';
				// alert(ret);
				return ret;
			}).replace(/\r/g, '\n');

	// 调整格式
	var rgx = /\n(<(([^\?]).+?)(?:\s|\s*?>|\s*?(\/)>)(?:.*?(?:(?:(\/)>)|(?:<(\/)\2>)))?)/mg;
	var nodeStack = [];
	var output = text.replace(rgx, function($0, all, name, isBegin, isCloseFull1, isCloseFull2,
					isFull1, isFull2) {
				var isClosed = (isCloseFull1 == '/') || (isCloseFull2 == '/') || (isFull1 == '/')
						|| (isFull2 == '/');
				// alert([all,isClosed].join('='));
				var prefix = '';
				if (isBegin == '!') {
					prefix = getPrefix(nodeStack.length);
				} else {
					if (isBegin != '/') {
						prefix = getPrefix(nodeStack.length);
						if (!isClosed) {
							nodeStack.push(name);
						}
					} else {
						nodeStack.pop();
						prefix = getPrefix(nodeStack.length);
					}

				}
				var ret = '\n' + prefix + all;
				return ret;
			});

	var prefixSpace = -1;
	var outputText = output.substring(1);

	// 把注释还原并解码，调格式
	outputText = outputText.replace(/\n/g, '\r').replace(/(\s*)<!--(.+?)-->/g,
			function($0, prefix, text) {
				// alert(['[',prefix,']=',prefix.length].join(''));
				if (prefix.charAt(0) == '\r')
					prefix = prefix.substring(1);
				text = unescape(text).replace(/\r/g, '\n');
				var ret = '\n' + prefix + '<!--' + text.replace(/^\s*/mg, prefix) + '-->';
				// alert(ret);
				return ret;
			});

	return outputText.replace(/\s+$/g, '').replace(/\r/g, '\r\n');
}

function getPrefix(prefixIndex) {
	var span = '    ';
	var output = [];
	for (var i = 0; i < prefixIndex; ++i) {
		output.push(span);
	}

	return output.join('');
}
function parseConnection(xmlNode, connectionList, canvas, edgeList) {
	var lines = xmlNode.find('sequenceFlow');
	lines.each(function(i) {
				var lid = $(this).attr('id');
				var name = $(this).attr('name');
				var condition = $(this).find('conditionExpression').text();
				var sourceRef = $(this).attr('sourceRef');
				var targetRef = $(this).attr('targetRef');
				var connectionEdge = null;
				for (var i = 0; i < edgeList.getSize(); i++) {
					var edge = edgeList.get(i);
					if (edge.id == lid) {
						connectionEdge = edge;
						break;
					}
				}
				var source = canvas.getFigure(sourceRef);
				var target = canvas.getFigure(targetRef);
				var sPorts = source.getPorts();
				var tPorts = target.getPorts();
				var startPort = null;
				var endPort = null;
				for (var i = 0; i < sPorts.getSize(); i++) {
					var s = sPorts.get(i);
					var x = s.getAbsoluteX();
					var y = s.getAbsoluteY();
					if (x == connectionEdge.startX && y == connectionEdge.startY) {
						startPort = s;
						break;
					}
				}
				for (var i = 0; i < tPorts.getSize(); i++) {
					var t = tPorts.get(i);
					var x = t.getAbsoluteX();
					var y = t.getAbsoluteY();
					if (x == connectionEdge.endX && y == connectionEdge.endY) {
						endPort = t;
						break;
					}
				}
				var connection = canvas.createConnection(startPort, endPort);
				connection.id = lid;
				connection.name = name;
				connection.condition = condition;
				connection.sourceRef = sourceRef;
				connection.targetRef = targetRef;
				connectionList.add(connection);
			});
}
function loadConnectionLocation(connection, edgeList) {
	for (var i = 0; i < edgeList.getSize(); i++) {
		var edge = edgeList.get(i);
		if (edge.id == connection.id) {
			connection.startX = edge.startX;
			connection.startY = edge.startY;
			connection.endX = edge.endX;
			connection.endY = edge.endY;
			return;
		}
	}
}
function loadFigureLocation(figure, shapeList) {
	for (var i = 0; i < shapeList.getSize(); i++) {
		var shape = shapeList.get(i);
		if (shape.id == figure.id) {
			figure.x = shape.x;
			figure.y = shape.y;
			figure.width = shape.width;
			figure.height = shape.height;
			return;
		}
	}
}
function parseTask(xmlNode, taskList, shapeList) {
	for (var i = 0; i < TASK_PARSER_MAP.length; i++) {
		var map = TASK_PARSER_MAP[i];
		var tasks = xmlNode.find(map.tagName);
		tasks.each(function(i) {
					var task = eval("new " + map.model);
					map.parser.parseTask($(this), task);
					// console.dir(task);
					taskList.add(task);
				});
	}
	for (var i = 0; i < taskList.getSize(); i++) {
		loadFigureLocation(taskList.get(i), shapeList);
	}
}
function parseGateway(xmlNode, gatewayList) {
	var exclusiveGateway = xmlNode.find('exclusiveGateway');
	var parallelGateway = xmlNode.find('parallelGateway');
	exclusiveGateway.each(function(i) {
				var gateway = new ESTDesigner.gateway.ParallelGateway();
				var id = $(this).attr('id');
				var name = $(this).attr('name');
				gateway.id = gtwid;
				gateway.name = gtwname;
				gatewayList.add(gateway);
			});
	parallelGateway.each(function(i) {
				var gateway = new ESTDesigner.gateway.ExclusiveGateway();
				var gtwid = $(this).attr('id');
				var gtwname = $(this).attr('name');
				gateway.id = gtwid;
				gateway.name = gtwname;
				gatewayList.add(gateway);
			});
}