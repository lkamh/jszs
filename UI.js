"ui";

importClass(java.net.HttpURLConnection);
importClass(java.net.URL);
importClass(java.io.File);
importClass(java.io.FileOutputStream);
importClass(android.graphics.Color);


var color = "#009688";

ui.layout(
    <drawer id="drawer">
        <vertical>
            <appbar>
                <toolbar id="toolbar" bg="#009688" title="记事助手" />
            </appbar>
            <frame >
                <vertical>
                    <horizontal gravity="center_vertical" padding="5 20" >
                        <View bg="#3399ff" h="*" w="8"  ></View>
                        <horizontal gravity="center">
                            <Switch id="autoService" text="  无障碍服务" checked="{{auto.service != null}}" gravity="left" textSize="17sp" />
                            <Switch id="consoleshow" text="    悬浮窗权限" checked="{{floaty.checkPermission()}}" gravity="right" textSize="17sp" />
                        </horizontal>
                    </horizontal>
                    <vertical gravity="center">
                        <card gravity="center" marginTop="10xp" w="100" h="30" cardCornerRadius="10" >
                            <vertical gravity="center" bg="#3399ff">
                                <text text="任务选择列表" textColor="#FFFFFF" gravity="center" />
                            </vertical>
                        </card>
                        <card w="*" cardCornerRadius="10" gravity="center" marginTop="10">
                            <vertical>
                                <vertical padding="16">
                                    {/* <text text="【任务选择列表】" textSize="16sp" textColor="#f58220" /> */}
                                    <checkbox id="cb1" checked="true" text="头条：推荐转发任务" />
                                    <checkbox id="cb2" checked="true" text="头条：专栏评论任务" />
                                    {/* <checkbox id="cb3" checked="true" text="更多任务..." enabled="false" /> */}
                                </vertical>
                            </vertical>
                        </card>
                    </vertical>
                    <vertical gravity="bottom" padding="5 40">
                        <button id="start" text="开 始 做 任 务" textSize="20sp" color="#ffffff" bg="#3399ff" foreground="?selectableItemBackground" />
                    </vertical>
                </vertical>
            </frame>
        </vertical>
        <vertical layout_gravity="left" bg="#ffffff" w="280">
            <img w="280" h="200" scaleType="fitXY" src="http://images.shejidaren.com/wp-content/uploads/2014/10/023746fki.jpg" />
            <list id="menu">
                <horizontal bg="?selectableItemBackground" w="*">
                    <img w="50" h="50" padding="16" src="{{this.icon}}" tint="{{color}}" />
                    <text textColor="black" textSize="15sp" text="{{this.title}}" layout_gravity="center" />
                </horizontal>
            </list>
        </vertical>
    </drawer>
);

http.__okhttp__.setTimeout(10000);

var idx_dict = {
    "挑战答题": 0,
    "四人赛": 1
};

var jszs = storages.create("jszs");//创建存储

// 下载并运行所选脚本
ui.start.click(function () {
    // threads.shutDownAll();
    // if (thread != null && thread.isAlive()) {
    //     alert("注意", "脚本正在运行，请结束之前进程");
    //     return;
    // }
    jszs.put("tjzf", ui.cb1.isChecked());
    jszs.put("zlpl", ui.cb2.isChecked());
    threads.start(function () {
        execution = engines.execScript("记事助手", getScript(0));//直接下载0.js
        toastLog('脚本加载完成')
    });
});

// 用户勾选无障碍服务的选项时，跳转到页面让用户去开启 
ui.autoService.on("check", function (checked) {
    if (checked && auto.service == null) {
        app.startActivity({
            action: "android.settings.ACCESSIBILITY_SETTINGS"
        });
    }
    if (!checked && auto.service != null) {
        auto.service.disableSelf();
    }
});
// 悬浮窗权限
ui.consoleshow.on("check", function (checked) {
    if (checked && !floaty.checkPermission()) {
        let mIntent = app.intent({
            action: "android.settings.action.MANAGE_OVERLAY_PERMISSION",
            data: "package:" + currentPackage(),
        });
        //这里把数字1作为标记
        activity.startActivityForResult(mIntent, 1);
    }
});
// 创建选项菜单(右上角)
ui.emitter.on("create_options_menu", menu => {
    menu.add("日志");
    menu.add("关于");
});

// 监听选项菜单点击
ui.emitter.on("options_item_selected", (e, item) => {
    switch (item.getTitle()) {
        case "日志":
            app.startActivity("console");
            break;
        case "关于":
            alert("关于", "记事本辅助工具");
            break;
    }
    e.consumed = true;
});
activity.setSupportActionBar(ui.toolbar);


function getScript(choice) {
    let url_prefix = [
        'https://mirror.ghproxy.com/https://raw.githubusercontent.com/lkamh/jszs/main/',
        'https://raw.fastgit.org/lkamh/jszs/main/',
        'https://gh-proxy.com/https://raw.githubusercontent.com/lkamh/jszs/main/',
        'https://gh.api.99988866.xyz/https://raw.githubusercontent.com/lkamh/jszs/main/'
    ];
    for (var i = 0; i < url_prefix.length; i++) {
        try {
            let res = http.get(url_prefix[i] + choice + ".js");
            console.log(i, ":" + res.statusCode);
            if (res.statusCode == 200) {
                var UI = res.body.string();
                if (UI.indexOf('auto.waitFor();') == 0) break;
            } else {
                toastLog('学习脚本:地址' + i + '下载失败');
            }
        } catch (error) {
            console.log(error);
        }
    }
    return UI;
}

//保持脚本运行
setInterval(() => { }, 1000);