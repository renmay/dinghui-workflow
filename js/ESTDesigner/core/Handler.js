var EventHandler = {
    OnSaveWf : {
        Success : function (data) {
            if (data.code=="0") {
                $.messager.alert('Info', '保存成功！', 'info');
            } else {
                $.messager.alert('Error', data.message, 'error');
            }
        },
        Error : function () {
            $.messager.alert('Error', '保存失败！', 'error');
        }
    }
}