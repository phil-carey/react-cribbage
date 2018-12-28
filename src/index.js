import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
// git push -u https://phil-carey:passwordgoeshere@github.com/phil-carey/react-cribbage.git  master

let GamePlay = require('./gameplay.js').default;

let game = new GamePlay();

function Card(props) {
  return (
    <button style={props.card} onClick={props.onClick} />
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
    this.state = game.doStartNewGame()
  }

  handleCardClick(whoseHand, cardNdx) {
    let changedHand, oppoNdx
    let gameHand = this.state['gameHand']
    let oppoHand = this.state['oppoHand']
    let yourHand = this.state['yourHand']
    let phase =  game.getPhase()
    //console.log( "HCC phase = %s", phase )

    switch (phase) {
      case 'unstarted':
      case 'discarding':
        switch (whoseHand) {
          case 'yourHand':
            changedHand = game.doDiscardCard( 'yourHand', cardNdx)
            game.doAdvancePlay()
            this.setState({ yourHand: changedHand })

            changedHand = game.doOpponentDiscard('oppoHand')
            game.doAdvancePlay()
            this.setState({ oppoHand: changedHand })

            if (game.getPhase() === 'playing') {
              changedHand = game.doFlipCard( 'gameHand', 0)
              this.setState({ gameHand: changedHand })
              if (game.getItsYourCrib() === true) {
                // opponent plays first
                oppoNdx = game.doOpponentPlayCard()
                changedHand = game.doCopyCard(oppoHand[oppoNdx], 'gameHand')
                this.setState({ gameHand: changedHand })
                game.doFlipCard('gameHand', game.getLastPlayedIndex('gameHand'))
              }
            }
            break

          default:
            break
        }
        break

      case 'getCribScore':
        break

      case 'playing':
        switch (whoseHand) {
          case 'yourHand':
            // copy the chosen card to the gamehand in the next open position
            gameHand = game.doCopyCard(yourHand[cardNdx], 'gameHand')

            // mark copied card as played to make it hide when it renders
            yourHand = game.doPlayCard('yourHand', cardNdx)
            game.doAdvancePlay()

            // check to see if opponent can play lt 31, if so, do so
            // have your opponent make their play
            oppoNdx = game.doOpponentPlayCard()
            
            gameHand = game.doCopyCard( oppoHand[oppoNdx], 'gameHand')

            game.doFlipCard('gameHand', game.getLastPlayedIndex('gameHand'))

            // mark copied card as played to make it hide when it renders
            oppoHand = game.doPlayCard('oppoHand', oppoNdx)
            game.doAdvancePlay()

            this.setState({ gameHand: gameHand })
            this.setState({ oppoHand: oppoHand })
            this.setState({ yourHand: yourHand })
            break;

          case 'gameHand':
            if (cardNdx === 0) {
              this.setState(game.doStartNewGame())
            }
            break;

          case 'oppoHand':
            //this.setState({ yourHand : changedHand })
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

  handleGameClick() {
    let changedHand, score, points

    let phase = game.getPhase()
    //console.log( "HGC phase = %s", phase )
    switch (phase) {
      case 'gamePlayComplete':
        game.doAdvancePlay()
        break

      case 'scoreNonDealerHand':
        // clear the gamehand
        changedHand = game.doClearHand('gameHand', 1)
        this.setState({ gameHand: changedHand })

        if (game.getItsYourCrib() === false) {
          changedHand = game.doShowHand('yourHand')
          this.setState({ yourHand: changedHand })
          score = game.getHandScore('yourHand', this.state['gameHand'][0])
          game.setHandScore('yourHand', score)
        } else {
          changedHand = game.doShowHand('oppoHand')
          this.setState({ oppoHand: changedHand })
          score = game.getHandScore('oppoHand', this.state['gameHand'][0])
          game.setHandScore('oppoHand', score)
        }
        game.doAdvancePlay()
        break

      case 'scoreDealerHand':
        if (game.getItsYourCrib() === true) {
          changedHand = game.doShowHand('yourHand')
          this.setState({ yourHand: changedHand })
          score = game.getHandScore('yourHand', this.state['gameHand'][0])
          game.setHandScore('yourHand', score)
        } else {
          changedHand = game.doShowHand('oppoHand')
          this.setState({ oppoHand: changedHand })
          score = game.getHandScore('oppoHand', this.state['gameHand'][0])
          game.setHandScore('oppoHand', score)
        }
        game.doAdvancePlay()
        break

      case 'getCribScore':
        // copy all discarded cards to the gamehand and show it
        score = game.getCribScore()
        if (game.getItsYourCrib() === true) {
          points = game.getHandPoints('yourHand')
          game.setHandPoints('yourHand', score.points + points )
        }else{
          points = game.getHandPoints('oppoHand')
          game.setHandPoints('oppoHand', score.points + points  )
        }
        changedHand = game.doCopyCribToGameHand()
        this.setState({ gameHand: changedHand })
        game.doAdvancePlay()
        break

      case 'handCompleted':
        if (this.state['gameHand'][0].faceup === true) {
          this.setState(game.doStartNewGame())
        }
        break

      default:
        // do nothing
        break
    }
  }

  render() {
    // const means immutable, and allows for certain optimizations
    // let has block scope, let has function scope
    //const winner = game.getWinner(this.state);
    let instructions, getCurrentTotal, yourPoints = 0, oppoPoints = 0
    let status = 'this is what happened last...'
    let phase = game.getPhase()

    instructions = game.getInstruction(phase)
    status = game.getWhatHappenedLast()

    switch (phase) {
      case 'handCompleted':
        getCurrentTotal = 0
        oppoPoints = game.getHandPoints('oppoHand')
        yourPoints = game.getHandPoints('yourHand')
        break

      case 'playing':
        getCurrentTotal = game.getCurrentTotal()
        oppoPoints = game.getHandPoints('oppoHand')
        yourPoints = game.getHandPoints('yourHand')
        break

      default:
      getCurrentTotal = 0
      oppoPoints = game.getHandPoints('oppoHand')
      yourPoints = game.getHandPoints('yourHand')
      break
    }

    return (
      <div onClick={() => this.handleGameClick()}>
        <div className="card-row">
          <div className="status">
            {instructions}
          </div>
        </div>
        <hr />

        <div className="card-row">
          <div className="totalStatus">
            Total : {getCurrentTotal}
          </div>
          <div className="mystatus">
            You : {yourPoints}
          </div>
          <div className="oppoStatus">
            Opponent : {oppoPoints}
          </div>
        </div>
        <hr />

        <div className="card-row">
          {this.renderCard('oppoHand', 0)}
          {this.renderCard('oppoHand', 1)}
          {this.renderCard('oppoHand', 2)}
          {this.renderCard('oppoHand', 3)}
          {this.renderCard('oppoHand', 4)}
          {this.renderCard('oppoHand', 5)}
        </div>

        <div className="card-row">
          {this.renderCard('gameHand', 0)}
          {this.renderCard('gameHand', 1)}
          {this.renderCard('gameHand', 2)}
          {this.renderCard('gameHand', 3)}
          {this.renderCard('gameHand', 4)}
          {this.renderCard('gameHand', 5)}
          {this.renderCard('gameHand', 6)}
          {this.renderCard('gameHand', 7)}
          {this.renderCard('gameHand', 8)}
        </div>

        <div className="card-row">
          {this.renderCard('yourHand', 0)}
          {this.renderCard('yourHand', 1)}
          {this.renderCard('yourHand', 2)}
          {this.renderCard('yourHand', 3)}
          {this.renderCard('yourHand', 4)}
          {this.renderCard('yourHand', 5)}
        </div>

        <hr />

        <div className="status">
          {status}
        </div>
      </div>
    );
  }

  renderCard(whoseHand, cardNdx) {
    // marginLeft is position within the div, width is width of the div
    let card;
    let offsets;
    let width;
    let marginLeft;
    let marginTop;
    let marginBottom;
    let height = 156
    let visibility = 'inherit'

    

    if ( game.getFaceup( whoseHand, cardNdx ) === false ) {
      card = 'BB'
    } else {
      card = game.getValue( whoseHand, cardNdx )
    }

    if (card === undefined) {
      console.log("undefined whoseHand = %s cardNdx=%d", whoseHand, cardNdx)
      card = 'BB'
    }

    offsets = game.getCardoffsets(card)
    let bg = "url( 'card-deck.png') " + offsets.left + "px " + offsets.top + "px"

    switch (whoseHand) {
      case 'gameHand':
        //console.log( "renderCard whoseHand = %s cardNdx=%d card = %s", whoseHand, cardNdx, card)
        marginLeft = (cardNdx === 1) ? 50 : -1
        if (game.getItsYourCrib()) {
          marginTop = (cardNdx % 2) ? 0 : 10
        } else {
          marginTop = (cardNdx % 2) ? 10 : 0
        }
        marginBottom = 0

        if (cardNdx === 0) {
          // cut card
          width = 100
        } else {
          // partial cards for all that overlap ( all but the last one )
          width = (cardNdx === game.getLastPlayedIndex( whoseHand ) ) ? 100 : 65;
        }
        if (card === 'BB' && cardNdx > 0) {
          visibility = 'hidden'
        }
        break;

      case 'oppoHand':
      case 'yourHand':
        width = (cardNdx === game.getLastUnplayedIndex( whoseHand )) ? 100 : 65;
        marginLeft = (cardNdx === 0) ? 50 : -1
        if ( game.getPlayed(whoseHand, cardNdx) === true) {
          width = 0
          visibility = 'hidden'
        }
        break;

      default:
        break;
    }

    let styles = {
      card: {
        float: 'left',
        margin: 0,
        padding: 0,
        marginRight: 0,
        marginLeft: marginLeft,
        marginTop: marginTop,
        marginBottom: marginBottom,
        display: 'block',
        height: height,
        width: width,
        background: bg,
        visibility: visibility,
        outline: 'none'
      }
    }
    return <Card
      card={styles.card}
      onClick={() => this.handleCardClick(whoseHand, cardNdx)}
    />
  }
}

// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);
