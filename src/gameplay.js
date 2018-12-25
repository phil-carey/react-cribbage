export default class GamePlay {
  constructor() {
    this.state = {
      moveNdx: 0
    };
  }

  clone(obj) {
    var copy;
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    if (obj instanceof Date) {
      copy = new Date();
      copy.setTime(obj.getTime());
      return copy;
    }

    if (obj instanceof Array) {
      copy = [];
      for (var i = 0, len = obj.length; i < len; i++) {
        copy[i] = this.clone(obj[i]);
      }
      return copy;
    }

    if (obj instanceof Object) {
      copy = {};
      for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = this.clone(obj[attr]);
      }
      return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
  }

  getFirstUnplayedIndex(hand) {
    var firstNdx = hand.length - 1
    for (var i = 0; i < hand.length; i++) {
      if (hand[i].played === false) {
        firstNdx = i
        break
      }
    }
    return firstNdx
  }

  getLastPlayedIndex(hand) {
    var lastNdx = hand.length - 1
    for (var i = 0; i < hand.length; i++) {
      lastNdx = (hand[i].played === true) ? i : lastNdx
    }
    return lastNdx
  }

  opponentChoosesCardToPlay(gameHand, yourHand) {
    // TODO: add intelligence regarding which card to play
    return this.getLastPlayedIndex(yourHand) + 1
  }

  opponentDiscards(hand) {
    // TODO: add intelligent discarding for opponent
    this.discardCard(hand, 0)
    this.advancePlay()
    this.discardCard(hand, 1)
    this.advancePlay()
    return hand
  }

  getLastUnplayedIndex(hand) {
    var lastNdx = hand.length - 1
    for (var i = 0; i < hand.length; i++) {
      lastNdx = (hand[i].played === false) ? i : lastNdx
    }
    return lastNdx
  }

  copyCard(srcCard, destHand) {
    // copy the provided card to the first unplayed spot in the desthand
    var changedCard
    changedCard = this.clone(srcCard)
    changedCard.played = true

    var freeNdx = this.getFirstUnplayedIndex(destHand)

    destHand[freeNdx] = changedCard
  }

  currentTotal(gameHand) {
    var values = this.getValues(gameHand.slice(1, gameHand.length))
    var ranks = this.getRanks(values)
    var simplified = this.simplifyRanks(ranks)
    var result = 0

    for (var i = 0; i < simplified.length; i++) {
      if (result + simplified[i] > 31) {
        result = simplified[i]
      } else {
        result += simplified[i]
      }
    }
    return result
  }

  playCard(hand, cardNdx) {
    var changedCard
    changedCard = this.clone(hand[cardNdx])
    changedCard.played = true
    changedCard.faceup = true
    hand[cardNdx] = changedCard

    return hand
  }

  discardCard(hand, cardNdx) {
    var changedCard

    changedCard = this.clone(hand[cardNdx])
    changedCard.faceup = false
    changedCard.played = true
    changedCard.discarded = true

    hand[cardNdx] = changedCard

    return hand
  }

  flipCard(hand, cardNdx) {
    var changedCard

    changedCard = this.clone(hand[cardNdx])
    changedCard.faceup = !changedCard.faceup

    hand[cardNdx] = changedCard
    return hand
  }

  calculateCardoffsets(card) {
    // CDHS, A123...K 153x98
    var col = card.slice(0, 1)
    var row = card.slice(1, 2)
    switch (col) {
      case 'A': col = 0; break
      case 'T': col = 9; break
      case 'J': col = 10; break
      case 'Q': col = 11; break
      case 'K': col = 12; break
      case 'B': col = 2; break
      case 'X': col = 0; break
      default: col = (+col) - 1; break
    }
    switch (row) {
      case "C": row = 0; break
      case "D": row = 1; break
      case "H": row = 2; break
      case "S": row = 3; break
      case 'B': row = 4; break
      case 'X': row = 4; break
      default: row = 4; break
    }
    var result = {}
    result.top = row * (-154)
    result.left = col * (-98)
    return result
  }

  calculateWinner(state) {
    return null;
  }

  shuffle(a) {
    var j, x, i
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1))
      x = a[i]
      a[i] = a[j]
      a[j] = x
    }
    return a
  }

  createDeck() {
    // construct and return a shuffled deck
    var suits = "CDHS"
    var ranks = "A23456789TJQK"
    var deck = new Array(52), i = 0
    for (var row = 0; row < 4; row++) {
      var suit = suits.slice(row, row + 1)
      for (var col = 0; col < 13; col++) {
        var rank = ranks.slice(col, col + 1)
        deck[i++] = rank + suit
      }
    }

    return this.shuffle(deck);
  }

  dealCard(value, faceup, played) {
    var card = { value: value, faceup: faceup, played: played, discarded: false }
    return card
  }

  dealHand(deck, faceup, from) {
    var hand = new Array(6)
    for (var i = 0; i < 6; i++) {
      hand[i] = this.dealCard(deck[from + i], faceup, false)
    }
    return hand
  }

  compareCards(a, b) {
    var order = "A23456789TJQKB"
    var apos = order.indexOf(a.value.substring(0, 1))
    var bpos = order.indexOf(b.value.substring(0, 1))

    if (apos < bpos) return -1
    if (apos > bpos) return 1

    order = "SHCDB"
    apos = order.indexOf(a.value.substring(1, 2))
    bpos = order.indexOf(b.value.substring(1, 2))
    if (apos < bpos) return -1
    if (apos > bpos) return 1

    return 0
  }

  compareCardValues(a, b) {
    var order = "A23456789TJQKB"
    var apos = order.indexOf(a.substring(0, 1))
    var bpos = order.indexOf(b.substring(0, 1))

    if (apos < bpos) return -1
    if (apos > bpos) return 1

    order = "SHCDB"
    apos = order.indexOf(a.substring(1, 2))
    bpos = order.indexOf(b.substring(1, 2))
    if (apos < bpos) return -1
    if (apos > bpos) return 1

    return 0
  }

  getInstruction(phase) {
    var instruction
    switch (phase) {
      case 'gamePlayComplete':
        instruction = 'Game play comlplete'
        break

      case 'scoreNonDealerHand':
        instruction = 'Click to score the non dealer hand'
        break

      case 'scoreDealerHand':
        instruction = 'Click to score the dealer hand'
        break

      case 'scoreCribHand':
        instruction = 'Click to score score the crib'
        break

      case 'handCompleted':
        instruction = 'Click to start a new hand'
        break

      case 'playing':
        instruction = 'Click a card to play it'
        break

      case 'discarding':
      case 'unstarted':
      default:
        instruction = 'Select 2 for the crib'
        break
    }
    //console.log( "getInstruction  this.state.moveNdx=%d phase=%s",  this.state.moveNdx, phase )
    return instruction
  }

  advancePlay() {
    ++this.state.moveNdx
  }

  getPhase() {
    var phase = undefined
    switch (this.state.moveNdx) {
      case 0:
        phase = 'unstarted'
        break

      case 1:
        //case 2:
        //case 3:
        phase = 'discarding'
        break

      case 12:
        // all cards have been played
        phase = 'gamePlayComplete'
        break

      case 13:
        // all cards have been played, calculate score for the hand which is not the dealer ( they count first )
        phase = 'scoreNonDealerHand'
        break

      case 14:
        // all cards have been played, calculate score for the hand which is the dealer
        phase = 'scoreDealerHand'
        break

      case 15:
        // all cards have been played, calculate score for the crib hand
        phase = 'scoreCribHand'
        break

      default:
        if (this.state.moveNdx < 15) phase = 'playing'
        else phase = 'handCompleted'
        // do nothing
        break
    }
    return phase
  }

  clearHand(hand, startFrom) {
    for (var i = startFrom; i < hand.length; i++) {
      hand[i] = this.dealCard('BB', false, false)
    }
    return hand
  }

  showHand(hand) {
    for (var i = 1; i < hand.length; i++) {
      hand[i].played = !(hand[i].played && !hand[i].discarded)
    }
    return hand
  }

  copyDiscardsToGameHand(oppoHand, yourHand, gameHand) {
    var i, card

    var cribHand = new Array(4)
    for (i = 0; i < cribHand.length; i++) {
      cribHand[i] = this.dealCard('BB', false, false)
    }

    for (i = 0; i < oppoHand.length; i++) {
      if (oppoHand[i].discarded === true) {
        card = this.clone(oppoHand[i])
        card.discarded = false
        card.played = false
        card.faceup = true
        this.copyCard(card, cribHand)
      }
      if (yourHand[i].discarded === true) {
        card = this.clone(yourHand[i])
        card.discarded = false
        card.played = false
        card.faceup = true
        this.copyCard(card, cribHand)
      }
    }
    cribHand.sort(this.compareCards)
    for (i = 0; i < cribHand.length; i++) {
      this.copyCard(cribHand[i], gameHand)
    }
    return gameHand
  }

  getCombinations(arr, minlen, maxlen) {
    // given an array of items, generate every combination of length >= minlen and length <= maxlen
    let i, j
    let result = []
    let combinations = Math.pow(2, arr.length)

    for (i = 0; i < combinations; i++) {
      let temp = []

      for (j = 0; j < arr.length; j++) {
        if ((i & Math.pow(2, j))) {
          temp.push(arr[j])
        }
      }
      if (temp.length >= minlen && temp.length <= maxlen) {
        result.push(temp)
      }
    }
    return result
  }

  getRank(value) {
    var order = "BA23456789TJQK"
    return order.indexOf(value.substring(0, 1))
  }

  getRanks(values) {
    var ranks = []

    for (var j = 0; j < values.length; j++) {
      ranks.push(this.getRank(values[j]))
    }

    return ranks
  }

  getSuit(value) {
    return value.substring(1, 2)
  }

  getSuits(values) {
    var suits = []

    for (var j = 0; j < values.length; j++) {
      suits.push(this.getSuit(values[j]))
    }

    return suits
  }

  getValues(hand) {
    var values = []

    for (var j = 0; j < hand.length; j++) {
      values.push(hand[j].value)
    }

    return values
  }

  simplifyRanks(ranks) {
    var simpleRanks = []
    // strip out blank cards or 0's and convert face cards to 10's

    for (var i = 0; i < ranks.length; i++) {
      if (ranks[i] > 0) {
        simpleRanks.push(Math.min(ranks[i], 10))
      }
    }
    return simpleRanks
  }

  isInSequence(combo) {
    for (var i = 1; i < combo.length; i++) {
      if (combo[i] !== combo[i - 1] + 1) return false
    }
    return true
  }

  scoreCribHand(handA, handB, cutCard) {
    // create a hand from the discards, and score that
    var i
    var cribHand = new Array(4)
    for (i = 0; i < cribHand.length; i++) {
      cribHand[i] = this.dealCard('BB', false, false)
    }

    for (i = 0; i < handA.length; i++) {
      if (handA[i].discarded === true) {
        this.copyCard(this.clone(handA[i]), cribHand)
      }
      if (handB[i].discarded === true) {
        this.copyCard(this.clone(handB[i]), cribHand)
      }
    }
    cribHand.sort(this.compareCards)
    return this.scoreHand(cribHand, cutCard)
  }

  scorePlayHand(hand, cutCard) {
    // create a hand with only the non-discarded cards in it, and score that
    var playHand = new Array(4)
    for (var i = 0; i < playHand.length; i++) {
      playHand[i] = this.dealCard('BB', false, false)
    }

    for (i = 0; i < hand.length; i++) {
      if (hand[i].discarded === false) {
        this.copyCard(this.clone(hand[i]), playHand)
      }
    }
    playHand.sort(this.compareCards)
    return this.scoreHand(playHand, cutCard)
  }

  scoreHand(hand, cutCard) {
    var points = 0, cutSuit = 'B'
    var values = this.getValues(hand)

    if (cutCard !== undefined) {
      values.push(cutCard.value)
      cutSuit = this.getSuit(cutCard.value)
    }

    values.sort(this.compareCardValues)

    var suits = this.getSuits(values)
    var ranks = this.getRanks(values)

    //console.log( 'suits = ', suits )
    //console.log( 'ranks = ', ranks )

    // score flush, count how many of the same suit, if 4, see if it excludes the cut card
    var spades = 0, hearts = 0, clubs = 0, diamonds = 0
    for (var i = 0; i < suits.length; i++) {
      switch (suits[i]) {
        case 'S': spades++; break
        case 'H': hearts++; break
        case 'C': clubs++; break
        case 'D': diamonds++; break
        default: break
      }
    }

    // Note: we are coding to expect that we score runs for hands of up to 5 cards max!
    var flushPoints = 0
    if (spades === 4 && cutSuit !== 'S') flushPoints = 4
    if (spades === 5) flushPoints = 5

    if (hearts === 4 && cutSuit !== 'H') flushPoints = 4
    if (hearts === 5) flushPoints = 5

    if (clubs === 4 && cutSuit !== 'C') flushPoints = 4
    if (clubs === 5) flushPoints = 5

    if (diamonds === 4 && cutSuit !== 'D') flushPoints = 4
    if (diamonds === 5) flushPoints = 5

    points += flushPoints

    // get combinations of lengths 2 through hand length and use them to find runs, pairs, etc
    var combos = this.getCombinations(ranks, 2, ranks.length)
    //console.log( "combos = ", combos )

    // score 15's
    var fifteens = 0
    for (i = 0; i < combos.length; i++) {
      var simpleRanks = this.simplifyRanks(combos[i])
      if (simpleRanks.reduce((a, b) => a + b, 0) === 15) {
        //console.log( "combos[i] = ", combos[i] )
        //console.log( "15 - simpleRanks = ", simpleRanks )
        ++fifteens
      }
    }
    points += 2 * fifteens

    // score pairs, trips, quads
    var pairs = 0, royalPairs = 0, doubleRoyalPairs = 0
    for (i = 0; i < ranks.length; i++) {
      if (i < ranks.length - 1 && ranks[i] === ranks[i + 1]) {
        if (i < ranks.length - 2 && ranks[i + 1] === ranks[i + 2]) {
          if (i < ranks.length - 3 && ranks[i + 2] === ranks[i + 3]) {
            ++doubleRoyalPairs
            i += 3
          } else {
            ++royalPairs
            i += 2
          }
        } else {
          ++pairs
          i += 1
        }
      }
    }
    points += pairs * 2
    points += royalPairs * 6
    points += doubleRoyalPairs * 12

    // score runs, on combos which will include the input hand itself
    var runs3 = 0, runs4 = 0, runs5 = 0
    for (i = 0; i < combos.length; i++) {
      var combo = combos[i]
      switch (combo.length) {
        case 3: if (this.isInSequence(combo)) runs3++; break;
        case 4: if (this.isInSequence(combo)) runs4++; break;
        case 5: if (this.isInSequence(combo)) runs5++; break;
        default: break;
      }
    }

    // now enforce sequence non-duplication/overlap rules
    if (runs5 !== 0) {
      points += 5 * runs5
      runs4 = runs3 = 0
    } else if (runs4 !== 0) {
      points += 4 * runs4
      runs3 = 0
    } else {
      points += 3 * runs3
    }

    return this.createScore(points, fifteens, flushPoints, runs3, runs4, runs5, pairs, royalPairs, doubleRoyalPairs, values)
  }

  createScore(points, fifteens, flushPoints, runs3, runs4, runs5, pairs, royalPairs, doubleRoyalPairs, values) {
    return {
      points: points,
      fifteens: fifteens,
      flushPoints: flushPoints,
      runs3: runs3,
      runs4: runs4,
      runs5: runs5,
      pairs: pairs,
      royalPairs: royalPairs,
      doubleRoyalPairs: doubleRoyalPairs,
      values: values
    }
  }

  createHand(values) {
    var score = this.createScore(0, 0, 0, 0, 0, 0, 0, 0, 0, values)
    return {
      score: score,
      cutPoints: 0,
      playPoints: 0
    }
  }

  setHandScore(whichHand, score) {
    this.state[whichHand].score = score
  }

  getHandPoints(whichHand) {
    // TODO: returns the total of cutPoints+playPoints+handScore.points
    return this.state[whichHand].score.points
  }

  newGame() {
    var deck = this.createDeck(), i
    var oppoHand = this.dealHand(deck, false, 0)
    oppoHand.sort(this.compareCards)

    //console.log( "getCombinations oppoHand ",  this.getCombinations( oppoHand, 4, 4 ) )

    var yourHand = this.dealHand(deck, true, 6)
    yourHand.sort(this.compareCards)

    var cutCard = this.dealCard('BB', false, false)

    var gameHand = new Array(9)
    for (i = 1; i < gameHand.length; i++) {
      gameHand[i] = cutCard
    }
    // deal the cut card, mark it as played
    gameHand[0] = this.dealCard(deck[12], false, true)

    // deal blank placeholders into the crib
    var cribHand = new Array(4)
    for (i = 0; i < cribHand.length; i++) {
      cribHand[i] = this.dealCard('BB', false, false)
    }

    this.state.moveNdx = 0
    this.state.yourHand = this.createHand(this.getValues(yourHand))
    this.state.oppoHand = this.createHand(this.getValues(oppoHand))

    return {
      oppoHand: oppoHand,
      yourHand: yourHand,
      gameHand: gameHand,
      cribHand: cribHand,
    }
  }
}
