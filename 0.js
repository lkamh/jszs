auto.waitFor(); //mode = "fast"
var delay_time = 3000;
device.wakeUpIfNeeded();//如果屏幕没有点亮，则唤醒设备。
var fast_mode = true;
//判断是否快速模式
if (fast_mode) {
    auto.setMode("fast");//该模式下会启用控件缓存，从而选择器获取屏幕控件更快
}
events.observeToast();//开启 Toast 监听，Toast 监听依赖于无障碍服务，因此此函数会确保无障碍服务运行
sleep(delay_time);//暂停3秒
var is_exit = true;//运行前退出app
var jszs = storages.create("jszs");//加载存储
var tjzf = jszs.get("tjzf",true);
var zlpl = jszs.get("zlpl",true);


/*****************更新内容弹窗部分*****************/



sleep(1000);

var w = fInit();
fInfo("记事助手" + "脚本初始化");
// 初始化宽高
var [device_w, device_h] = init_wh();//init_wh()是返回设备宽和高的函数

// 自动允许权限进程
threads.start(function () {
    //在新线程执行的代码
    toastLog("开始自动获取截图权限");
    var btn = className("android.widget.Button").textMatches(/允许|立即开始|START NOW/).findOne(5000);
    if (btn) {
        sleep(1000);
        btn.click();
    }
    toastLog("结束获取截图权限");
});
fInfo("请求截图权限");
// 请求截图权限、似乎请求两次会失效
if (!requestScreenCapture(false)) { // false为竖屏方向
    fError('请求截图失败');
    exit();
}
// 防止设备息屏
fInfo("设置屏幕常亮");
device.keepScreenOn(3600 * 1000);



if (is_exit) {
    fInfo("运行前重置学习APP");
    exit_app("记事本");
    sleep(1500);
    fClear();
}

fInfo("跳转记事本APP");
// launch('cn.xuexi.android');
app.launchApp('记事本');
sleep(2000);


/*******************运行部分*******************/
fClear();
text("我的").waitFor();
fInfo("获取任务列表")

var tasklist = text("下拉刷新").findOne().parent().parent();
// var finishCode = "es1H5Q3OXksdzeyUJT6CrBGRb04xvA+W146fvn3S2T0+EtQ3HxeV8UN8+z1fAvyF8ppZ3C33YqXAAAAAElFTkSuQmCC";
// var a = tasklist.childCount();
// var b = "";
sleep(2000);
// //下拉到最后
// while (tasklist) {
//     swipe(device_w / 2, device_h * 0.8, device_w / 2, device_h * 0.2, 1000);
//     sleep(1000);
//     a = tasklist.childCount();
//     if (b == a) {
//         fInfo("已获取全部任务")
//         break
//     }
//     b = a;
//     fInfo("循环滑动中")
// }
fInfo("点击推荐按钮");
text("推荐").findOne().click();
sleep(1000);
//推荐转发任务
for (let i = 0; ; i++) {
    fClear();
    sleep(2000);
    fInfo("正在做第" + (i +1) + "轮转发任务");
    let sharebtn = text("gYGPl0wKyfOvgAAAABJRU5ErkJggg==").findOnce(i);
    console.log(sharebtn.parent().parent().childCount())
    
    if (sharebtn.parent().parent().parent().childCount() == 5) {
        fInfo("已完成全部转发任务");
        break
    }

    let sharetext = sharebtn.parent().parent().parent().child(1).text().substr(0, 4);
    if (!(text("gYGPl0wKyfOvgAAAABJRU5ErkJggg==").findOnce(i).click() == null)) {
        className("com.uc.webview.export.WebView").waitFor();
        sleep(3000);
        desc("菜单").findOne().click();
        sleep(500);
        desc("分享").findOne().click();
        text("微信好友").findOne().parent().click();
        text("文件传输助手").findOne().parent().click();
        text("分享").findOne().click();
        text("留在微信").findOne().click();
        text("文件传输助手").findOne().parent().parent().parent().parent().parent().click();
        sleep(1000);
        textStartsWith(sharetext).findOne().parent().parent().parent().click();
        sleep(1000);
        textStartsWith(sharetext).waitFor();
        swipe(device_w / 2, device_h * 0.8, device_w / 2, device_h * 0.7, 1000);
        sleep(3000);
        app.launchApp('记事本');
        sleep(2000)
        fClear();
        swipe(device_w / 2, device_h * 0.8, device_w / 2, device_h * 0.7, 1000);
    } else {
        toastLog("已完成推荐栏目转发任务");
        finish();
        break
    }
}

finish();//结束任务













/*****************结束后配置*****************/
function finish() {
    fInfo("已全部结束");
    // 调回原始音量

    // 取消屏幕常亮
    fInfo("取消屏幕常亮");
    device.cancelKeepingAwake();
    // exit_app("学习强国");

    // 震动提示
    device.vibrate(500);
    fInfo("十秒后关闭悬浮窗");
    device.cancelVibration();
    sleep(10000);
    console.hide();
    home();
    exit();
}
/********双人、四人赛*********/

// 模拟随机时间0.5-3秒，后期可以用户自定义
function ran_sleep() {
    return sleep(random(1000, delay_time));
}





// 屏幕宽高、方向初始化
function init_wh() {
    fInfo("屏幕方向检测");
    log(device.width + "*" + device.height);
    var device_w = depth(0).findOne().bounds().width();
    var device_h = depth(0).findOne().bounds().height();
    log(device_w + "*" + device_h);
    if (device.width == device_h && device.height == device_w) {
        fError("设备屏幕方向检测为横向，后续运行很可能会报错，建议调整后重新运行脚本");
        sleep(10000);
    } else if (device.width == 0 || device.height == 0) {
        fError("识别不出设备宽高，建议重启强国助手后重新运行脚本");
        sleep(10000);
    }
    return [device_w, device_h]
}

// 尝试成功点击
function real_click(obj) {
    for (let i = 1; i <= 3; i++) {
        if (obj.click()) {
            log("real click: true");
            return true;
        }
        sleep(300);
    }
    console.warn("控件无法正常点击：", obj);
    log("尝试再次点击");
    click(obj.bounds().centerX(), obj.bounds().centerY());
    return false;
}


// 强行退出应用名称
function exit_app(name) {
    // fClear();
    fInfo("尝试结束" + name + "APP");
    var packageName = getPackageName(name);
    if (!packageName) {
        if (getAppName(name)) {
            packageName = name;
        } else {
            return false;
        }
    }
    log("打开应用设置界面");
    app.openAppSetting(packageName);
    var appName = app.getAppName(packageName);
    //log(appName);
    log("等待加载界面")
    //textMatches(/应用信息|应用详情/).findOne(5000);
    text(appName).findOne(5000);
    sleep(1500);
    log("查找结束按钮")
    //let stop = textMatches(/(^强行.*|.*停止$|^结束.*)/).packageNameMatches(/.*settings.*|.*securitycenter.*/).findOne();
    let stop = textMatches(/(强.停止$|.*停止$|结束运行|停止运行|[Ff][Oo][Rr][Cc][Ee] [Ss][Tt][Oo][Pp])/).findOne(5000);
    log("stop:", stop.enabled())
    if (stop.enabled()) {
        //log("click:", stop.click());
        real_click(stop);
        sleep(1000);
        log("等待确认弹框")
        //let sure = textMatches(/(确定|^强行.*|.*停止$)/).packageNameMatches(/.*settings.*|.*securitycenter.*/).clickable().findOne();
        let sure = textMatches(/(确定|.*停止.*|[Ff][Oo][Rr][Cc][Ee] [Ss][Tt][Oo][Pp]|O[Kk])/).clickable().findOne(1500);
        if (!sure) {
            fInfo(appName + "应用已关闭");
            back();
            return false;
        }
        log("sure click:", sure.click());
        fInfo(appName + "应用已被关闭");
        sleep(1000);
        back();
    } else {
        fInfo(appName + "应用不能被正常关闭或不在后台运行");
        sleep(1000);
        back();
    }
    return true;
}





/*******************悬浮窗*******************/
function fInit() {
    // ScrollView下只能有一个子布局
    var w = floaty.rawWindow(
        <card cardCornerRadius='8dp' alpha="0.8">
            <vertical>
                <horizontal bg='#FF000000' padding='10 5'>
                    <text id='version' textColor="#FFFFFF" textSize="18dip">记事助手+</text>
                    <text id='title' h="*" textColor="#FFFFFF" textSize="13dip" layout_weight="1" gravity="top|right"></text>
                </horizontal>
                <ScrollView>
                    <vertical bg='#AA000000' id='container' minHeight='20' gravity='center'></vertical>
                </ScrollView>
            </vertical>
            <relative gravity="right|bottom">
                <text id="username" textColor="#FFFFFF" textSize="12dip" padding='5 0'></text>
            </relative>
        </card>
    );
    ui.run(function () {
        //w.title.setFocusable(true);
        w.version.setText("记事助手");
    });
    w.setSize(720, -2);
    w.setPosition(10, 10);
    w.setTouchable(false);
    return w;
}

function fSet(id, txt) {
    ui.run(function () {
        w.findView(id).setText(txt);
    });
}

function fInfo(str) {
    ui.run(function () {
        let textView = ui.inflate(<text id="info" maxLines="2" textColor="#7CFC00" textSize="15dip" padding='5 0'></text>, w.container);
        textView.setText(str.toString());
        w.container.addView(textView);
    });
    console.info(str);
}

function fError(str) {
    ui.run(function () {
        let textView = ui.inflate(<text id="error" maxLines="2" textColor="#FF0000" textSize="15dip" padding='5 0'></text>, w.container);
        textView.setText(str.toString());
        w.container.addView(textView);
    });
    console.error(str);
}

function fTips(str) {
    ui.run(function () {
        let textView = ui.inflate(<text id="tips" maxLines="2" textColor="#FFFF00" textSize="15dip" padding='5 0'></text>, w.container);
        textView.setText(str.toString());
        w.container.addView(textView);
    });
    console.info(str);
}

function fClear() {
    ui.run(function () {
        w.container.removeAllViews();
    });
}

function fRefocus() {
    threads.start(function () {
        ui.run(function () {
            w.requestFocus();
            w.title.requestFocus();
            ui.post(function () {
                w.title.clearFocus();
                w.disableFocus();
            }, 200);
        });
    });
    sleep(500);
}
