var CardUtils = require('./cardutils.js').default;
var utils = new CardUtils();

export default class GamePlay {
  constructor() {
    this.state = {
      moveNdx: 0
    };
  }

  scoreCribHand(handA, handB, cutCard) {
    // create a hand from the discards, and score that
    var i
    var cribHand = []
    for (i = 0; i < 4; i++) {
      cribHand[i] = utils.dealCard('BB', false, false)
    }

    for (i = 0; i < handA.length; i++) {
      if (handA[i].discarded === true) {
        this.copyCard(utils.clone(handA[i]), cribHand)
      }
      if (handB[i].discarded === true) {
        this.copyCard(utils.clone(handB[i]), cribHand)
      }
    }
    cribHand.sort(utils.compareCards)
    var result = utils.scoreHand(cribHand, cutCard)
    return result
  }

  scorePlayHand(hand, cutCard) {
    // create a hand with only the non-discarded cards in it, and score that
    var playHand = []
    for (var i = 0; i < 4; i++) {
      playHand[i] = utils.dealCard('BB', false, false)
    }

    for (i = 0; i < hand.length; i++) {
      if (hand[i].discarded === false) {
        this.copyCard(utils.clone(hand[i]), playHand)
      }
    }
    playHand.sort(utils.compareCards)
    return utils.scoreHand(playHand, cutCard)
  }

  getHandPoints(whichHand) {
    // TODO: returns the total of cutPoints+playPoints+handScore.points
    return this.state[whichHand].score.points
  }

  setHandPoints(whichHand, points) {
    // TODO: returns the total of cutPoints+playPoints+handScore.points
    this.state[whichHand].score.points = points
  }

  getWhatHappenedLast() {
    return this.whatHappenedLast
  }

  advancePlay() {
    ++this.state.moveNdx
  }

  setHandScore(whichHand, score) {
    this.state[whichHand].score = score
  }

  getLastPlayedIndex(hand) {
    var lastNdx = hand.length - 1
    for (var i = 0; i < hand.length; i++) {
      lastNdx = (hand[i].played === true) ? i : lastNdx
    }
    return lastNdx
  }

  getLastUnplayedIndex(hand) {
    var lastNdx = hand.length - 1
    for (var i = 0; i < hand.length; i++) {
      lastNdx = (hand[i].played === false) ? i : lastNdx
    }
    return lastNdx
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

  copyCard(srcCard, destHand) {
    // copy the provided card to the first unplayed spot in the desthand
    var changedCard
    changedCard = utils.clone(srcCard)
    changedCard.played = true

    var freeNdx = this.getFirstUnplayedIndex(destHand)

    destHand[freeNdx] = changedCard
  }

  currentTotal(gameHand) {
    var values = utils.getValues(gameHand.slice(1, gameHand.length))
    var ranks = utils.getRanks(values)
    var simplified = utils.simplifyRanks(ranks)
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

  opponentChoosesCardToPlay(gameHand, yourHand) {
    // TODO: add intelligence regarding which card to play
    return this.getLastPlayedIndex(yourHand) + 1
  }

  opponentDiscards(hand) {
    // TODO: add intelligent discarding for opponent
    for (var i = 0; i < hand.length; i++) {
      if (hand[i].discarded === false) {
        this.discardCard(hand, i)
        break
      }
    }
    return hand
  }

  calculateWinner(state) {
    return null
  }

  copyDiscardsToGameHand(oppoHand, yourHand, gameHand) {
    var i, card

    var cribHand = []
    for (i = 0; i < 4; i++) {
      cribHand[i] = utils.dealCard('BB', false, false)
    }

    for (i = 0; i < oppoHand.length; i++) {
      if (oppoHand[i].discarded === true) {
        card = utils.clone(oppoHand[i])
        card.discarded = false
        card.played = false
        card.faceup = true
        this.copyCard(card, cribHand)
      }
      if (yourHand[i].discarded === true) {
        card = utils.clone(yourHand[i])
        card.discarded = false
        card.played = false
        card.faceup = true
        this.copyCard(card, cribHand)
      }
    }
    cribHand.sort(utils.compareCards)
    for (i = 0; i < cribHand.length; i++) {
      this.copyCard(cribHand[i], gameHand)
    }
    return gameHand
  }

  getPhase() {
    var phase = undefined
    switch (this.state.moveNdx) {
      case 0:
        phase = 'unstarted'
        break

      case 1:
      case 2:
      case 3:
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

  getInstruction(phase) {
    var instruction
    switch (phase) {
      case 'gamePlayComplete':
        instruction = 'Game play comlplete'
        break

      case 'scoreNonDealerHand':
        if (this.itsYourCrib() === false ) {
          instruction = 'Click to score your hand'
        } else {
          instruction = 'Click to score your opponents hand'
        }
        break

      case 'scoreDealerHand':
        if (this.itsYourCrib() === false) {
          instruction = 'Click to score your opponents hand'
        } else {
          instruction = 'Click to score your hand'
        }
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

      case 'unstarted':
      case 'discarding':
      default:
        instruction = this.state.yourDeal ? 'Discard 2 into your crib...' : 'Discard 2 into your opponents crib...'
        break
    }
    //console.log( "getInstruction  this.state.moveNdx=%d phase=%s",  this.state.moveNdx, phase )
    return instruction
  }

  clearHand(hand, startFrom) {
    for (var i = startFrom; i < hand.length; i++) {
      hand[i] = utils.dealCard('BB', false, false)
    }
    return hand
  }

  showHand(hand) {
    for (var i = 1; i < hand.length; i++) {
      hand[i].played = !(hand[i].played && !hand[i].discarded)
    }
    return hand
  }

  playCard(hand, cardNdx) {
    var changedCard
    changedCard = utils.clone(hand[cardNdx])
    changedCard.played = true
    changedCard.faceup = true
    hand[cardNdx] = changedCard

    return hand
  }

  discardCard(hand, cardNdx) {
    var changedCard

    changedCard = utils.clone(hand[cardNdx])
    changedCard.faceup = false
    changedCard.played = true
    changedCard.discarded = true

    hand[cardNdx] = changedCard

    return hand
  }

  flipCard(hand, cardNdx) {
    var changedCard

    changedCard = utils.clone(hand[cardNdx])
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

  itsYourCrib() {
    return this.state.yourDeal
  }

  newGame() {
    var deck = utils.createDeck(), i
    var oppoHand = utils.dealHand(deck, false, 0)
    oppoHand.sort(utils.compareCards)

    //console.log( "getCombinations oppoHand ",  this.getCombinations( oppoHand, 4, 4 ) )

    var yourHand = utils.dealHand(deck, true, 6)
    yourHand.sort(utils.compareCards)

    var cutCard = utils.dealCard('BB', false, false)

    var gameHand = []
    for (i = 1; i < 9; i++) {
      gameHand[i] = cutCard
    }
    // deal the cut card, mark it as played
    gameHand[0] = utils.dealCard(deck[12], false, true)

    // deal blank placeholders into the crib
    var cribHand = []
    for (i = 0; i < 4; i++) {
      cribHand[i] = utils.dealCard('BB', false, false)
    }

    this.state.moveNdx = 0
    this.state.yourHand = utils.createHand(utils.getValues(yourHand))
    this.state.oppoHand = utils.createHand(utils.getValues(oppoHand))
    // Math.random gives 0.0 <= n < 1.0
    this.state.yourDeal = (Math.random() + 0.5) >= 1 ? true : false
    this.whatHappenedLast = this.state.yourDeal ? "It's your crib..." : "It's your opponents crib..."

    return {
      oppoHand: oppoHand,
      yourHand: yourHand,
      gameHand: gameHand,
      cribHand: cribHand,
    }
  }
}
