let CardUtils = require('./cardutils.js').default;
let utils = new CardUtils();

export default class GamePlay {
  constructor() {
    this.state = { };
  }

  getPlayed(whichHand, cardNdx) {
    return this.state.hands[whichHand].cards[cardNdx].played
  }

  getFaceup(whichHand, cardNdx) {
    return this.state.hands[whichHand].cards[cardNdx].faceup
  }

  getValue(whichHand, cardNdx) {
    return this.state.hands[whichHand].cards[cardNdx].value
  }

  getCribScore() {
    let cutCard = this.state.hands['gameHand'].cards[0]
    let cribCards = this.state.hands['cribHand'].cards
    cribCards.sort(utils.compareCards)
    return utils.scoreHand(cribCards, cutCard)
  }

  getHandScore(whichHand, cutCard) {
    let hand = this.state.hands[whichHand].cards
    // create a hand with only the non-discarded cards in it, and score that
    let playHand = []

    for (let i = 0; i < hand.length; i++) {
      if (hand[i].discarded === false) {
        playHand[playHand.length] = utils.clone(hand[i])
      }
    }
    playHand.sort(utils.compareCards)
    return utils.scoreHand(playHand, cutCard)
  }

  getHandPoints(whichHand) {
    // TODO: returns the total of cutPoints+playPoints+handScore.points
    return this.state.hands[whichHand].score.points
  }

  getWhatHappenedLast() {
    return this.whatHappenedLast
  }

  getLastPlayedIndex(whichHand) {
    let hand = this.state.hands[whichHand].cards
    let lastNdx = hand.length - 1
    for (let i = 0; i < hand.length; i++) {
      lastNdx = (hand[i].played === true) ? i : lastNdx
    }
    //console.log("GLPI %s lastNdx=%d", whichHand, lastNdx, hand)
    return lastNdx
  }

  getLastUnplayedIndex(whichHand) {
    let hand = this.state.hands[whichHand].cards
    let lastNdx = hand.length - 1
    for (let i = 0; i < hand.length; i++) {
      lastNdx = (hand[i].played === false) ? i : lastNdx
    }
    return lastNdx
  }

  getCurrentTotal() {
    let gameHand = this.state.hands['gameHand'].cards

    let values = utils.getValues(gameHand.slice(1, gameHand.length))
    let ranks = utils.getRanks(values)
    let simplified = utils.simplifyRanks(ranks)
    let result = 0

    for (let i = 0; i < simplified.length; i++) {
      if (result + simplified[i] > 31) {
        result = simplified[i]
      } else {
        result += simplified[i]
      }
    }
    return result
  }

  getWinner(state) {
    return null
  }

  getPhase() {
    let phase = undefined
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
        phase = 'getCribScore'
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
    let instruction
    switch (phase) {
      case 'gamePlayComplete':
        instruction = 'Game play comlplete'
        break

      case 'scoreNonDealerHand':
        if (this.getItsYourCrib() === false) {
          instruction = 'Click to score your hand'
        } else {
          instruction = 'Click to score your opponents hand'
        }
        break

      case 'scoreDealerHand':
        if (this.getItsYourCrib() === false) {
          instruction = 'Click to score your opponents hand'
        } else {
          instruction = 'Click to score your hand'
        }
        break

      case 'getCribScore':
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

  getCardoffsets(card) {
    // CDHS, A123...K 153x98
    let col = card.slice(0, 1)
    let row = card.slice(1, 2)
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
    let result = {}
    result.top = row * (-154)
    result.left = col * (-98)
    return result
  }

  getItsYourCrib() {
    return this.state.yourDeal
  }

  setHandPoints(whichHand, points) {
    // TODO: returns the total of cutPoints+playPoints+handScore.points
    this.state.hands[whichHand].score.points = points
  }

  setHandScore(whichHand, score) {
    this.state.hands[whichHand].score = score
  }

  doAdvancePlay() {
    ++this.state.moveNdx
  }
  
  doCopyCard(srcCard, whichHand) {
    // copy the provided card to the first unplayed spot in the desthand
    let destHand = this.state.hands[whichHand].cards

    let changedCard
    changedCard = utils.clone(srcCard)
    changedCard.played = true

    let freeNdx = destHand.length - 1
    for (let i = 0; i < destHand.length; i++) {
      if (destHand[i].played === false) {
        freeNdx = i
        break
      }
    }

    destHand[freeNdx] = changedCard
    return this.state.hands[whichHand]
  }

  doOpponentPlayCard() {
    // TODO: add intelligence regarding which card to play
    return this.getLastPlayedIndex('oppoHand') + 1
  }

  doOpponentDiscard(whichHand) {
    // TODO: add intelligent discarding for opponent
    let hand = this.state.hands[whichHand].cards
    for (let i = 0; i < hand.length; i++) {
      if (hand[i].discarded === false) {
        this.doDiscardCard(whichHand, i)
        break
      }
    }
    return hand
  }

  doCopyCribToGameHand() {
    let gameHand = this.state.hands['gameHand'].cards
    let cribHand = this.state.hands['cribHand'].cards

    let i, card

    for (i = 0; i < cribHand.length; i++) {
      card = utils.clone(cribHand[i])
      card.discarded = false
      card.played = true
      card.faceup = true
      this.doCopyCard( card, 'gameHand')
    }

    return gameHand
  }

  doClearHand(whichHand, startFrom) {
    let hand = this.state.hands[whichHand].cards
    for (let i = startFrom; i < hand.length; i++) {
      hand[i] = utils.createCard('BB', false, false)
    }
    return hand
  }

  doShowHand(whichHand) {
    let hand = this.state.hands[whichHand].cards

    for (let i = 0; i < hand.length; i++) {
      if (hand[i].discarded === false) {
        hand[i].played = false
      }
    }
    return hand
  }

  doPlayCard(whichHand, cardNdx) {
    let hand = this.state.hands[whichHand].cards
    let changedCard
    changedCard = utils.clone(hand[cardNdx])
    changedCard.played = true
    changedCard.faceup = true
    hand[cardNdx] = changedCard

    return hand
  }

  doDiscardCard(whichHand, cardNdx) {
    let changedCard
    let hand = this.state.hands[whichHand].cards
    let cribCards = this.state.hands['cribHand'].cards

    changedCard = utils.clone(hand[cardNdx])
    cribCards[cribCards.length] = changedCard

    //hand.splice( cardNdx, 1) // remove the discarded card from the indicated hand
    changedCard.faceup = false
    changedCard.played = true
    changedCard.discarded = true

    hand[cardNdx] = changedCard
    return hand
  }

  doFlipCard(whichHand, cardNdx) {
    let changedCard
    let hand = this.state.hands[whichHand].cards

    changedCard = utils.clone(hand[cardNdx])
    changedCard.faceup = !changedCard.faceup

    hand[cardNdx] = changedCard
    return hand
  }

  doStartNewGame() {
    let deck, i
    let oppoHand, yourHand
    let gameHand = []

    deck = utils.createDeck()

    oppoHand = utils.dealHand(deck, false, 6)
    oppoHand.sort(utils.compareCards)

    yourHand = utils.dealHand(deck, true, 6)
    yourHand.sort(utils.compareCards)

    // deal the cut card, mark it as played
    gameHand = utils.dealHand(deck, true, 1)
    // deal blank placeholders for the remaining cards
    for (i = 1; i < 9; i++) {
      gameHand[i] = utils.createCard('BB', false, false)
    }

    // create a hand to hold the crib cards
    let cribHand = []

    // Math.random gives 0.0 <= n < 1.0
    this.state.yourDeal = (Math.random() + 0.5) >= 1 ? true : false
    this.whatHappenedLast = this.state.yourDeal ? "It's your crib..." : "It's your opponents crib..."
    this.state.moveNdx = 0
    this.state.hands = []
    this.state.hands['yourHand'] = utils.createHand(yourHand)
    this.state.hands['oppoHand'] = utils.createHand(oppoHand)
    this.state.hands['cribHand'] = utils.createHand(cribHand)
    this.state.hands['gameHand'] = utils.createHand(gameHand)

    //console.log( "doStartNewGame state = ", this.state )

    return {
      oppoHand: this.state.hands['oppoHand'].cards,
      yourHand: this.state.hands['yourHand'].cards,
      gameHand: this.state.hands['gameHand'].cards,
    }
  }
}
