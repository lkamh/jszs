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
var tjzf = jszs.get("tjzf", true);
var zlpl = jszs.get("zlpl", true);
var old_wen = jszs.get("old_wen_list", []);

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
    fInfo("运行前重置记事本APP");
    exit_app("记事本");
    sleep(1500);
    fClear();
}

fInfo("跳转记事本APP");
// launch('cn.xuexi.android');
app.launchApp('记事本');
sleep(2000);
fInfo("开启登录界面检测");
var nologin_thread = threads.start(function () {
    //在新线程执行的代码
    textContains("登录解锁").waitFor();
    fInfo("检测到登录验证界面");
    sleep(1000);
    fInfo("自动点击发送验证码");
    desc("发送验证码").findOne().click();
    text("我同意").click();
});


/*******************运行部分*******************/
className("android.widget.ListView").waitFor();
sleep(2000);
fClear();
nologin_thread.isAlive() && (nologin_thread.interrupt(), fInfo("终止登录弹窗检测"));
fInfo("等待进入主界面");
textStartsWith("积分").waitFor();
// sleep(2000);
fInfo("获取任务列表");

sleep(2000);

try {
    let task_zf = textStartsWith("toutiao").findOne().parent().child(1).text();
    toastLog("检测到" + task_zf + "个未做任务");
} catch (e) {
    console.log(e);
    toastLog("已完成全部任务");
    // finish();
}
if (tjzf) {
    sleep(1000);
    //刷新任务列表
    swipe(device_w / 2, device_h * 0.5, device_w / 2, device_h * 0.8, 1500);
    sleep(3000);
    //推荐转发任务
    let old_wen = jszs.get("old_wen_list", []);
    let wen_box_slt = className("android.view.View").depth(13).filter(function (l) {
        let titleName = l.child(1).text();
        try {
            let appName = l.child(2).child(2);
            console.log(appName);
            var title = titleName + ":" + appName;
            console.log(title)
        } catch (error) {
            console.log("跳过筛选");
        }
        if (title) {
            return title != "下拉刷新" && title != "没有更多数据" && old_wen.indexOf(title) == -1;
        }
        return false;
    });
    for (let i = 1; ; i++) {
        fClear();
        sleep(2000);
        //构建没有完成过的转发任务
        log("查找转发任务");
        console.log(wen_box_slt.exists());
        console.log(wen_box_slt.findOne(1000));
        while (!wen_box_slt.findOne(500)) {
            for (let j = 1; j <= 3; j++) {
                swipe(device_w / 2, device_h * 0.7, device_w / 2, device_h * 0.6, 1000);
                //sleep(500);
                if (wen_box_slt.findOne(500)) {
                    break
                }
            }
            toastLog("已完成全部转发任务");
            finish();
        }
        log("找到任务");
        fInfo("正在做第" + i + "轮转发任务");
        let wen_box = wen_box_slt.findOne();
        let title_flag = 1;
        if(wen_box.child(1).text() == "置顶"){
            toastLog("正在做置顶任务");
            title_flag = 2;
        }
        let wen_share = wen_box.findOne(textContains("gYGPl0wKyfOvgAAAABJRU5ErkJggg=="));
        let wen_title = wen_box.child(title_flag).text();
        let app_Name = wen_box.child(title_flag+1).child(2).text();
        let wz_title = app_Name + ":" + wen_title;
        old_wen.push(wz_title);
        fInfo("文章任务:" + wen_title);
        let share_click = wen_share.parent().click();
        fInfo("点击：" + share_click);
        fInfo("查找WebView");
        fClear();
        fInfo("检查浏览器名称");
        let title_short = wen_title.substr(0, 4);
        log(title_short);
        let cur_act = currentActivity();
        if (cur_act == "com.ucpro.BrowserActivity") {
            fInfo("检测到当前界面为夸克浏览器");
            className("com.uc.webview.export.WebView").waitFor();
            textStartsWith(title_short).waitFor();
            sleep(3000);
            fInfo("点击菜单：" + desc("菜单").findOne().click());
            sleep(500);
            fInfo("点击分享：" + desc("分享").findOne().click());
            sleep(500);
            text("微信好友").findOne().parent().click();
            sleep(500);
            forward(title_short);
        }else if(cur_act == "com.huawei.browser.BrowserMainActivity"){
            fInfo("检测到当前界面为华为浏览器");
            className("com.huawei.android.webview.chromium.hwwebview.HwWebView").waitFor();
            sleep(3000);
            fInfo("点击菜单：" + desc("更多").findOne().click());
            sleep(500);
            fInfo("点击分享：" + id("com.huawei.browser:id/menu_share").text("分享").findOne().click());
            sleep(500);
            text("微信").className("android.widget.Button").findOne().click();
            sleep(500);
            forward(title_short);
        }else{
            fError("未支持当前浏览器，请联系管理员处理");
            sleep(5000);
            finish();
        }
        fClear();
        let hd_times = 0;
        while (!wen_box_slt.exists()) {
            if (hd_times == 3) {
                toastLog("已完成全部推荐转发任务");
                finish();
            }
            swipe(device_w / 2, device_h * 0.8, device_w / 2, device_h * 0.7, 1000);
            sleep(200);
            hd_times++;
        }
        fInfo("保存文章标题到本地已读列表");
        jszs.put("old_wen_list", old_wen);
        wen_box = wen_box_slt.findOne();
    }
}



// let sharebtn = text("gYGPl0wKyfOvgAAAABJRU5ErkJggg==").findOnce(i);
// try {
//     let lisbtn = sharebtn.parent().parent().parent();
//     var listNum = sharebtn.parent().parent().parent().childCount();
// } catch (error) {
//     fInfo("已完成全部任务")
// }
// console.log(listNum);
// let sharetext = sharebtn.parent().parent().parent().child(1).text().substr(0, 4);
// console.log(sharetext);
// if(sharebtn.parent().parent().parent().child(1).text() == "置顶"){
//     console.log("正在做置顶任务");
//     if(listNum == 7){
//         fInfo("已完成该任务");
//         continue;
//     }
//     listNum = listNum - 1;
//     console.log("listNum重置为" + listNum);
//     sharetext = sharebtn.parent().parent().parent().child(2).text().substr(0, 4);
//     console.log("sharetext重置为" + sharetext);
// }

// if ((sharebtn.parent().parent().parent().child(1).text() == "置顶" && listNum == 5)||listNum == 5) {
//     fInfo("已完成全部转发任务");
//     break
// }
// if (!(text("gYGPl0wKyfOvgAAAABJRU5ErkJggg==").findOnce(i).click() == null)) {





//专栏评论上传截图任务
if (zlpl) {
    fInfo("刷新任务列表");
    while (true) {
        swipe(device_w / 2, device_h * 0.5, device_w / 2, device_h * 0.8, 1000);
        sleep(2000);
        if (className("android.view.View").scrollable().findOnce().exists()) {
            className("android.view.View").scrollable().findOnce().child(1).click();
            fInfo("刷新任务列表成功");
            break;
        }
    }
    fInfo("获取转发任务数");
    var unloadbtn = text("0nB8zlsdwXuA6VDgFQvgkzC5KRdEAAAAAElFTkSuQmCC").find();
    if (unloadbtn.empty()) {
        toast("当前没有要做的任务");
        finish();
    } else {
        let unloadNum = unloadbtn.find().size();
        fInfo("当前有" + unloadNum + "大项未作任务");
        let taskNum = text("待进行").findOne().text().slice(3, -1);
        fInfo("共有" + taskNum + "小项上传任务")
    }
    for (let i = 0; i <= unloadNum - 1; i++) {
        fClear();
        text("0nB8zlsdwXuA6VDgFQvgkzC5KRdEAAAAAElFTkSuQmCC").findOnce(i).click()
        fInfo("刷新任务列表")
        swipe(device_w / 2, device_h * 0.6, device_w / 2, device_h * 0.8, 1000);
        className("android.view.View").id("inner-zxz1m").findOne();
        //循环做任务
        for (let j = 0; ; j++) {
            fClear();
            sleep(2000);
            while (true) {
                if (text("待上传").findOne(3000)) {
                    break;
                } else {
                    swipe(device_w / 2, device_h * 0.6, device_w / 2, device_h * 0.8, 1000);
                }
                if (textStartsWith("待进行").findOne().text().slice(3, -1) == "0") {
                    fInfo("已完成全部任务");
                    back();
                    break
                }
            }
            fInfo("正在做第" + (i + 1) + "轮评论任务");
            let mediaflag = text("待上传").findOnce(j).parent().parent().child(0).text();
            let tasktext = text(mediaflag).parent().child(1).text();
            if (mediaflag == "凤凰新闻") {
                凤凰新闻();
            } else if (mediaflag == "网易新闻") {
                网易新闻();
            } else if (mediaflag == "腾讯新闻") {
                腾讯新闻();
            } else if (mediaflag == "今日头条") {
                今日头条();
            } else if (mediaflag == "新浪新闻") {
                新浪新闻();
            } else if (mediaflag == "搜狐新闻") {
                搜狐新闻();
            } else if (mediaflag == "百度") {
                百度();
            }
            sleep(500);
            swipe(device_w / 2, device_h * 0.8, device_w / 2, device_h * 0.6, 1000);
            performGlobalAction(9)//模拟截屏
            app.launchApp('记事本');
            exit_app(mediaflag);//退出APP
            back();
            text(mediaflag).findOne().parent().child(3).click();
            text("上传图片").findOne().click();
            text("最近").waitFor();
            descStartsWith("Screenshot").findOnce().child(0).child(3).click();
            text(tasktext).waitFor();
            text("提交保存").click();


        }

    }
}
if (tjzf) {
    textStartsWith("toutiao").findOne().parent().parent().click();
    sleep(2000);
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
//模拟按键
function performGlobalAction(action) {

    //无障碍服务实例
    let service = com.stardust.autojs.core.accessibility.AccessibilityService.Companion.getInstance();
    if (!service) {
        throw new Error("无障碍服务未开启或异常");
    }
    if (typeof (action) === 'number') {
        return service.performGlobalAction(action);
    }

    // log(android.accessibilityservice.AccessibilityService[action])
    return service.performGlobalAction(android.accessibilityservice.AccessibilityService[action]);
    // const actionUpperCase = action.toUpperCase();
    // return service.performGlobalAction(android.accessibilityservice.AccessibilityService['GLOBAL_ACTION_'+actionUpperCase]);
}
/*******************各种APP评论任务*******************/

//凤凰新闻
function 凤凰新闻() {
    text(mediaflag).findOne().parent().child(2).click();
    desc("立即打开").findOne().click();
    text(tasktext).waitFor();
    sleep(500);
    text("我来说两句").findOne().click();
    text("友善评论，说点好听的～").waitFor();
    setText(tasktext);
    text("发送").findOne().click();
}

//网易新闻
function 网易新闻() {
    text(mediaflag).findOne().parent().child(2).click();
    desc("打开").findOne().parent().parent().parent().click();
    text(tasktext).waitFor();
    sleep(500);
    id("com.netease.newsreader.activity:id/ce3").findOne().click();
    text("写跟帖").waitFor();
    setText(tasktext);
    text("发送").findOne().click();
}

//腾讯新闻
function 腾讯新闻() {
    text(mediaflag).findOne().parent().child(2).click();
    text("获取全网一手热点打开").findOne().click();
    text(tasktext).waitFor();
    sleep(500);
    id("com.tencent.news:id/action_bar_input").desc("发表评论").findOne().click();
    text("优质评论将会被优先展示").waitFor();
    setText(tasktext);
    text("发布").findOne().click();
    id("com.tencent.news:id/action_bar_comment").findOne().click();
}

//今日头条
function 今日头条() {
    text(mediaflag).findOne().parent().child(2).click();
    desc("打开APP").findOne().click();
    text(tasktext).waitFor();
    sleep(500);
    desc("评论").findOne().click();
    text("确认过眼神，你是发评人").parent().click();
    desc("全屏编辑").waitFor();
    setText(tasktext);
    text("发布").findOne().click();
    sleep(1000);
    if (text("勾选「同时转发」有机会被推荐到头条首页").exists()) {
        className("android.widget.LinearLayout").findOnce().click();
    }
    text("发布").findOne().click();
}

/*****************操作函数*****************/
function forward(title_short) {
    text("文件传输助手").findOne().parent().click();
    text("分享").findOne().click();
    text("留在微信").findOne().click();
    text("文件传输助手").findOne().parent().parent().parent().parent().parent().click();
    sleep(1000);
    fClear();
    fInfo("点击浏览");
    textStartsWith(title_short).findOne().parent().parent().parent().click();
    sleep(1000);
    fInfo("等待文章标题显现");
    console.log(textContains(title_short).findOne(5000));
    textStartsWith(title_short).waitFor();
    sleep(1000);
    fInfo("模拟滑动浏览");
    textStartsWith(title_short).scrollForward();//先滑动一下，要不滑不动
    swipe(device_w / 2, device_h * 0.7, device_w / 2, device_h * 0.5, 1500);
    sleep(3000);
    back();
    sleep(2000);
    fClear();
    fInfo("模拟长按卡片")
    let card_centerx = textStartsWith(wen_title).findOne().parent().bounds().centerX();
    let card_centery = textStartsWith(wen_title).findOne().parent().bounds().centerY();
    press(card_centerx, card_centery, 2000);
    fInfo("删除分享卡片");
    text("删除").findOne().parent().parent().click();
    text("确认删除？").waitFor();
    fInfo("删除：" + text("删除").findOne().click());
    sleep(2000);
    fClear();
    app.launchApp('记事本');
    sleep(2000)
}


/*****************结束后配置*****************/
function finish() {
    fInfo("已全部结束");
    // 调回原始音量

    // 取消屏幕常亮
    fInfo("取消屏幕常亮");
    device.cancelKeepingAwake();
    exit_app("记事本");

    // 震动提示
    device.vibrate(500);
    fInfo("十秒后关闭悬浮窗");
    device.cancelVibration();
    sleep(10000);
    console.hide();
    home();
    exit();
}