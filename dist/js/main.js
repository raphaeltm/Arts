var BaseRef = new Firebase(ENV.firebaseURL);
var ClickRef = BaseRef.child('clicks');
var Clicks = [];
var AuthData = null;
var Person = null;
var Art = null;

/**
 * SOME ANGULAR STUFF AHEAD
 */

var ArtPotato = angular.module('ArtPotato', [
    'firebase'
]);
ArtPotato.run(function ($firebaseArray, $firebaseObject, $rootScope, $interval) {
    $rootScope.Display = {};
    $rootScope.moment = moment;

    function saveAuth(token) {
        sessionStorage.token = token;
    }

    function loadAuth() {
        return sessionStorage.token || null;
    }

    function success(authData) {
        saveAuth(authData.token);
        AuthData = authData;

        // PEOPLE STUFF
        $rootScope.Display.getName = false;
        Person = $firebaseObject(BaseRef.child('users').child(AuthData.uid));
        $rootScope.Person = Person;
        Person.$loaded().then(function () {
            if (!Person.name) {
                $rootScope.Display.getName = true;
            }
        });

        // CLICK STUFF
        var ClickClass = $firebaseObject.$extend({
            $x: function () {
                return this.x * windowWidth;
            },
            $y: function () {
                return this.y * windowHeight;
            },
            dist: function (c, y) {
                var x;
                if (typeof c === "number" && typeof y == "number") {
                    x = c;
                }
                else {
                    x = c.$x();
                    y = c.$y();
                }
                return Math.sqrt(Math.pow(this.$x() - x, 2) + Math.pow(this.$y() - y, 2))
            }
        });
        var ClickArray = $firebaseArray.$extend({
            $$added: function (snap) {
                return new ClickClass(snap.ref());
            },
            $$updated: function (snap) {
                // return new ClickClass(this.$ref().child(snap.key()));
            }
        });
        Clicks = new ClickArray(BaseRef.child('clicks').orderByKey().limitToLast(60));

        // TIME STUFF
        $rootScope.userTime = $firebaseObject(BaseRef.child('baseTimes').child(AuthData.uid));
        $rootScope.userTime.$loaded().then(function () {
            if (!$rootScope.userTime.time) {
                $rootScope.userTime.time = moment().add(7, 'days').toISOString();
                $rootScope.userTime.$save();
            }
            $interval(function () {
                $rootScope.timeLeft = moment.duration(moment($rootScope.userTime.time).diff(moment())).humanize();
                $rootScope.seconds = Math.floor(moment($rootScope.userTime.time).diff(moment()) / 1000);
            }, 250);
        });

        // ART IS???
        Art = $firebaseObject(BaseRef.child('artIs').child(AuthData.uid));
        $rootScope.Art = Art;
        $rootScope.saveArt = function () {
            Art.timestamp = moment().toISOString();
            Art.$save();
        };
    }

    function anonAuth() {
        BaseRef.authAnonymously(function (error, authData) {
            if (!error) {
                success(authData);
            }
        })
    }

    var token = loadAuth();

    if (token) {
        BaseRef.authWithCustomToken(token, function (error, authData) {
            if (!error) {
                success(authData);
            }
            else {
                anonAuth();
            }
        });
    }
    else {
        anonAuth();
    }
});

/**
 * P5JS STUFF AHEAD
 */

function setup() {
    createCanvas(windowWidth, windowHeight);
}

function clickLoop(cb) {
    for (var i = 0; i < Clicks.length; i++) {
        cb(Clicks[i]);
    }
}

function drawConnections(c, thresh) {
    clickLoop(function (click) {
        if (click.$id === c.$id) {
            return;
        }
        if (c.dist(click) < thresh) {
            stroke(150, 100);
            strokeWeight(1);
            line(c.$x(), c.$y(), click.$x(), click.$y());
        }
    })
}

function draw() {
    clear();
    clickLoop(function (click) {
        var thresh = windowWidth + windowHeight;
        thresh = thresh / 10;
        drawConnections(click, thresh);
    });
    clickLoop(function (click) {
        fill(255, 255, 255);
        stroke(150);
        strokeWeight(1);
        ellipse(click.$x(), click.$y(), 40, 40);
        noStroke();
        fill(100);
        var t = text(click.name, click.$x() - 5, click.$y() + 5);
    });
}

function mouseClicked() {
    var exists = null;
    clickLoop(function (c) {
        if (c.dist(mouseX, mouseY) < 30) {
            exists = c;
        }
    });
    if (exists === null) {
        ClickRef.push({
            x: mouseX / windowWidth,
            y: mouseY / windowHeight,
            name: Person.name,
            uid: AuthData.uid
        });
    }
    else {
        console.log(exists.uid);
    }
}