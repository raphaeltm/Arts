var BaseRef = new Firebase(ENV.firebaseURL);
var ClickRef = BaseRef.child('clicks');
var Clicks = [];

var ArtPotato = angular.module('ArtPotato', [
    'firebase'
]);

ArtPotato.run(function ($firebaseArray) {
    BaseRef.authAnonymously(function () {
        Clicks = $firebaseArray(BaseRef.child('clicks').orderByKey().limitToLast(300));
    });
});

function setup(){
    createCanvas(windowWidth, windowHeight);
}

function draw(){
    clear();
    if(Clicks.length > 0){
        for(var i = Clicks.length-1; i >= 0; i--){
            ellipse(Clicks[i].x, Clicks[i].y, 20,20);
        }
    }
}

function mouseDragged(){
    ClickRef.push({
        x: mouseX,
        y: mouseY
    });
}