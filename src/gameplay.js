// the internal game is stateful, we mutate directly, though we follow react non-mutation conventions wrt UI updates
var gameState = {
  moveNdx : 0,
}

function clone(obj) {
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
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

function getFirstUnplayedIndex ( hand ){
  var firstNdx = hand.length-1
  for(var i = 0; i < hand.length; i++){
    if( hand[i].played === false ){
      firstNdx = i
      break
    }
  }
  return firstNdx
}

exports.getLastPlayedIndex = function( hand ){
  var lastNdx = hand.length-1
  for(var i = 0; i < hand.length; i++){
    lastNdx = ( hand[i].played === true ) ? i : lastNdx
  }
  return lastNdx
}

exports.opponentChoosesCardToPlay = function( gameHand, yourHand ){
  // TODO: add intelligence regarding which card to play
  return this.getLastPlayedIndex( yourHand ) + 1
}

exports.opponentDiscards = function( whoseHand ){
  var changedHand = whoseHand.slice()
  // TODO: add intelligent discarding for opponent
  changedHand = this.discardCard( changedHand, 0 )
  changedHand = this.discardCard( changedHand, 1 )
  return changedHand
}

exports.getLastUnplayedIndex = function( hand ){
  var lastNdx = hand.length-1
  for(var i = 0; i < hand.length; i++){
    lastNdx = ( hand[i].played === false ) ? i : lastNdx
  }
  return lastNdx
}

exports.copyCard = function( srcCard, destHand ){
  // copy the provided card to the first unplayed spot in the desthand
  var changedHand, changedCard
  changedHand = destHand.slice()
  changedCard = clone( srcCard )
  changedCard.played = true

  var freeNdx = getFirstUnplayedIndex( changedHand )

  changedHand[freeNdx] = changedCard
  return changedHand
}

exports.currentTotal = function( gameHand ){
  var values = getValues( gameHand.slice(1, gameHand.length) )
  var ranks = getRanks( values )
  var simplified = simplifyRanks( ranks )
  var result = 0

  for( var i = 0; i < simplified.length; i++){ 
    if( result + simplified[i]  > 31 ) {
      result = simplified[i]
    }else{
      result += simplified[i]
    }
  }
  console.log( "currentTotal=%d", result )
  return result
}

exports.playCard = function( whoseHand, cardNdx ){
  var changedHand, changedCard
  changedHand = whoseHand.slice()
  changedCard = clone( whoseHand[cardNdx] )
  changedCard.played = true
  changedCard.faceup = true
  changedHand[cardNdx] = changedCard

  gameState.moveNdx++

  return changedHand
}

exports.discardCard = function( whoseHand, cardNdx ){
  var changedHand, changedCard
  changedHand = whoseHand.slice()
  changedCard = clone( whoseHand[cardNdx])
  changedCard.faceup = false
  changedCard.played = true
  changedCard.discarded = true
  changedHand[cardNdx] = changedCard

  gameState.moveNdx++

  return changedHand
}

exports.flipCard = function(whoseHand, cardNdx){
  var changedHand, changedCard
  changedHand = whoseHand.slice()
  changedCard = clone( whoseHand[cardNdx] )
  changedCard.faceup = !changedCard.faceup
  changedHand[cardNdx] = changedCard
  return changedHand
}

exports.calculateCardoffsets = function( card ){
  // CDHS, A123...K 153x98
  var col = card.slice(0,1)
  var row = card.slice(1,2)
  switch( col ){
    case 'A': col=0;break
    case 'T': col=9;break
    case 'J': col=10;break
    case 'Q': col=11;break
    case 'K': col=12;break
    case 'B': col=2;break
    case 'X': col=0;break
    default:col = (+col)-1;break
  }
  switch( row ){
    case "C": row = 0;break
    case "D": row = 1;break
    case "H": row = 2;break
    case "S": row = 3;break
    case 'B': row=4;break
    case 'X': row=4;break
    default: row = 4;break
  }
  var result = {}
  result.top = row*(-154)
  result.left = col*(-98)
  return result
}

exports.calculateWinner = function(state) {
  return null;
}

function shuffle(a) {
  var j, x, i
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1))
    x = a[i]
    a[i] = a[j]
    a[j] = x
  }
  return a
}

function createDeck(){
  // construct and return a shuffled deck
  var suits = "CDHS"
  var ranks = "A23456789TJQK"
  var deck = new Array(52), i = 0
  for( var row =0; row < 4; row++){
    var suit = suits.slice( row, row+1)
    for( var col = 0; col < 13; col++){
      var rank = ranks.slice( col, col+1)
      deck[i++] = rank+suit
    }
  }

  return shuffle( deck );
}

function dealCard( value, faceup, played ){
  var card = {value:value, faceup:faceup, played:played, discarded:false }
  return card
}

function dealHand( deck, faceup, from ){
  var hand = new Array(6)
  for( var i=0; i < 6; i++){
    hand[i] = dealCard( deck[from+i], faceup, false)
  }
  return hand
}

function compareCards( a,b ){
  var order = "A23456789TJQKB"
  var apos = order.indexOf( a.value.substring(0,1) )
  var bpos = order.indexOf( b.value.substring(0,1) )

  if (apos < bpos)  return -1
  if (apos > bpos)  return 1

  order = "SHCDB"
  apos = order.indexOf( a.value.substring(1,2) )
  bpos = order.indexOf( b.value.substring(1,2) )
  if (apos < bpos)  return -1
  if (apos > bpos)  return 1

  return 0
}

function compareCardValues( a,b ){
  var order = "A23456789TJQKB"
  var apos = order.indexOf( a.substring(0,1) )
  var bpos = order.indexOf( b.substring(0,1) )

  if (apos < bpos)  return -1
  if (apos > bpos)  return 1

  order = "SHCDB"
  apos = order.indexOf( a.substring(1,2) )
  bpos = order.indexOf( b.substring(1,2) )
  if (apos < bpos)  return -1
  if (apos > bpos)  return 1

  return 0
}

exports.getMoveNdx = function (){
  return gameState.moveNdx
}

exports.getInstruction = function ( phase ){
  var instruction = "hunh?"
  switch( phase ){
    case 'discarding':
    case 'unstarted':
      instruction = 'Select 2 for the crib'
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

    default:
    // do nothing
    break
  }
  return instruction
}

exports.getPlayPhase = function( moveahead ){
  var phase = undefined
  switch( gameState.moveNdx ){
    case 0:
    phase = 'unstarted'
    break

    case 12:
    // all cards have been played
    phase = 'gamePlayComplete'
    if(moveahead)++gameState.moveNdx
    break

    case 13:
    // all cards have been played, calculate score for the hand which is not the dealer ( they count first )
    if(moveahead)++gameState.moveNdx
    phase = 'scoreNonDealerHand'
    break

    case 14:
    // all cards have been played, calculate score for the hand which is the dealer
    if(moveahead)++gameState.moveNdx
    phase = 'scoreDealerHand'
    break

    case 15:
    // all cards have been played, calculate score for the crib hand
    if(moveahead)++gameState.moveNdx
    phase = 'scoreCribHand'
    break

    default:
    if( gameState.moveNdx < 4)  phase = 'discarding'
    else if( gameState.moveNdx < 15)phase = 'playing'
    else phase = 'handCompleted'
    // do nothing
    break
  }
  return phase
}

exports.clearHand = function( inputHand, startFrom ){
  var changedHand = inputHand.slice()
  for(var i = startFrom; i < changedHand.length; i++){
    changedHand[i] = dealCard( 'BB', false, false )
  }
  return changedHand
}

exports.showHand = function( inputHand ){
  var changedHand = inputHand.slice()
  for(var i = 1; i < changedHand.length; i++){
    changedHand[i].played = !(changedHand[i].played && !changedHand[i].discarded)
  }
  return changedHand
}

exports.copyDiscardsToGameHand = function( oppoHand, yourHand, gameHand ){
  var i, card
  var changedHand = gameHand.slice()
  var cribHand = new Array(4)
  for( i = 0; i < cribHand.length; i++){
    cribHand[i] = dealCard( 'BB', false, false )
  }

  for( i = 0; i < oppoHand.length; i++){
    if( oppoHand[i].discarded === true ){
      card = clone( oppoHand[i] )
      card.discarded = false
      card.played = false
      card.faceup = true
      cribHand = this.copyCard( card, cribHand )
    }
    if( yourHand[i].discarded === true ){
      card = clone( yourHand[i] )
      card.discarded = false
      card.played = false
      card.faceup = true
      cribHand = this.copyCard( card, cribHand )
    }
  }
  cribHand.sort(compareCards)
  for( i = 0; i < cribHand.length; i++){
    changedHand = this.copyCard( cribHand[i], changedHand)
  }
  return changedHand
}

exports.myScore = function(){
  return gameState.myScore;
}

exports.oppoScore = function(){
  return gameState.oppoScore;
}

exports.getCombinations = function( arr, minlen, maxlen ){
  // given an array of items, generate every combination of length >= minlen and length <= maxlen
  let i, j
  let result = []
  let combinations = Math.pow(2, arr.length)

  for (i = 0; i < combinations;  i++) {
    let temp = []

    for (j = 0; j < arr.length; j++) {
      if ((i & Math.pow(2, j))) {
        temp.push( arr[j] )
      }
    }
    if( temp.length >= minlen && temp.length <= maxlen ){
      result.push(temp)
    }
  }
  return result
}

function getRank( value ){
  var order = "BA23456789TJQK"
  return order.indexOf( value.substring(0,1) )
}

function getRanks( values ){
  var ranks = []

  for( var j = 0; j < values.length; j++){
    ranks.push( getRank( values[j] ) )
  }

  return ranks
}

function getSuit( value ){
  return value.substring(1,2)
}

function getSuits( values ){
  var suits = []

  for( var j = 0; j < values.length; j++){
    suits.push( getSuit( values[j] ) )
  }

  return suits
}

function getValues( hand ){
  var values = []

  for( var j = 0; j < hand.length; j++){
    values.push( hand[j].value )
  }

  return values
}

function simplifyRanks( ranks ){
  var simpleRanks = []
  // strip out blank cards or 0's and convert face cards to 10's

  for( var i = 0; i < ranks.length; i++){
    if( ranks[i] > 0){
      simpleRanks.push( Math.min( ranks[i], 10 ) )
    }
  }
  return simpleRanks
}

function isInSequence( combo ){
    for( var i = 1; i < combo.length; i++){
      if( combo[i] !== combo[i-1] + 1)return false
    }
    return true
}

exports.scoreHand = function( cutCard, inputHand ){
  var points = 0, cutSuit
  var values

  values = getValues( inputHand )

  if( cutCard !== undefined ){
    values.push( cutCard.value )
    cutSuit = getSuit( cutCard.value )
  }else{
    cutSuit = 'B'
  }

  values.sort( compareCardValues )

  var suits = getSuits( values )
  var ranks = getRanks( values )

  //console.log( 'suits = ', suits )
  //console.log( 'ranks = ', ranks )

  // score flush, count how many of the same suit, if 4, see if it excludes the cut card
  var spades = 0, hearts = 0, clubs = 0, diamonds = 0
  for(var i = 0; i < suits.length; i++){
    switch( suits[i] ){
      case 'S': spades++;break
      case 'H': hearts++;break
      case 'C': clubs++;break
      case 'D': diamonds++;break
      default : break
    }
  }

  // Note: we are coding to expect that we score runs for hands of up to 5 cards max!
  var flushPoints = 0
  if( spades === 4 && cutSuit !== 'S' ) flushPoints = 4
  if( spades === 5 ) flushPoints = 5

  if( hearts === 4 && cutSuit !== 'H' ) flushPoints = 4
  if( hearts === 5 ) flushPoints = 5

  if( clubs === 4 && cutSuit !== 'C' ) flushPoints = 4
  if( clubs === 5 ) flushPoints = 5

  if( diamonds === 4 && cutSuit !== 'D' ) flushPoints = 4
  if( diamonds === 5 ) flushPoints = 5

  points += flushPoints

  // get combinations of lengths 2 through hand length and use them to find runs, pairs, etc
  var combos = this.getCombinations( ranks, 2, ranks.length )
  //console.log( "combos = ", combos )

  // score 15's
  var fifteens = 0
  for( i = 0; i < combos.length; i++ ){
    var simpleRanks = simplifyRanks( combos[i] )
    if( simpleRanks.reduce((a, b) => a + b, 0) === 15 ){
      //console.log( "combos[i] = ", combos[i] )
      //console.log( "15 - simpleRanks = ", simpleRanks )
      ++fifteens
    }
  }
  points += 2*fifteens

  // score pairs, trips, quads
  var pairs = 0, royalPairs = 0, doubleRoyalPairs = 0
  for( i = 0; i < ranks.length; i++){
    if( i < ranks.length-1 && ranks[i] === ranks[i+1] ){
      if( i < ranks.length-2 && ranks[i+1] === ranks[i+2]){
        if( i < ranks.length-3 && ranks[i+2] === ranks[i+3]){
          ++doubleRoyalPairs
          i += 3
        }else{
          ++royalPairs
          i += 2
        }
      }else{
        ++pairs
        i += 1
      }
    }
  }
  points += pairs*2
  points += royalPairs*6
  points += doubleRoyalPairs*12

  // score runs, on combos which will include the input hand itself
  var runs3 = 0, runs4 = 0, runs5 = 0
  for( i = 0; i < combos.length; i++ ){
    var combo = combos[i]
    switch( combo.length ){
      case 3: if( isInSequence( combo ) )runs3++; break;
      case 4: if( isInSequence( combo ) )runs4++; break;
      case 5: if( isInSequence( combo ) )runs5++; break;
      default:break;
    }
  }

  // now enforce sequence non-duplication/overlap rules
  if( runs5 !== 0){
    points += 5*runs5
    runs4 = runs3 = 0
  }else if( runs4 !== 0 ){
    points += 4*runs4
    runs3 = 0
  }else{
    points += 3*runs3
  }

  var score = {
    points:points,
    fifteens:fifteens,
    flushPoints:flushPoints,
    runs3:runs3,
    runs4:runs4,
    runs5:runs5,
    pairs:pairs,
    royalPairs:royalPairs,
    doubleRoyalPairs:doubleRoyalPairs,
    values:values
  }

  return score
}

exports.newGame = function(){
  var deck = createDeck(), i
  var oppoHand = dealHand( deck, false, 0 )
  oppoHand.sort(compareCards)

  //console.log( "getCombinations oppoHand ",  this.getCombinations( oppoHand, 4, 4 ) )

  var yourHand = dealHand( deck, true, 6 )
  yourHand.sort(compareCards)

  var cutCard = dealCard( 'BB', false, false )

  var combos = this.getCombinations( yourHand, 4, 4 )
  for( i = 0; i < combos.length; i++ ){
    var score = this.scoreHand( undefined, combos[i] )
    console.log( "score : ",  score )
  }

  var gameHand = new Array(13)
  for( i = 1; i < gameHand.length; i++){
    gameHand[i] = cutCard
  }
  // deal the cut card, mark it as played
  gameHand[0] = dealCard( deck[12], false, true )

  // deal blank placeholders into the crib
  var cribHand = new Array(4)
  for( i = 0; i < cribHand.length; i++ ){
    cribHand[i] = dealCard( 'BB', false, false )
  }
  gameState.moveNdx = 0
  gameState.oppoScore = 0
  gameState.myScore = 0

  return {
    oppoHand: oppoHand,
    yourHand: yourHand,
    gameHand: gameHand,
    cribHand: cribHand,
  }
}
