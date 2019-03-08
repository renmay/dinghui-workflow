/*
 * 所有container节点的基类
 */
ESTDesigner.container.BaseContainer=draw2d.shape.composite.Raft.extend({
    init:function(attr, setter, getter){
        this.name = null;
        this.iconPath = null;// icon path
        this.listeners = new draw2d.util.ArrayList();
        this.variables = new draw2d.util.ArrayList();
        this.dataObjects = new draw2d.util.ArrayList();
        this.lines = new draw2d.util.ArrayList();
        this.models = new draw2d.util.ArrayList();
        this.type = null;
        this.title = null;
        this.dom = null;
        this.documentation = null;
        this.asynchronous = null;
        // this.contextMenuHandler = null;
        this.exclusive = true;
        this.isSequential = false;
        this._loopCardinality = null;
        this._collection = null;
        this._elementVariable = null;
        this._completionCondition = null;
        this._super($.extend({
                            id : ESTDesigner.tool.UUID.create()
                        }, attr), $.extend({
                            type : this.setType,
                            title : this.setTitle,
                            iconPath : this.setIconPath
                        }, setter), $.extend({
                            type : this.getType,
                            title : this.getTitle,
                            iconPath : this.getIconPath
                        }, getter));
        this.setBackgroundColor("#E3DFB8");
        this.setColor("#39b2e5");
        this.setStroke(1);
        this.setRadius(2);
        this.setDimension(500, 300);
        this.setResizeable(true);
        this.createPort("hybrid", new draw2d.layout.locator.LeftLocator());
        this.createPort("hybrid", new draw2d.layout.locator.RightLocator());
        this.createPort("hybrid", new draw2d.layout.locator.BottomLocator());
        this.createPort("hybrid", new draw2d.layout.locator.TopLocator());
        
        this.ico = new draw2d.shape.basic.Image();
        this.ico.setDimension(20, 20);
        this.ico.path = this.iconPath == null ? "" : this.getIconPath();
        
        this.containerNameLabel = new draw2d.shape.basic.Label();
        this.containerNameLabel.setText('SubProcess Name');
        this.containerNameLabel.setStroke(0);
        var editor = new draw2d.ui.LabelInplaceEditor({
                    // called after the value has been set to the LabelFigure
                    onCommit : $.proxy(function(value) {
                                this.containerNameLabel.getParent().name = value;
                            }, this)
                });
        this.containerNameLabel.installEditor(editor);
        this.containerNameLabel.on("contextmenu", function(emitter, event) {
                    var container = emitter.getParent();
                    container.onContextMenu(event.x, event.y);
                });
        this.containerNameLabel.add(this.ico, new draw2d.layout.locator.LeftLocator());
        this.add(this.containerNameLabel, new draw2d.layout.locator.XYRelPortLocator(5,1));
    },
    getType : function() {
        return this.iconPath;
    },
    setType : function(type) {
        this.type = type;
        this.fireEvent("change:type", {
                    value : this.type
                });
        return this;
    },
    getTitle : function() {
        return this.title;
    },
    setTitle : function(title) {
        this.title = title;
        this.fireEvent("change:title", {
                    value : this.title
                });
        return this;
    },
    getIconPath : function() {
        return this.iconPath;
    },
    setIconPath : function(path) {
        this.iconPath = path;
        this.fireEvent("change:iconPath", {
                    value : this.iconPath
                });
        return this;
    },
    setContainerName : function(name) {
        this.containerNameLabel.setText(name);
        this.name = name;
    },
    toXML : function() {
        return "";
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
    onContextMenu : function(x, y) {
        var canvas = this.getCanvas();
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
                                        if (canvas.taskCallback != null) {
                                            if (typeof canvas.containerCallback == "function")
                                                canvas.containerCallback(this);
                                        }
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
    getGeneralXML : function() {
        var name = this.id;
        var taskName = $.trim(this.name);
        if (taskName != null && taskName != "")
            name = taskName;
        var xml = ' id="' + this.id + '" name="' + name + '" ';
        if (this.asynchronous) {
            xml = xml + 'activiti:async="true" '
        }
        if (!this.exclusive) {
            xml = xml + 'activiti:exclusive="false" '
        }
        return xml;
    },
    getMultiInstanceXML : function() {
        var xml = '';
        if (this.isSequential) {
            xml = xml + '<multiInstanceLoopCharacteristics ';
            if (this._elementVariable != null && this._elementVariable != '')
                xml = xml + 'activiti:elementVariable="' + this._elementVariable + '" ';
            if (this._collection != null && this._collection != '')
                xml = xml + 'activiti:collection="' + this._collection + '" ';
            xml = xml + '>\n'
            if (this._loopCardinality != null && this._loopCardinality != '')
                xml = xml + '<loopCardinality>' + this._loopCardinality
                        + '</loopCardinality>\n';
            if (this._completionCondition != null && this._completionCondition != '')
                xml = xml + '<completionCondition>' + this._completionCondition
                        + '</completionCondition>\n'
            xml = xml + '</multiInstanceLoopCharacteristics>\n';
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
    getListenersXML : function() {
        var xml = '';
        for (var i = 0; i < this.listeners.getSize(); i++) {
            var listener = this.listeners.get(i);
            xml = xml + listener.toXML();
        }
        return xml;
    },
    toBpmnDI : function() {
        var w = this.getWidth();
        var h = this.getHeight();
        var x = this.getAbsoluteX();
        var y = this.getAbsoluteY();
        var xml = '<bpmndi:BPMNShape bpmnElement="' + this.getId() + '" id="BPMNShape_'
                + this.getId() + '">\n';
        xml = xml + '<omgdc:Bounds height="' + h + '" width="' + w + '" x="' + x + '" y="'
                + y + '"/>\n';
        xml = xml + '</bpmndi:BPMNShape>\n';
        return xml;
    }
});
ESTDesigner.container.SubProcess=ESTDesigner.container.BaseContainer.extend({
    init : function(attr, setter, getter) {
        this._super($.extend({
                            type : "ESTDesigner.container.SubProcess",
                            title : "",
                            iconPath : "js/ESTDesigner/icons/type.subprocess.collapsed.png"
                        }, attr), setter, getter);
        this.performerType = null;
        this.dueDate = null;
        this.priority = null;
        this.formKey = null;
        this.expression = null;
        this.isUseExpression = null;
        this.assignee = null;
        this.candidateUsers = new draw2d.util.ArrayList();
        this.candidateGroups = new draw2d.util.ArrayList();
        this.formProperties = new draw2d.util.ArrayList();
        this.taskListeners = new draw2d.util.ArrayList();
    },
    getStartElementXML : function() {
        var xml = '<subProcess ';
        xml = xml + this.getGeneralXML();
        xml = xml + '>\n';
        return xml;
    },
    getEndElementXML : function() {
        var xml = '</subProcess>\n';
        return xml;
    },
    getDocumentationXML : function() {
        if (this.documentation == null || this.documentation == '')
            return '';
        var xml = '<documentation>';
        xml = xml + this.documentation;
        xml = xml + '</documentation>';
        return xml;
    },
    getInnerModelsXML : function(){
        var xml="";
        var models = this.getAboardFigures(true);
        for(var i=0;i<models.getSize();i++){
//          console.log(models.get(i));
            var model=models.get(i);
            xml=xml+model.toXML();
//            bpmnDigramXml=bpmnDigramXml+model.toBpmnDI();
        }
        return xml;
    },
    getInnerLinesXML : function(){
        var xml="";
        for(var i=0;i<this.lines.getSize();i++){
            var line=this.lines.get(i);
            xml=xml+line.toXML();
        }
        return xml;
    },
    getDataObjectsXML : function(){
        var xml="";
        for(var i=0;i<this.dataObjects.getSize();i++){
            var dataObject=this.dataObjects.get(i);
            xml=xml+dataObject.toXML();
        }
        return xml;
    },
    toXML : function() {
        var xml = this.getStartElementXML();
        xml = xml + this.getDocumentationXML();
        xml = xml + this.getExtensionElementsXML();
        xml = xml + this.getMultiInstanceXML();
        xml = xml + this.getDataObjectsXML();
        xml = xml + this.getInnerModelsXML();
        xml = xml + this.getInnerLinesXML();
        xml = xml + this.getEndElementXML();
        return xml;
    }
});