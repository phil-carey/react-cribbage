import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

const gp = require('./gameplay.js');

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
    this.state = gp.newGame()
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

    if( card === undefined ){
      console.log("undefined whoseHand = %s cardNdx=%d", whoseHand, cardNdx)
      card = 'BB'
    }

    switch( whoseHand ){
      case 'gameHand':
      marginLeft = (cardNdx === 1) ? 50 : -1
      marginTop = ( cardNdx % 2 ) ? 10 : 0
      marginBottom = 0

      if ( cardNdx === 0){
        width = 100
      }else{
        width = (cardNdx === gp.getLastPlayedIndex( this.state[whoseHand] ) ) ? 100 : 65;
      }
      if( card ==='BB' && cardNdx > 0){
        visibility = 'hidden'
      }
      break;

      case 'yourHand':
      width = (cardNdx === gp.getLastUnplayedIndex( this.state[whoseHand] ) ) ? 100 : 65;
      marginLeft = (cardNdx === 0) ? 50 : -1
      marginTop = 20
      marginBottom = 0
      if( this.state[whoseHand][cardNdx].played === true ){
        width = 0
        visibility = 'hidden'
      }
      break;

      case 'oppoHand':
      width = (cardNdx === gp.getLastUnplayedIndex( this.state[whoseHand] ) ) ? 100 : 65;
      if( this.state[whoseHand][cardNdx].played === true ){
        width = 0
        visibility = 'hidden'
      }
      marginLeft = (cardNdx === 0) ? 50 : -1
      marginTop = 20
      marginBottom = 20
      break;

      default:
      width = 100;
      marginLeft = -1;
      marginTop = 0
      break;
    }

    offsets = gp.calculateCardoffsets( card )
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
        visibility : visibility,
        outline: 'none'
      }
    }
    return <Card
      card={styles.card}
      onClick={() => this.handleCardClick(whoseHand, cardNdx)}
    />
  }

  render() {
    const winner = gp.calculateWinner(this.state);
    let status, myScore, oppoScore, netTotal
    if (winner) {
      status = 'Winner: ' + winner
    } else {
      status = gp.getInstruction( gp.getPlayPhase(false) )
      console.log( "instruction = %s phase=%s", status, gp.getPlayPhase(false) )
      myScore = gp.myScore()
      oppoScore = gp.oppoScore()
      netTotal = gp.netTotal()
    }
    return (
      <div onClick={() =>this.handleGameClick()}>
        <div className="card-row">
          <div className="status">
            {status}
          </div>
          <div className="status">
            what happened last...
          </div>
        </div>

        <div className="card-row">
          <div className="oppoStatus">
            Total : {netTotal}
          </div>
          <div className="mystatus">
            You : {myScore}
          </div>
          <div className="oppoStatus">
            Opponent : {oppoScore}
          </div>
        </div>

        <div className="card-row">
          {this.renderCard( 'oppoHand',0 )}
          {this.renderCard( 'oppoHand',1 )}
          {this.renderCard( 'oppoHand',2 )}
          {this.renderCard( 'oppoHand',3 )}
          {this.renderCard( 'oppoHand',4 )}
          {this.renderCard( 'oppoHand',5 )}
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
          {this.renderCard( 'yourHand',0 )}
          {this.renderCard( 'yourHand',1 )}
          {this.renderCard( 'yourHand',2 )}
          {this.renderCard( 'yourHand',3 )}
          {this.renderCard( 'yourHand',4 )}
          {this.renderCard( 'yourHand',5 )}
        </div>
      </div>
    );
  }

  handleGameClick(){
    var phase = gp.getPlayPhase(true), changedHand, score
    console.log( "handleGameClick phase = %s", phase)
    // TODO: manage actions/changes in game state due do current phase of play
    switch( phase ){
      case 'scoreDealerHand':
      // all cards have been played, calculate score for the hand which is not the dealer ( they count first )
      // clear the gamehand
      changedHand = gp.clearHand( this.state['gameHand'], 1 )
      this.setState({ gameHand : changedHand })

      changedHand = gp.showHand( this.state['yourHand'] )
      this.setState({ yourHand : changedHand })

      score = gp.scoreHand( this.state['gameHand'][0], changedHand )
      console.log( "scoreDealerHand score = %d", score.points )
      break

      case 'scoreNonDealerHand':
      // all cards have been played, calculate score for the hand which is the dealer
      // reshow the dealer cards which have been played, but not discarded
      changedHand = gp.showHand( this.state['oppoHand'] )
      this.setState({ oppoHand : changedHand })
      score = gp.scoreHand( this.state['gameHand'][0], changedHand )
      console.log( "scoreNonDealerHand score = %d", score.points )
      break

      case 'scoreCribHand':
      // all cards have been played, calculate score for the crib hand
      // copy all discarded cards to the gamehand and show it
      changedHand = gp.copyDiscardsToGameHand( this.state['oppoHand'], this.state['yourHand'], this.state['gameHand'] )
      this.setState({ gameHand : changedHand })
      break

      case 'handCompleted':
      if( this.state['gameHand'][0].faceup === true ){
        console.log( "starting new game")
        this.setState( gp.newGame() )
      }
      break

      default:
      // do nothing
      break
    }
  }

  handleCardClick(whoseHand, cardNdx){
    // NOTE: since we are supposed to not mutate state directly when using react, and since objects are by reference
    // and since they are in our state array, and since react can't detect a direct change except via the this.state syntax
    // we need to clone the inner object then change it, then assign it to a copy of the hand we modified if we want to
    // follow react conventions
    var phase = gp.getPlayPhase(false)
    var changedHand;
    switch(phase){
      case 'unstarted':
      case 'discarding':
      case 'playing':
      switch( whoseHand ){
        case 'oppoHand':
        //this.setState({ yourHand : changedHand })
        break;

        case 'yourHand':
        // if it's one of the first two cards, they are contibutions to the crib
        // after the second card is discarded, your opponent discards two, then the cut happens
        if( gp.getMoveNdx() < 2 ){
          changedHand = gp.discardCard( this.state[whoseHand], cardNdx )
          this.setState({ yourHand : changedHand })

          if( gp.getMoveNdx() === 2 ){
            // have yourHand make it's discards, note off by 1 since state has not been updated yet...
            changedHand = gp.opponentDiscards( this.state['oppoHand'] )
            this.setState({ oppoHand : changedHand })

            // flip the cut card automatically
            changedHand = gp.flipCard( this.state['gameHand'], 0 )
            this.setState({ gameHand : changedHand })
          }
        }else{
          // TODO: support opponent moving first
          // in game play
          // copy the chosen card to the gamehand in the next open position
          // show the played card in the gameHand
          var gameHand = this.state['gameHand']
          var oppoHand = this.state['oppoHand']
          var yourHand = this.state['yourHand']

          gameHand = gp.copyCard( yourHand[cardNdx], gameHand )

          // mark copied card as played to make it hide when it renders
          yourHand = gp.playCard( yourHand, cardNdx )

          // have your opponent make their play
          var oppoNdx = gp.opponentChoosesCardToPlay( gameHand, oppoHand )
          gameHand = gp.copyCard( oppoHand[oppoNdx], gameHand )
          var lastPlayedNdx = gp.getLastPlayedIndex( gameHand )
          gameHand = gp.flipCard( gameHand, lastPlayedNdx )

          // mark copied card as played to make it hide when it renders
          oppoHand = gp.playCard( oppoHand, oppoNdx )

          this.setState({ gameHand : gameHand })
          this.setState({ oppoHand : oppoHand })
          this.setState({ yourHand : yourHand })
        }

        break;

        case 'gameHand':
        if( cardNdx === 0 ){
          console.log( "starting new game")
          this.setState( gp.newGame() )
        }
        break;

        default:
        console.log("unhandled case")
        break
      }
      break

      default:
      break
    }
  }
}


// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);
