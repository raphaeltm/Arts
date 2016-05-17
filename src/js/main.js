var BaseRef = new Firebase(ENV.firebaseURL);
var ClickRef = BaseRef.child('clicks');
var Users = [];
var AuthData = null;
var Person = null;
var Art = null;
var Online = [];

var Mode = 'web';

var CurrentText = null;

/**
 * Set the last edit time for the user.
 */
function timestampUser() {
    if (AuthData)
        BaseRef.child('users').child(AuthData.uid).child('last').set(moment().toISOString());
}

/**
 * Takes a UID and grabs their art text to set it as current.
 * @param uid
 */
function setCurrentText(uid) {
    BaseRef.child('artIs').child(uid).on('value', function (snap) {
        CurrentText = {
            text: snap.val().text,
            x: 0,
            dir: 1
        }
    });
}

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
    $rootScope.setCurrentText = setCurrentText;

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
                $rootScope.Display.getBoth = true;
            }
        });

        // USER STUFF
        var UserClass = $firebaseObject.$extend({
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
             * Get the distance between either another User object, or x/y coordinates.
             * @param c
             * @param y
             * @returns {number}
             */
            dist: function (c, y) {
                if (!c)
                    return;
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
         * Firebase array full of UserClass objects.
         * @type {Function}
         */
        var UserArray = $firebaseArray.$extend({
            $$added: function (snap) {
                if (!snap.val().x) {
                    snap.ref().child('x').set(Math.random());
                    snap.ref().child('y').set(Math.random());
                }
                return new UserClass(snap.ref());
            }
        });
        Users = new UserArray(BaseRef.child('users').orderByChild('last').limitToLast(1000));

        // ART IS???
        Art = $firebaseObject(BaseRef.child('artIs').child(AuthData.uid));
        $rootScope.Art = Art;
        $rootScope.saveArt = function () {
            timestampUser();
            Art.timestamp = moment().toISOString();
            Art.$save();
        };

        // ONLINE
        Online = $firebaseArray(BaseRef.child('users').orderByChild('last').startAt(moment().toISOString().slice(0, 15)));
        $interval(function(){
            Online = $firebaseArray(BaseRef.child('users').orderByChild('last').startAt(moment().toISOString().slice(0, 15)));
        }, 2000);
        $rootScope.Online = Online;
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

var drag = false;

var winT;

function setup() {
    createCanvas(windowWidth, windowHeight);
    winT = (windowWidth + windowHeight) / 8;
}

/**
 * Function to help us loop through the User objects.
 * Takes a callback to run against each User.
 * @param cb
 */
function userLoop(cb) {
    for (var i = 0; i < Users.length; i++) {
        cb(Users[i]);
    }
}

/**
 * Draw connections between User objects. Takes a User and a threshold distance in px.
 * @param u
 * @param thresh
 */
function drawConnections(u, thresh) {
    userLoop(function (user) {
        if (user.$id === u.$id) {
            return;
        }
        if (u.dist(user) < thresh) {
            stroke(100, 220, 250, 120);
            strokeWeight(1);
            line(u.$x(), u.$y(), user.$x(), user.$y());
        }
    })
}

/**
 * Web function builds a web of User objects.
 */
function web() {
    if (AuthData)
        var myNode = Users.$getRecord(AuthData.uid);
    else
        return;
    clear();
    cursor(ARROW);
    textFont('Lato');
    userLoop(function (user) {
        if (AuthData && myNode && myNode.dist(user) < winT)
            drawConnections(user, winT);
    });
    userLoop(function (user) {
        fill(255, 255, 255);
        if (Online.$getRecord(user.$id) !== null) {
            stroke(50, 150, 80);
            strokeWeight(3);
        }
        else {
            stroke(150);
            strokeWeight(1);
        }
        if (AuthData && user.dist(myNode) < winT) {
            var perc = (winT - user.dist(myNode)) / winT;
            stroke(50 + 100 * perc, 100 + 100 * perc, 155 + 100 * perc);
            strokeWeight(1 + 8 * perc);
        }
        if (user.$id === AuthData.uid) {
            stroke(100, 240, 255);
            strokeWeight(8 + Math.abs(Math.sin(frameCount / 30)) * 10);
            if (drag) {
                strokeWeight(10);
            }
        }
        ellipse(user.$x(), user.$y(), 40, 40);
        noStroke();
        fill(100);
        textSize(12);
        if (user.name && AuthData && myNode && myNode.dist(user) < winT)
            var t = text(user.name, user.$x() - 5, user.$y() + 5);

        if (user.dist(mouseX, mouseY) < 20 && (AuthData && myNode.dist(user) < winT)) {
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
            CurrentText = null;
        }
    }
}

/**
 * Draws whatever is defined in the current Mode function.
 */
function draw() {
    if (!AuthData)
        return;
    window[Mode]();
}

/**
 * Pushes new user coordinates up to the Firebase.
 */
function mouseClicked() {
    if (!AuthData)
        return;
    if (AuthData)
        var myNode = Users.$getRecord(AuthData.uid);

    var exists = null;
    userLoop(function (u) {
        if (u.dist(mouseX, mouseY) < 20) {
            exists = u;
        }
    });
    if (exists === null) {
        BaseRef.child('users').child(AuthData.uid).update({
            x: mouseX / windowWidth,
            y: mouseY / windowHeight
        });
        timestampUser();
    }
    else {
        if (exists !== myNode && myNode.dist(exists) < winT) {
            setCurrentText(exists.$id);
        }
    }
}

function mouseDragged() {
    if (!AuthData)
        return;
    var user = null;
    drag = true;
    userLoop(function (u) {
        if (u.dist(mouseX, mouseY) < 50 && u.$id === AuthData.uid) {
            user = u;
        }
    });
    if (!!user) {
        user.x = mouseX / windowWidth;
        user.y = mouseY / windowHeight;
        BaseRef.child('users').child(AuthData.uid).update({
            x: mouseX / windowWidth,
            y: mouseY / windowHeight
        });
    }
}

function mouseReleased() {
    if (!AuthData)
        return;
    if (drag) {
        BaseRef.child('users').child(AuthData.uid).update({
            x: mouseX / windowWidth,
            y: mouseY / windowHeight
        });
        timestampUser();
        drag = false;
    }
}