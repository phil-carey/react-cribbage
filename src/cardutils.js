export default class CardUtils {

  createDeck() {
    // construct and return a shuffled deck
    var suits = "CDHS"
    var ranks = "A23456789TJQK"
    var deck = [], i = 0
    for (var row = 0; row < 4; row++) {
      var suit = suits.slice(row, row + 1)
      for (var col = 0; col < 13; col++) {
        var rank = ranks.slice(col, col + 1)
        deck[i++] = rank + suit
      }
    }

    return this.shuffle(deck)
  }

  dealCard(value, faceup, played) {
    return { value: value, faceup: faceup, played: played, discarded: false }
  }

  dealHand(deck, faceup, from) {
    var hand = []
    for (var i = 0; i < 6; i++) {
      hand[i] = this.dealCard(deck[from + i], faceup, false)
    }
    return hand
  }

  compareCards(a, b) {
    var order = "A23456789TJQKB"
    var apos = order.indexOf(a.value.slice(0, 1))
    var bpos = order.indexOf(b.value.slice(0, 1))

    if (apos < bpos) return -1
    if (apos > bpos) return 1

    order = "SHCDB"
    apos = order.indexOf(a.value.slice(1, 2))
    bpos = order.indexOf(b.value.slice(1, 2))
    if (apos < bpos) return -1
    if (apos > bpos) return 1

    return 0
  }

  compareCardValues(a, b) {
    var order = "A23456789TJQKB"
    var apos = order.indexOf(a.slice(0, 1))
    var bpos = order.indexOf(b.slice(0, 1))

    if (apos < bpos) return -1
    if (apos > bpos) return 1

    order = "SHCDB"
    apos = order.indexOf(a.slice(1, 2))
    bpos = order.indexOf(b.slice(1, 2))
    if (apos < bpos) return -1
    if (apos > bpos) return 1

    return 0
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
    return order.indexOf(value.slice(0, 1))
  }

  getRanks(values) {
    var ranks = []

    for (var j = 0; j < values.length; j++) {
      ranks[j] = this.getRank(values[j])
    }

    return ranks
  }

  getSuit(value) {
    return value.slice(1, 2)
  }

  getSuits(values) {
    var suits = []

    for (var j = 0; j < values.length; j++) {
      suits[j] = this.getSuit(values[j])
    }

    return suits
  }

  getValues(hand) {
    var values = []

    for (var j = 0; j < hand.length; j++) {
      values[j] = hand[j].value
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

    // score 15's
    var fifteens = 0
    for (i = 0; i < combos.length; i++) {
      if (this.simplifyRanks(combos[i]).reduce((a, b) => a + b, 0) === 15) {
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
        case 3: if (this.isInSequence(combo)) runs3++; break
        case 4: if (this.isInSequence(combo)) runs4++; break
        case 5: if (this.isInSequence(combo)) runs5++; break
        default: break
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

  // These are not really just card utilities, they are general purpose
  clone(obj) {
    var copy;
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    if (obj instanceof Date) {
      copy = new Date()
      copy.setTime(obj.getTime());
      return copy
    }

    if (obj instanceof Array) {
      copy = []
      for (var i = 0, len = obj.length; i < len; i++) {
        copy[i] = this.clone(obj[i]);
      }
      return copy
    }

    if (obj instanceof Object) {
      copy = {};
      for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = this.clone(obj[attr]);
      }
      return copy
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
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
}

