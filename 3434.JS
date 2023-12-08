var jszs = storages.create("jszs");//加载存储
let old_wen = jszs.get("old_wen_list", []);
let wen_box_slt = className("android.view.View").depth(13).filter(function (l) {
    //   let share = l.findOne(textContains("gYGPl0wKyfOvgAAAABJRU5ErkJggg=="));
    //   console.log(share)
    let titleName = l.child(1).text();
    // let appName = l.child(2).child(2);
    // console.log(appName);
    // let title = titleName + ":" + appName;
    console.log(title)
    if (title) {
        return title != "下拉刷新" && title != "没有更多数据" && old_wen.indexOf(title) == -1;
    }
    return false;
});