import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';


function Card(props) {
  return (
    <button  style={props.card} onClick={props.onClick}/>
  );
}


class Game extends React.Component {
  render() {
    return (
      <div className="game">
        <div className="game-board">
          <Board />
        </div>
        <div className="game-info">
          <div>{/* status */}</div>
          <ol>{/* TODO */}</ol>
        </div>
      </div>
    );
  }
}

class Board extends React.Component {
  constructor(props) {
    super(props);
    this.state = newGame()
  }

  renderCard( whoseHand, cardNdx ){
    /*
    background: #fff;
    border: 1px solid #999;
    float: left;
    font-size: 24px;
    font-weight: bold;
    line-height: 34px;
    height: 34px;
    margin-right: -1px;
    margin-top: -1px;
    padding: 0;
    text-align: center;
    width: 34px;

    */
    // left is position within the div, width is width of the div
    var card;
    var offsets;
    var width;
    var marginLeft;
    var marginTop;
    var marginBottom;
    var height = 156
    var visibility = 'inherit'


    if( this.state[whoseHand][cardNdx].faceup === false ){
      card = 'BB'
    }else{
      card = this.state[whoseHand][cardNdx].value
    }

    switch( whoseHand ){
      case 'gameHand':
      marginLeft = (cardNdx === 1) ? 50 : -1
      marginTop = ( cardNdx % 2 ) ? 10 : 0
      marginBottom = 0

      if ( cardNdx === 0){
         width = 100
       }else{
         width = (cardNdx === getLastPlayedIndex( this.state[whoseHand] ) ) ? 100 : 65;
       }
       if( card ==='BB' && cardNdx > 0){
         visibility = 'hidden'
       }
      break;

      case 'yourHand':
      width = (cardNdx === getLastUnplayedIndex( this.state[whoseHand] ) ) ? 100 : 65;
      marginLeft = (cardNdx === 0) ? 150 : -1
      marginTop = 0
      marginBottom = 20
      if( this.state[whoseHand][cardNdx].played === true ){
        width = 0
        visibility = 'hidden'
      }
      break;

      case 'myHand':
      width = (cardNdx === getLastUnplayedIndex( this.state[whoseHand] ) ) ? 100 : 65;
      if( this.state[whoseHand][cardNdx].played === true ){
        width = 0
        visibility = 'hidden'
      }
      marginLeft = (cardNdx === 0) ? 150 : -1
      marginTop = 20
      marginBottom = 0
      break;

      default:
      width = 100;
      marginLeft = -1;
      marginTop = 0
      break;
    }

    offsets = calculateCardoffsets( card )
    var bg = "url( 'card-deck.png') " + offsets.left + "px " + offsets.top +"px"
    var styles = {
      card: {
        float:'left',
        margin:0,
        padding:0,
        marginRight: 0,
        marginLeft: marginLeft,
        marginTop: marginTop,
        marginBottom: marginBottom,
        display:'block',
        height: height,
        width: width,
        background: bg,
        visibility : visibility
      }
    }
    return <Card
      card={styles.card}
      onClick={() => this.handleCardClick(whoseHand, cardNdx)}
    />
  }

  render() {
    const winner = calculateWinner(this.state);
    let status;
    if (winner) {
      status = 'Winner: ' + winner;
    } else {
      status = 'todo';
    }
    return (
      <div>
        <div className="status">{status}</div>
        <div className="card-row">
          {this.renderCard( 'yourHand',0 )}
          {this.renderCard( 'yourHand',1 )}
          {this.renderCard( 'yourHand',2 )}
          {this.renderCard( 'yourHand',3 )}
          {this.renderCard( 'yourHand',4 )}
          {this.renderCard( 'yourHand',5 )}
        </div>

        <div className="card-row">
          {this.renderCard( 'gameHand',0 )}
          {this.renderCard( 'gameHand',1 )}
          {this.renderCard( 'gameHand',2 )}
          {this.renderCard( 'gameHand',3 )}
          {this.renderCard( 'gameHand',4 )}
          {this.renderCard( 'gameHand',5 )}
          {this.renderCard( 'gameHand',6 )}
          {this.renderCard( 'gameHand',7 )}
          {this.renderCard( 'gameHand',8 )}
          {this.renderCard( 'gameHand',9 )}
          {this.renderCard( 'gameHand',10 )}
          {this.renderCard( 'gameHand',11 )}
          {this.renderCard( 'gameHand',12 )}
        </div>

        <div className="card-row">
          {this.renderCard( 'myHand',0 )}
          {this.renderCard( 'myHand',1 )}
          {this.renderCard( 'myHand',2 )}
          {this.renderCard( 'myHand',3 )}
          {this.renderCard( 'myHand',4 )}
          {this.renderCard( 'myHand',5 )}
        </div>
      </div>
    );
  }

  handleCardClick(whoseHand, cardNdx){
    // NOTE: since we are supposed to not mutate state directly when using react, and since objects are by reference
    // and since they are in our state array, and since react can't detect a direct change except via the this.state syntax
    // we need to clone the inner object then change it, then assign it to a copy of the hand we modified if we want to
    // follow react conventions
    var changedHand;
    switch( whoseHand ){
      case 'yourHand':
      //this.setState({ yourHand : changedHand })
      break;

      case 'myHand':
      // if it's one of the first two cards, they are contibutions to the crib
      // after the second card is discarded, your opponent discards two, then the cut happens
      var moveNdx = this.state.moveNdx
      if( this.state.moveNdx < 2 ){
        changedHand = discardCard( this.state[whoseHand], cardNdx )
        this.setState({ myHand : changedHand })
        ++moveNdx

        if( moveNdx === 2 ){
          // have yourHand make it's discards, note off by 1 since state has not been updated yet...
          changedHand = opponentDiscards( this.state['yourHand'] )
          this.setState({ yourHand : changedHand })
          moveNdx += 2

          // flip the cut card automatically
          changedHand = flipCard( this.state['gameHand'], 0 )
          this.setState({ gameHand : changedHand })
          ++moveNdx
        }
        this.setState({ moveNdx : moveNdx })
      }else{
        // TODO: support opponent moving first
        // in game play
        // copy the chosen card to the gamehand in the next open position
        // show the played card in the gameHand
        changedHand = copyCard( this.state[whoseHand][cardNdx], this.state['gameHand'] )
        this.setState({ gameHand : changedHand })

        // mark copied card as played to make it hide when it renders
        changedHand = playCard( this.state[whoseHand], cardNdx )
        this.setState({ myHand : changedHand })
        ++moveNdx

        // have your opponent make their play
        var yourNdx = opponentChoosesCardToPlay( this.state['gameHand'], this.state['yourHand'] )
        changedHand = copyCard( this.state['yourHand'][yourNdx], this.state['gameHand'] )
        this.setState({ gameHand : changedHand })

        // mark copied card as played to make it hide when it renders
        changedHand = playCard( this.state['yourHand'], yourNdx )
        this.setState({ myHand : changedHand })
        ++moveNdx

        this.setState({ moveNdx : moveNdx })
      }

      // opponent plays - could be discard or game play...

      break;

      case 'gameHand':
      if( cardNdx === 0 ){
        if( this.state[whoseHand][cardNdx].faceup === true ){
          this.setState( newGame() )
        }
      }
      break;

      default:
      console.log("unhandled case")
      break;
    }
  }
}

function opponentChoosesCardToPlay( gameHand, yourHand ){
  // TODO: add intelligence regarding which card to play
  return getLastPlayedIndex( yourHand ) + 1
}

function opponentDiscards( whoseHand ){
  var changedHand = whoseHand.slice()
  // TODO: add intelligent discarding for opponent
  changedHand = discardCard( changedHand, 0 )
  changedHand = discardCard( changedHand, 1 )
  return changedHand
}

function getLastPlayedIndex( hand ){
  var lastNdx = hand.length-1
  for(var i = 0; i < hand.length; i++){
    lastNdx = ( hand[i].played === true ) ? i : lastNdx
  }
  return lastNdx
}

function getLastUnplayedIndex( hand ){
  var lastNdx = hand.length-1
  for(var i = 0; i < hand.length; i++){
    lastNdx = ( hand[i].played === false ) ? i : lastNdx
  }
  return lastNdx
}

function getFirstUnplayedIndex( hand ){
  var firstNdx = hand.length-1
  for(var i = 0; i < hand.length; i++){
    if( hand[i].played === false ){
      firstNdx = i
      break;
    }
  }
  return firstNdx
}

function copyCard( srcCard, destHand ){
  // copy the provided card to the first unplayed spot in the desthand
  var changedHand, changedCard;
  changedHand = destHand.slice()
  changedCard = {}
  Object.assign( changedCard, srcCard )
  changedCard.played = true

  var freeNdx = getFirstUnplayedIndex( changedHand )

  changedHand[freeNdx] = changedCard
  return changedHand
}

function playCard( whoseHand, cardNdx ){
  var changedHand, changedCard;
  changedHand = whoseHand.slice()
  changedCard = {}
  Object.assign( changedCard, whoseHand[cardNdx])
  changedCard.played = true
  changedHand[cardNdx] = changedCard
  return changedHand
}

function discardCard( whoseHand, cardNdx ){
  var changedHand, changedCard;
  changedHand = whoseHand.slice()
  changedCard = {}
  Object.assign( changedCard, whoseHand[cardNdx])
  changedCard.played = true
  changedCard.discarded = true
  changedHand[cardNdx] = changedCard
  return changedHand
}

function flipCard(whoseHand, cardNdx){
  var changedHand, changedCard;
  changedHand = whoseHand.slice()
  changedCard = {}
  Object.assign( changedCard, whoseHand[cardNdx])
  changedCard.faceup = !changedCard.faceup
  changedHand[cardNdx] = changedCard
  return changedHand
}

function calculateCardoffsets( card ){
  // CDHS, A123...K 153x98
  var col = card.slice(0,1)
  var row = card.slice(1,2)
  switch( col ){
    case 'A': col=0;break;
    case 'T': col=9;break;
    case 'J': col=10;break;
    case 'Q': col=11;break;
    case 'K': col=12;break;
    case 'B': col=2;break;
    case 'X': col=0;break;
    default:col = (+col)-1;break;
  }
  switch( row ){
    case "C": row = 0;break;
    case "D": row = 1;break;
    case "H": row = 2;break;
    case "S": row = 3;break;
    case 'B': row=4;break;
    case 'X': row=4;break;
    default: row = 4;break;
  }
  var result = {}
  result.top = row*(-154)
  result.left = col*(-98)
  return result
}

function calculateWinner(state) {
  return null;
}

function shuffle(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
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
  var order = "A23456789TJQK"
  var apos = order.indexOf( a.value.substring(0,1) );
  var bpos = order.indexOf( b.value.substring(0,1) );

  if (apos < bpos)
  return -1;
  if (apos > bpos)
  return 1;

  order = "SHCD"
  apos = order.indexOf( a.value.substring(1,2) );
  bpos = order.indexOf( b.value.substring(1,2) );
  if (apos < bpos)
  return -1;
  if (apos > bpos)
  return 1;

  return 0;
}

function newGame(){
  var deck = createDeck()
  var myHand = dealHand( deck, true, 0 )
  myHand.sort(compareCards);

  var yourHand = dealHand( deck, false, 6 )
  var gameHand = new Array(13)
  for(var i = 1; i < gameHand.length; i++){
    gameHand[i] = dealCard( 'BB', false, false )
  }
  // deal the cut card, mark it as played
  gameHand[0] = dealCard( deck[12], false, true )

  // deal blank placeholders into the crib
  var cribHand = new Array(4)
  for( i = 0; i < cribHand.length; i++ ){
    cribHand[i] = dealCard( 'BB', false, false )
  }

  return {
    myHand: myHand,
    yourHand: yourHand,
    gameHand: gameHand,
    cribHand: cribHand,
    deck: deck,
    moveNdx: 0,
  }
}
// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);
