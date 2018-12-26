import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

var GamePlay = require('./gameplay.js').default;

var game = new GamePlay();

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
    this.state = game.newGame()
  }

  handleCardClick(whoseHand, cardNdx) {
    var changedHand, oppoNdx
    var gameHand = this.state['gameHand']
    var oppoHand = this.state['oppoHand']
    var yourHand = this.state['yourHand']

    switch (game.getPhase()) {
      case 'unstarted':
      case 'discarding':
        switch (whoseHand) {
          case 'yourHand':
            changedHand = game.discardCard(this.state[whoseHand], cardNdx)
            game.advancePlay()
            this.setState({ yourHand: changedHand })

            changedHand = game.opponentDiscards(this.state['oppoHand'])
            game.advancePlay()
            this.setState({ oppoHand: changedHand })

            if (game.getPhase() === 'playing') {
              changedHand = game.flipCard(this.state['gameHand'], 0)
              this.setState({ gameHand: changedHand })
              if (game.itsYourCrib() === true) {
                // opponent plays first
                oppoNdx = game.opponentChoosesCardToPlay(gameHand, oppoHand)
                game.copyCard(oppoHand[oppoNdx], gameHand)
                game.flipCard(gameHand, game.getLastPlayedIndex(gameHand))
              }
            }
            break

          default:
            break
        }
        break

      case 'scoreCribHand':
        break

      case 'playing':
        switch (whoseHand) {
          case 'yourHand':
            // TODO: support opponent moving first
            // in game play
            // copy the chosen card to the gamehand in the next open position
            // show the played card in the gameHand
            game.copyCard(yourHand[cardNdx], gameHand)

            // mark copied card as played to make it hide when it renders
            game.playCard(yourHand, cardNdx)
            game.advancePlay()

            // check to see if opponent can play lt 31, if so, do so
            // have your opponent make their play
            oppoNdx = game.opponentChoosesCardToPlay(gameHand, oppoHand)
            game.copyCard(oppoHand[oppoNdx], gameHand)
            game.flipCard(gameHand, game.getLastPlayedIndex(gameHand))

            // mark copied card as played to make it hide when it renders
            game.playCard(oppoHand, oppoNdx)
            game.advancePlay()

            this.setState({ gameHand: gameHand })
            this.setState({ oppoHand: oppoHand })
            this.setState({ yourHand: yourHand })
            break;

          case 'gameHand':
            if (cardNdx === 0) {
              this.setState(game.newGame())
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
    var changedHand, score, points

    // TODO: manage actions/changes in game state due do current phase of play
    //yourScore = game.scorePlayHand(this.state['yourHand'], this.state['gameHand'][0])
    //oppoScore = game.scorePlayHand(this.state['oppoHand'], this.state['gameHand'][0])
    //cribScore = game.scoreCribHand(this.state['yourHand'], this.state['oppoHand'], this.state['gameHand'][0])

    var phase = game.getPhase()
    switch (phase) {
      case 'gamePlayComplete':
        game.advancePlay()
        break

      case 'scoreNonDealerHand':
        // clear the gamehand
        changedHand = game.clearHand(this.state['gameHand'], 1)
        this.setState({ gameHand: changedHand })

        if (game.itsYourCrib() === false) {
          changedHand = game.showHand(this.state['yourHand'])
          this.setState({ yourHand: changedHand })
          score = game.scorePlayHand(changedHand, this.state['gameHand'][0])
          game.setHandScore('yourHand', score)
        } else {
          changedHand = game.showHand(this.state['oppoHand'])
          this.setState({ oppoHand: changedHand })
          score = game.scorePlayHand(changedHand, this.state['gameHand'][0])
          game.setHandScore('oppoHand', score)
        }
        game.advancePlay()
        break

      case 'scoreDealerHand':
        if (game.itsYourCrib() === true) {
          changedHand = game.showHand(this.state['yourHand'])
          this.setState({ yourHand: changedHand })
          score = game.scorePlayHand(changedHand, this.state['gameHand'][0])
          game.setHandScore('yourHand', score)
        } else {
          changedHand = game.showHand(this.state['oppoHand'])
          this.setState({ oppoHand: changedHand })
          score = game.scorePlayHand(changedHand, this.state['gameHand'][0])
          game.setHandScore('oppoHand', score)
        }
        game.advancePlay()
        break

      case 'scoreCribHand':
        // copy all discarded cards to the gamehand and show it
        score = game.scoreCribHand(this.state['yourHand'], this.state['oppoHand'], this.state['gameHand'][0])
        if (game.itsYourCrib() === true) {
          points = game.getHandPoints('yourHand')
          game.setHandPoints('yourHand', score.points + points )
        }else{
          points = game.getHandPoints('oppoHand')
          game.setHandPoints('oppoHand', score.points + points  )
        }
        changedHand = game.copyDiscardsToGameHand(this.state['oppoHand'], this.state['yourHand'], this.state['gameHand'])
        this.setState({ gameHand: changedHand })
        game.advancePlay()
        break

      case 'handCompleted':
        if (this.state['gameHand'][0].faceup === true) {
          this.setState(game.newGame())
        }
        break

      default:
        // do nothing
        break
    }
  }

  render() {
    // const means immutable, and allows for certain optimizations
    // let has block scope, var has function scope
    //const winner = game.calculateWinner(this.state);
    let instructions, currentTotal, yourPoints = 0, oppoPoints = 0
    var status = 'this is what happened last...'
    var phase = game.getPhase()

    instructions = game.getInstruction(phase)
    status = game.getWhatHappenedLast()

    /*
    render phase = scoreNonDealerHand instructions = Click to score your hand
    render phase = scoreDealerHand instructions = Click to score your opponents hand
    render phase = scoreCribHand instructions = Click to score score the crib
    render phase = handCompleted instructions = Click to start a new hand    
    */
    switch (phase) {
      case 'handCompleted':
        currentTotal = 0
        oppoPoints = game.getHandPoints('oppoHand')
        yourPoints = game.getHandPoints('yourHand')
        break


      default:
        currentTotal = game.currentTotal(this.state['gameHand'])
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
            Total : {currentTotal}
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
    var card;
    var offsets;
    var width;
    var marginLeft;
    var marginTop;
    var marginBottom;
    var height = 156
    var visibility = 'inherit'

    if (this.state[whoseHand][cardNdx].faceup === false) {
      card = 'BB'
    } else {
      card = this.state[whoseHand][cardNdx].value
    }

    if (card === undefined) {
      console.log("undefined whoseHand = %s cardNdx=%d", whoseHand, cardNdx)
      card = 'BB'
    }

    offsets = game.calculateCardoffsets(card)
    var bg = "url( 'card-deck.png') " + offsets.left + "px " + offsets.top + "px"

    switch (whoseHand) {
      case 'gameHand':
        marginLeft = (cardNdx === 1) ? 50 : -1
        if (game.itsYourCrib()) {
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
          width = (cardNdx === game.getLastPlayedIndex(this.state[whoseHand])) ? 100 : 65;
        }
        if (card === 'BB' && cardNdx > 0) {
          visibility = 'hidden'
        }
        break;

      case 'oppoHand':
      case 'yourHand':
        width = (cardNdx === game.getLastUnplayedIndex(this.state[whoseHand])) ? 100 : 65;
        marginLeft = (cardNdx === 0) ? 50 : -1
        if (this.state[whoseHand][cardNdx].played === true) {
          width = 0
          visibility = 'hidden'
        }
        break;

      default:
        break;
    }

    var styles = {
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
