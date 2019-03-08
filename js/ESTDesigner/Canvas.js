ESTDesigner.Canvas=draw2d.Canvas.extend({
	init:function(id,width,height){
		this.name = null;
		this.process= new ESTDesigner.model.Process();
		this._super(id,width,height);
		this.installEditPolicy(new draw2d.policy.canvas.FadeoutDecorationPolicy());//鼠标移入编辑区连接点消失和显示效果
		this.installEditPolicy(new draw2d.policy.canvas.WheelZoomPolicy());//鼠标滚轮放大缩小效果
		this.installEditPolicy(new draw2d.policy.connection.DragConnectionCreatePolicy({//拖拽连接点划线效果
		    createConnection: this.createConnection
		}));
//		this.installEditPolicy( new draw2d.policy.canvas.CanvasPolicy({
//	        onClick: function(figure){
//	            if(figure!=null)
//	                figure.toFront();
//	        }
//	     }));
		this.callback = null;
		this.connectionCallback = null;
		this.taskCallback = null;
		this.containerCallback = null;
		this.on("contextmenu", function(emitter, event) {
			//触发右键菜单事件不是canvas直接返回
			if(event.figure!=null)return;
			$.contextMenu({
				selector : 'body',
				events : {
					hide : function() {
						$.contextMenu('destroy');
					}
				},
				callback : $.proxy(function(key, options) {
					switch (key) {
					case "Properties":
						emitter.contextmenuHandler(emitter.id);
						break;
					default:
						break;
					}

				}, this),
				x : event.x,
				y : event.y,
				items : {
					"Properties" : {
						name : "属性"
					}
				}
			});
		});
	},
	contextmenuHandler:function(id){
		if(this.callback!=undefined && this.callback!=null && typeof this.callback=="function"){
			this.callback(id);
		}
	},
	createConnection:function(sourcePort, targetPort){

	    var conn=new ESTDesigner.connection.Connection({
	    	source:sourcePort,
	        target:targetPort
	        });

	    // since version 3.5.6
	    //
	    conn.on("dragEnter", function(emitter, event){
	        conn.attr({outlineColor:"#30ff30"});
	    });
	    conn.on("dragLeave", function(emitter, event){
	        conn.attr({outlineColor:"#303030"});
	    });
	    conn.callback=function(){
	    	var canvas = this.getCanvas();
	    	if(canvas.connectionCallback!=undefined && canvas.connectionCallback!=null && typeof canvas.connectionCallback=="function"){
	    		canvas.connectionCallback(this);
			}
	    }
	    return conn;

	},
	getXMLHeader:function(){
		var xml='<?xml version="1.0" encoding="UTF-8"?>\n';
		return xml;
	},
	getDefinitionsStartXML:function(){
		var xml = '<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"\n '
			+'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n '
			+'xmlns:xsd="http://www.w3.org/2001/XMLSchema"\n '
			+'xmlns:activiti="http://activiti.org/bpmn"\n '
			+'xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"\n '
			+'xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC"\n '
			+'xmlns:omgdi="http://www.omg.org/spec/DD/20100524/DI"\n '
			+'typeLanguage="http://www.w3.org/2001/XMLSchema"\n '
			+'expressionLanguage="http://www.w3.org/1999/XPath"\n '
			+'targetNamespace="'+this.process.category+'">\n';
		return xml;
	},
	getDefinitionsEndXML:function(){
		var xml='</definitions>\n';
		return xml;
	},
	toXML:function(){
		var xml = this.getXMLHeader();
		xml = xml+this.getDefinitionsStartXML();
		xml=xml+'<process id="'+this.process.id+'" name="'+this.process.name+'">\n';
		xml=xml+this.process.getDocumentationXML();
		xml=xml+this.process.getExtensionElementsXML();
		xml=xml+this.process.getDataObjectsXML();
		var bpmnDigramXml='<bpmndi:BPMNDiagram id="BPMNDiagram_'+this.process.id+'">\n'
		bpmnDigramXml=bpmnDigramXml+'<bpmndi:BPMNPlane bpmnElement="'+this.process.id+'" id="BPMNPlane_'+this.process.id+'">\n'
		var models = this.getFigures();
//		console.log(models);
		var containers = new draw2d.util.ArrayList();
		for(var i=0;i<models.getSize();i++){
			var model=models.get(i);
			if(model instanceof ESTDesigner.container.BaseContainer){
				containers.add(model);
			}
		}
		for(var i=0;i<models.getSize();i++){
//			console.log(models.get(i));
			var model=models.get(i);
			if(containers.contains(model))continue;//最后输出Container对象
			var isComposited=false;
			for(var j=0;j<containers.getSize();j++){
				var container=containers.get(j);
				var raftBoundingBox = container.getBoundingBox();
				if(model !==container && model.isSelectable() === true && model.getBoundingBox().isInside(raftBoundingBox)){//判断model是否在composite内部
					isComposited=true;
					break;
				}
			}
			if(!isComposited){
				xml=xml+model.toXML();
			}
			bpmnDigramXml=bpmnDigramXml+model.toBpmnDI();
		}
		var lines = this.getLines();
		for(var i=0;i<lines.getSize();i++){
			var line = lines.get(i);
			var isComposited=false;
			for(var j=0;j<containers.getSize();j++){
				var container=containers.get(j);
				var raftBoundingBox = container.getBoundingBox();
				var aboardedFigures = container.getAboardFigures(true);
				if (aboardedFigures.contains(line.getSource().getRoot()) && aboardedFigures.contains(line.getTarget().getRoot())){//判断line是否在composite内部
					isComposited=true;
					if(!container.lines.contains(line)){
						container.lines.add(line);
					}
					break;
				}
			}
			if(!isComposited){
				xml=xml+line.toXML();
			}
			bpmnDigramXml=bpmnDigramXml+line.toBpmnDI();
		}
		for(var i=0;i<containers.getSize();i++){
			var container=containers.get(i);
			xml=xml+container.toXML();
			bpmnDigramXml=bpmnDigramXml+container.toBpmnDI();
		}
		xml=xml+'</process>\n';
		bpmnDigramXml=bpmnDigramXml+'</bpmndi:BPMNPlane>\n'
		bpmnDigramXml=bpmnDigramXml+'</bpmndi:BPMNDiagram>\n';
		xml=xml+bpmnDigramXml;
		xml=xml+this.getDefinitionsEndXML();
		xml=formatXml(xml);
		return xml;
	}
});
