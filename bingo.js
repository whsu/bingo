const DIM = 5;
const MAX = 100;
const DICE_MAX = 10;
const CELL_EMPTY = "empty";
const CELL_CORRECT = "correct";
const CELL_INCORRECT = "incorrect";
const CELL_BLOCKED = "blocked";
const STATE_RUNNING = "running";
const STATE_PAUSED = "paused";
const STATE_FINISHED = "finished";

const SECONDS_PER_TURN = 30;
const SECONDS_START = 28;

var card = [];
var marked = [];
var dice = [];
var picksLeft;
var available;
var constraints;
var secondsLeft;
var gameState;
var timerInterval;
var hasBingo;

var $die0 = $("#die0");
var $die1 = $("#die1");
var $startpause = $("#startpause");
var $timer = $("#timer");

function init() {
  for (var i=0; i<DIM; i++) {
    for (var j=0; j<DIM; j++) {
      var $cell = $("#c" + i + j);
      $cell.click(select($cell, i, j));
    }
  }

  gameState = STATE_FINISHED;
  $startpause.click(start);
}

function start() {
  switch (gameState) {
    case STATE_FINISHED:
      hasBingo = false;
      stopTimer();
      generateCard();
      for (var i=0; i<DIM; i++) {
        for (var j=0; j<DIM; j++) {
          var $cell = $("#c" + i + j);
          $cell.text(card[i][j]);
          $cell.removeClass();
          $cell.addClass(CELL_EMPTY);
        }
      }

      initTurn();
      startTimer();
      gameState = STATE_RUNNING;
      $startpause.text("Pause");
      break;
    case STATE_RUNNING:
      stopTimer();
      gameState = STATE_PAUSED;
      $startpause.text("Resume");
      break;
    case STATE_PAUSED:
      startTimer();
      gameState = STATE_RUNNING;
      $startpause.text("Pause");
      break;
  }
}

function generateCard() {
  for (var i=0; i<DIM; i++) {
    card[i] = [];
    marked[i] = [];
    for (var j=0; j<DIM; j++) {
      card[i][j] = Math.floor(Math.random()*MAX) + 1;
      marked[i][j] = false;
    }
  }
}

function initTurn() {
  update();
  rollDice();
  showDice();
  available = [true, true, true];
  constraints = [null, null, null];
  picksLeft = 3;
  secondsLeft = SECONDS_PER_TURN;
  displayTimer();
}

function update() {
  for (var i=0; i<DIM; i++) {
    for (var j=0; j<DIM; j++) {
      var $cell = $("#c" + i + j);
      if ($cell.hasClass(CELL_BLOCKED)) {
        $cell.removeClass(CELL_BLOCKED);
        $cell.addClass(CELL_EMPTY);
      } else if ($cell.hasClass(CELL_INCORRECT)) {
        $cell.removeClass(CELL_INCORRECT);
        $cell.addClass(CELL_BLOCKED);
      }
    }
  }
}

/**
 * Create callback for a cell
 */
function select($cell, i, j) {
  return function() {
    if (card.length === 0 || picksLeft == 0 || secondsLeft > SECONDS_START ||
        !$cell.hasClass(CELL_EMPTY)) {
      return;
    }

    var correct = false;
    var possible = []
    for (var k=0; k<dice.length; k++) {
      if (available[k] && card[i][j] % dice[k] === 0) {
        possible.push(k);
      }
    }

    if (possible.length === 1) {
      var k = possible[0];
      available[k] = false;
      if (constraints[k] !== null) {
        available[constraints[k]] = false;
      }
    } else if(possible.length === 2) {
      var k = possible[0];
      var m = possible[1];
      if (constraints[k] === null && constraints[m] === null) {
        constraints[k] = m;
        constraints[m] = k;
      } else if (constraints[k] === m && constraints[m] === k) {
        available[k] = false;
        available[m] = false;
      }
    }

    $cell.removeClass(CELL_EMPTY);
    if (possible.length > 0) {
      $cell.addClass(CELL_CORRECT);
      marked[i][j] = true;
      hasBingo = win();
      if (hasBingo) {
        $timer.html("<strong>BINGO!</strong>");
        stopTimer();
        gameState = STATE_FINISHED;
        $startpause.text("Start");
      }
    } else {
      $cell.addClass(CELL_INCORRECT);
    }

    picksLeft--;
  }
}

/**
 * Dice functions
 */
function rollDie() {
  return Math.floor(Math.random()*DICE_MAX) + 1;
}

function rollDice() {
  dice[0] = rollDie();
  dice[1] = rollDie();
  dice[2] = dice[0]+dice[1];
}

function showDice() {
  $die0.text(dice[0]);
  $die1.text(dice[1]);
}

/**
 * Timer functions
 */
function startTimer() {
  timerInterval = setInterval(function () {
    secondsLeft--;
    displayTimer();
    if (secondsLeft === 0) {
      initTurn();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function displayTimer() {
  var minutes = Math.floor(secondsLeft/60);
  var seconds = Math.floor(secondsLeft%60);
  $timer.text(minutes + ":" + (seconds<10?'0':'') + seconds);
}

/**
 * Check whether the player has won.
 */
 function win() {
   function markedRow(i) {
     for (var j=0; j<DIM; j++) {
       if (!marked[i][j]) {
         return false;
       }
     }
     return true;
   }

   function markedCol(j) {
     for (var i=0; i<DIM; i++) {
       if (!marked[i][j]) {
         return false;
       }
     }
     return true;
   }

   function markedDiagForward() {
     for (var k=0; k<DIM; k++) {
       if (!marked[k][k]) {
         return false;
       }
     }
     return true;
   }

   function markedDiagBackward() {
     for (var k=0; k<DIM; k++) {
       if (!marked[k][DIM-k-1]) {
         return false;
       }
     }
     return true;
   }

   for (var k=0; k<DIM; k++) {
     if (markedRow(k)) {
       return true;
     }
     if (markedCol(k)) {
       return true;
     }
   }
   return markedDiagForward() || markedDiagBackward();
 }
