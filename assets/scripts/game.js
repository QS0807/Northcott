

cc.Class({
    extends: cc.Component,

    properties: {
        resultSprite: {
            default: null,
            type: cc.Sprite,
        },
        InfoSrite: {
            default: null,
            type: cc.Sprite,
        },
        resultLabel: {
            default: null,
            type: cc.Label,
        },
        chessPrefab: {
            default: null,
            type: cc.Prefab,
        },
        chessList: {
            default: [],
            type: [cc.Node],
        },
        whiteSpriteFrame: {
            default: null,
            type: cc.SpriteFrame,
        },
        blackSpriteFrame: {
            default: null,
            type: cc.SpriteFrame,
        },
        touchChess: {
            default: null,
            type: cc.Node,
            visiable: false,
        },
        piles: [],
        gameState: "black"
    },
    restartGame() {
        cc.director.loadScene('Game');
    },
    menu(){
        cc.director.loadScene('Menu');
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.resultSprite.node.active = false;
        this.gameOver = false;
        console.log("Northcott start");
        
        var self = this;
        // init the chess in each box
        for (var y = 0; y < 6; y++) {
            for (var x = 0; x < 6; x++) {
                // debugger;
                var newChess = cc.instantiate(this.chessPrefab);
                var js = newChess.getComponent('Chess');
                this.node.addChild(newChess);
                newChess.setPosition(cc.v2(x * 100 + 55, y * 100 + 50));
                js.weizhi = y * 6 + x;
                newChess.on(cc.Node.EventType.TOUCH_END, function (event) {
                    // self.touchChess = event.currentTarget;
                    // event.currentTarget.getComponent(cc.Sprite).spriteFrame = self.whiteSpriteFrame;

                    if(event.currentTarget.getComponent(cc.Sprite).spriteFrame === null){
                        var tempJs = event.currentTarget.getComponent('Chess');
                        console.log("weizhi is "+ tempJs.weizhi);
                        if(self.check_black(tempJs.weizhi) && self.check_white(tempJs.weizhi)){
                            console.log("placeable");
                            var oldIndex = self.find_black(tempJs.weizhi);
                            console.log("black index is " + oldIndex);
                            var whiteindex = self.find_white(tempJs.weizhi);
                            console.log("white lies on " + whiteindex);
                            
                            // update pile

                            self.piles_update(tempJs.weizhi, (whiteindex - tempJs.weizhi)/6 - 1);
                            // erase the old one and print the new one
                            
                            event.currentTarget.getComponent(cc.Sprite).spriteFrame = self.blackSpriteFrame;
                            self.replace(oldIndex);
                            self.gameState = "white";
                            if(self.judgeOver()){
                                
                                self.Over();
                            }
                            else{
                                self.ai();
                            }
                        }
                    }
                });

                this.chessList.push(newChess);
            }
        }
        // initialize black and white
        var Rand_B = 0;
        var Rand_W = 0;
        var lower_bound = 0;
        for(var i = 0; i < 6; i++){
            //initialize black
            Rand_B = getRandomInt(0,4);
            var B_Index = i + Rand_B * 6;
            this.chessList[B_Index].getComponent(cc.Sprite).spriteFrame = self.blackSpriteFrame;
            //intialize white
            lower_bound = B_Index / 6;
            Rand_W = getRandomInt(lower_bound, 5);
            var W_Index = i + Rand_W * 6;
            if(B_Index == W_Index){
                W_Index += 6;
            }
            this.chessList[W_Index].getComponent(cc.Sprite).spriteFrame = self.whiteSpriteFrame;

            var space_between = (W_Index - B_Index) / 6 - 1;
            this.piles.push(space_between);
        }
        // fill the piles
        console.log("space between " + this.piles);
        if(self.judgeOver()){
            console.log("you win");
            self.Over();
        }
        
    },
    start() {

    },

    update(dt) {

    },
    // vs computer
    nimsum(){
        var nim = this.piles[0];
        for(let i = 1; i < 6; i++){
            nim ^= this.piles[i];
        }
        console.log("nim sum is " + nim);
        return nim;
    },
    ai(){
        var nimsum = this.nimsum();
        if(nimsum == 0){
            console.log("bailan");
            // ai is not on the winning position, bailan
            // find the first white that does not touch the black and move down by one
            for(let i = 0; i < 6; i++){
                if(this.chessList[this.find_white(i) - 6].getComponent(cc.Sprite).spriteFrame != this.blackSpriteFrame){
                    //not over yet
                    let oldwhite = this.find_white(i) - 6;
                    this.replace(this.find_white(i));
                    this.whiteIt(oldwhite);
                    this.piles[i] = this.piles[i] - 1; 
                    break;
                }
            }
        }
        else{
            for(let i = 0; i < 6; i++){
                if(this.piles[i] > (this.piles[i] ^ nimsum)){
                    this.piles[i] = (this.piles[i] ^ nimsum);
                    let tempwhite = this.find_white(i);
                    this.replace(tempwhite);
                    this.whiteIt(this.find_black(i) + 6 * (this.piles[i] + 1));
                    break;
                }
            }

        }
        this.gameState = "black";
        console.log("piles " + this.piles);
        console.log("nim sum " + this.nimsum());
        if(this.judgeOver()){
            this.showResult();
            this.Over();
        }
    },
    // helper functions
    showResult(){
        if(this.gameState == "white"){
            console.log("你赢了");
        }
        else{
            console.log("你输了");
            this.resultLabel.string = "再试一次吧";
        }
    },
    whiteIt(index){
        this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.whiteSpriteFrame;
    },
    piles_update(index, space){
        // update piles according to the chess list
        console.log("pos is " + index + " space is " + space);
        this.piles[index % 6] = space;
        console.log("pile " + this.piles);
    },
    check_black(index){
        // Placeable if and only if black chess is lower than the index in this col
        var cap = index / 6;
        for(var i = 0; i <= cap; i++){
            if(this.chessList[index - 6 * i].getComponent(cc.Sprite).spriteFrame == this.blackSpriteFrame){
                return true;
            }
        }
        return false;
    },
    check_white(index){
        // Placeable if and only if white chess is higher than the index in this col
        var shoe = index / 6;
        for(var i = 0; i < 6 - shoe; i++){
            if(this.chessList[index + 6 * i].getComponent(cc.Sprite).spriteFrame == this.whiteSpriteFrame){
                return true;
            }
        }
        return false;
    },
    find_black(index){
        var col = index % 6
        for(var i = 0; i < 6; i++){
            if(this.chessList[col + 6 * i].getComponent(cc.Sprite).spriteFrame == this.blackSpriteFrame){
                return col + 6 * i;
            }
        }
        return -1;
    },
    find_white(index){
        var col = index % 6;
        for(var i = 0; i < 6; i++){
            if(this.chessList[col + 6 * i].getComponent(cc.Sprite).spriteFrame == this.whiteSpriteFrame){
                return col + 6 * i;
            }
        }
    },
    replace(oldIndex){
        this.chessList[oldIndex].getComponent(cc.Sprite).spriteFrame = null;
    },

    judgeOver(){
        for(var i = 0; i < this.chessList.length; i++){
            if(this.chessList[i].getComponent(cc.Sprite).spriteFrame == this.blackSpriteFrame){
                if(this.chessList[i + 6].getComponent(cc.Sprite).spriteFrame != this.whiteSpriteFrame){
                    //not over yet
                    return false;
                }
            }
        }
        return true;
    },
    Over(){
        this.resultSprite.node.active = true;
    },
    InfoPanelOpen(){
        this.InfoSrite.node.active = true;
    },
    InfoPanelClose(){
        this.InfoSrite.node.active = false;
    },

});
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}