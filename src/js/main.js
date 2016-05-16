var BaseRef = new Firebase(ENV.firebaseURL);
var ClickRef = BaseRef.child('clicks');
var Clicks = [];
var AuthData = null;
var Person = null;
var Art = null;

var Mode = 'web';

var CurrentText = null;

/**
 * SOME ANGULAR STUFF AHEAD
 */

var ArtPotato = angular.module('ArtPotato', [
    'firebase'
]);

/**
 * All this because I'd rather use the AngularFire stuff than straight up Firebase.
 */
ArtPotato.run(function ($firebaseArray, $firebaseObject, $rootScope, $interval) {
    $rootScope.Display = {};
    $rootScope.moment = moment;
    $rootScope.getMode = function () {
        return Mode;
    };

    /**
     * Save the auth token so we can remember this person for next time.
     * @param token
     */
    function saveAuth(token) {
        sessionStorage.token = token;
    }

    /**
     * Load the auth token so we can authenticate the person we have remembered.
     * @returns {*|null}
     */
    function loadAuth() {
        return sessionStorage.token || null;
    }

    /**
     * This is what we do once the person is authed.
     * @param authData
     */
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
            /**
             * X pos on the screen (as opposed to the relative position which is stored in Firebase.
             * @returns {number}
             */
            $x: function () {
                if (!this.xsine) {
                    this.xsine = Math.random() * 100;
                }
                return this.x * windowWidth + (Math.sin((frameCount + this.xsine) / 25) * 10);
            },
            /**
             * Y pos on the screen (as opposed to the relative position which is stored in Firebase.
             * @returns {number}
             */
            $y: function () {
                if (!this.ysine) {
                    this.ysine = Math.random() * 100;
                }
                return this.y * windowHeight + (Math.sin((frameCount + this.ysine) / 25) * 10);
            },
            /**
             * Get the distance between either another Click object, or x/y coordinates.
             * @param c
             * @param y
             * @returns {number}
             */
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
        /**
         * Firebase array full of ClickClass objects.
         * @type {Function}
         */
        var ClickArray = $firebaseArray.$extend({
            $$added: function (snap) {
                return new ClickClass(snap.ref());
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

    /**
     * Auth anonymously and then run success function.
     */
    function anonAuth() {
        BaseRef.authAnonymously(function (error, authData) {
            if (!error) {
                success(authData);
            }
        })
    }

    /**
     * Load the auth token from last time.
     * @type {*|null}
     */
    var token = loadAuth();

    /**
     * If we have a token, we try to auth, if it fails, we run the anonAuth function, which will give us a new,
     * valid token.
     */
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
 * COOL VIZ TO FOLLOW!!!!
 */

function setup() {
    createCanvas(windowWidth, windowHeight);
}

/**
 * Function to help us loop through the Click objects.
 * Takes a callback to run against each Click.
 * @param cb
 */
function clickLoop(cb) {
    for (var i = 0; i < Clicks.length; i++) {
        cb(Clicks[i]);
    }
}

/**
 * Draw connections between Click objects. Takes a Click and a threshold distance in px.
 * @param c
 * @param thresh
 */
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

/**
 * Web function builds a web of click objects.
 */
function web() {
    clear();
    cursor(ARROW);
    textFont('Lato');
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
        textSize(12);
        var t = text(click.name, click.$x() - 5, click.$y() + 5);

        if (click.dist(mouseX, mouseY) < 20) {
            cursor(HAND);
        }
    });
    if (CurrentText) {
        fill(0);
        noStroke();
        textSize(50);
        var tW = textWidth(CurrentText.text);
        text(CurrentText.text, windowWidth - CurrentText.x, windowHeight / 2 - 20);
        CurrentText.x += 4;
        if (CurrentText.x > tW + windowWidth) {
            CurrentText.x = -10;
        }
    }
}

/**
 * Draws whatever is defined in the current Mode function.
 */
function draw() {
    window[Mode]();
}

/**
 * Pushes a new click up to the Firebase.
 */
function mouseClicked() {
    var exists = null;
    clickLoop(function (c) {
        if (c.dist(mouseX, mouseY) < 20) {
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
        BaseRef.child('artIs').child(AuthData.uid).on('value', function (snap) {
            console.log(snap.val());
            CurrentText = {
                text: snap.val().text,
                x: 0,
                dir: 1
            }
        });
    }
}