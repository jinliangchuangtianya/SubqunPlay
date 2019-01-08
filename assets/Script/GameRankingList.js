cc.Class({
    extends: cc.Component,

    properties: {
        rankingScrollView: cc.ScrollView,
        scrollViewContent: cc.Node,
        prefabRankItem: cc.Prefab,
        loadingLabel: cc.Node,//加载文字
        count:cc.Label,
        attrurl:cc.Sprite,
        prevplayer:cc.Node,
    },
    start() {
        this.showPrevPlayer = null; //记录上一次的显示信息
        this.removeChild();
        let _self = this;
        wx.onMessage(data => {
            this.prevplayer.active = false;
            if(data.messageType != undefined){
                if (data.messageType == 0) {//移除排行榜
                    this.removeChild();
                }else if (data.messageType == 1) {//获取好友排行榜
                    _self.fetchFriendData(data.MAIN_MENU_NUM);
                } else if (data.messageType == 3) {//提交得分
                    _self.submitScore(data.MAIN_MENU_NUM, data.score);
                }
                else if(data.messageType == 4){
                     this.removeChild();
                    _self.getprevinfo(data.MAIN_MENU_NUM);
                }
            }
        });
    },
    submitScore(MAIN_MENU_NUM, score) { //提交得分
       console.warn(wx.request)
        wx.getUserCloudStorage({
            // 以key/value形式存储
            keyList: [MAIN_MENU_NUM],
            success: function (getres) {
                console.log('getUserCloudStorage', 'success', getres)

                
                // if (getres.KVDataList.length != 0) {
                //     if (getres.KVDataList[0].value > score) {
                //         return;
                //     }
                // }


                // 对用户托管数据进行写数据操作
                wx.setUserCloudStorage({
                    KVDataList: [{key: MAIN_MENU_NUM, value: "" + score}],
                    success: function (res) {
                        
                        console.log('setUserCloudStorage', 'success', res)
                    },
                    fail: function (res) {
                        console.log('setUserCloudStorage', 'fail')
                    },
                    complete: function (res) {
                        console.log('setUserCloudStorage', 'ok')
                    }
                });
            },
            fail: function (res) {
                console.log('getUserCloudStorage', 'fail')
            },
            complete: function (res) {
                console.log('getUserCloudStorage', 'ok')
            }
        });
        
    },
    removeChild() {
        if(this.node.getChildByName("1000") != null){
            this.node.removeChild(this.node.getChildByName("1000"));
        }
        this.rankingScrollView.node.active = false;
        this.scrollViewContent.removeAllChildren();
        this.loadingLabel.getComponent(cc.Label).string = "玩命加载中...";
        this.loadingLabel.active = true;
    },
    fetchFriendData(MAIN_MENU_NUM) {
        this.removeChild();
        this.rankingScrollView.node.active = true;
        
            wx.getUserInfo({
                openIdList: ['selfOpenId'],
                success: (userRes) => {
                    this.loadingLabel.active = false;
                    //console.log('success', userRes.data)
                    let userData = userRes.data[0];
                    //console.log(userData);
                    //取出所有好友数据
                    wx.getFriendCloudStorage({
                        keyList: [MAIN_MENU_NUM],
                        success: res => {
                            //console.log("wx.getFriendCloudStorage success", res);
                            let data = res.data;
                            data.sort((a, b) => {
                                if (a.KVDataList.length == 0 && b.KVDataList.length == 0) {
                                    return 0;
                                }
                                if (a.KVDataList.length == 0) {
                                    return 1;
                                }
                                if (b.KVDataList.length == 0) {
                                    return -1;
                                }
                                return b.KVDataList[0].value - a.KVDataList[0].value;
                            });
                            for (let i = 0; i < data.length; i++) {
                                var playerInfo = data[i];
                               
                                var item = cc.instantiate(this.prefabRankItem);
                                item.getComponent('RankItem').init(i, playerInfo);
                                this.scrollViewContent.addChild(item);
                               
                            }
                            
                        },
                        fail: res => {
                            console.log("wx.getFriendCloudStorage fail", res);
                            this.loadingLabel.getComponent(cc.Label).string = "数据加载失败，请检测网络，谢谢。";
                        },
                    });
                },
                fail: (res) => {
                    this.loadingLabel.getComponent(cc.Label).string = "数据加载失败，请检测网络，谢谢。";
                }
            });
    },
    getprevinfo(MAIN_MENU_NUM){
        let cueerntIndex = null;
        wx.getUserInfo({
            openIdList: ['selfOpenId'],
            success: (userRes) => {
                let userData = userRes.data[0];
                //console.log(userData);
                //取出所有好友数据
                wx.getFriendCloudStorage({
                    keyList: [MAIN_MENU_NUM],
                    success: res => {
                        //console.log("wx.getFriendCloudStorage success", res);
                        let data = res.data;
                        data.sort((a, b) => {
                            if (a.KVDataList.length == 0 && b.KVDataList.length == 0) {
                                return 0;
                            }
                            if (a.KVDataList.length == 0) {
                                return 1;
                            }
                            if (b.KVDataList.length == 0) {
                                return -1;
                            }
                            return b.KVDataList[0].value - a.KVDataList[0].value;
                        });
                        for (let i = 0; i < data.length; i++) {
                            if(data[i].avatarUrl == userData.avatarUrl){
                                cueerntIndex = i;
                                break;
                            }
                        }
                       
                        if(cueerntIndex - 1 >=0 ){
                            let prevplayer = data[cueerntIndex - 1];
                            if(!!this.showPrevPlayer && this.showPrevPlayer.avatarUrl == prevplayer.avatarUrl){
                                return;
                            }
                            this.showPrevPlayer = prevplayer;
                            cc.loader.load({
                                    url: prevplayer.avatarUrl, type: 'jpg'
                                }, (err, texture) => {
                                    this.attrurl.spriteFrame = new cc.SpriteFrame(texture);
                                    console.warn(parseInt(prevplayer.KVDataList[0].value))
                                    this.count.string = "还有" + (parseInt(prevplayer.KVDataList[0].value) - parseInt(data[cueerntIndex].KVDataList[0].value)) + "下超越他"
                                    if((parseInt(prevplayer.KVDataList[0].value) - parseInt(data[cueerntIndex].KVDataList[0].value)) > 10){
                                        this.prevplayer.active = true;
                                    }
                                    else{
                                        this.prevplayer.active = false;
                                    }
                                    
                                }); 
                            }
                            else{
                                this.prevplayer.active = false;
                            }
                        

                    },
                    fail: res => {
                        console.log("wx.getFriendCloudStorage fail", res);
                        this.loadingLabel.getComponent(cc.Label).string = "数据加载失败，请检测网络，谢谢。";
                    },
                });
            },
            fail: (res) => {
                this.loadingLabel.getComponent(cc.Label).string = "数据加载失败，请检测网络，谢谢。";
            }
        });
    }
});
