var Random = Mock.Random
// 保存流程
Mock.mock(Config.Url.Save_Wf, { // 匹配url
    result : true,
    message : ""
});
// 获取Task候选人列表
Mock.mock(Config.Url.Get_Candidate_Users, // 匹配url
[ {
    userId : 1,
    sso : '00001',
    name : Random.cname(),
    'title|1' : [ '经理', '主任', '职员' ],
    email : Random.email(),
    'userStatus|1' : [ '有效', '无效' ]
}, {
    userId : 2,
    sso : '00002',
    name : Random.cname(),
    'title|1' : [ '经理', '主任', '职员' ],
    email : Random.email(),
    'userStatus|1' : [ '有效', '无效' ]
}, {
    userId : 3,
    sso : '00003',
    name : Random.cname(),
    'title|1' : [ '经理', '主任', '职员' ],
    email : Random.email(),
    'userStatus|1' : [ '有效', '无效' ]
}, {
    userId : 4,
    sso : '00004',
    name : Random.cname(),
    'title|1' : [ '经理', '主任', '职员' ],
    email : Random.email(),
    'userStatus|1' : [ '有效', '无效' ]
} ]);
// 获取Group下拉框列表
Mock.mock(Config.Url.Get_Groups_4_Combox, [ {
    groupId : 1,
    'name|1' : [ '人力资源部', '部门领导', '采购部' ]
}, {
    groupId : 2,
    'name|1' : [ '人力资源部', '部门领导', '采购部' ]
}, {
    groupId : 3,
    'name|1' : [ '人力资源部', '部门领导', '采购部' ]
} ]);
// 获取候选Group列表
Mock.mock(Config.Url.Get_Candidate_Groups, [ {
    groupId : 1,
    'name|1' : [ '人力资源部', '部门领导', '采购部' ],
    remark : '测试数据'
}, {
    groupId : 2,
    'name|1' : [ '人力资源部', '部门领导', '采购部' ],
    remark : '测试数据'
}, {
    groupId : 3,
    'name|1' : [ '人力资源部', '部门领导', '采购部' ],
    remark : '测试数据'
} ]);
// 获取Task Listener class列表
Mock.mock(new RegExp(Config.Url.Get_Task_Listener_Classes), [ {
    value : 'com.lish.mock.task.Listener1',
    label : 'com.lish.mock.task.Listener1'
}, {
    value : 'com.lish.mock.task.Listener2',
    label : 'com.lish.mock.task.Listener2'
}, {
    value : 'com.lish.mock.task.Listener3',
    label : 'com.lish.mock.task.Listener3'
} ]);
//获取Execution Listener class列表
Mock.mock(new RegExp(Config.Url.Get_Execution_Listener_Classes), [ {
    value : 'com.lish.mock.execution.Listener1',
    label : 'com.lish.mock.execution.Listener1'
}, {
    value : 'com.lish.mock.execution.Listener2',
    label : 'com.lish.mock.execution.Listener2'
}, {
    value : 'com.lish.mock.execution.Listener3',
    label : 'com.lish.mock.execution.Listener3'
} ]);
//获取Process Listener class列表
Mock.mock(new RegExp(Config.Url.Get_Process_Listener_Classes), [ {
    value : 'com.lish.mock.process.Listener1',
    label : 'com.lish.mock.process.Listener1'
}, {
    value : 'com.lish.mock.process.Listener2',
    label : 'com.lish.mock.process.Listener2'
}, {
    value : 'com.lish.mock.process.Listener3',
    label : 'com.lish.mock.process.Listener3'
} ]);
//获取Flow Listener class列表
Mock.mock(new RegExp(Config.Url.Get_Flow_Listener_Classes), [ {
    value : 'com.lish.mock.flow.Listener1',
    label : 'com.lish.mock.flow.Listener1'
}, {
    value : 'com.lish.mock.flow.Listener2',
    label : 'com.lish.mock.flow.Listener2'
}, {
    value : 'com.lish.mock.flow.Listener3',
    label : 'com.lish.mock.flow.Listener3'
} ]);