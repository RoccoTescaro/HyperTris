class Board
{
  #player = 1;
  #ai = -1;
  turn = 1;
  chunks;
  cells;
  moves;

  constructor()
  {
    this.chunks = [0,0,0,0,0,0,0,0,0];
    this.cells = [ 0, 0, 0, 0, 0, 0, 0, 0, 0,
                   0, 0, 0, 0, 0, 0, 0, 0, 0,
                   0, 0, 0, 0, 0, 0, 0, 0, 0,
                   0, 0, 0, 0, 0, 0, 0, 0, 0,
                   0, 0, 0, 0, 0, 0, 0, 0, 0,
                   0, 0, 0, 0, 0, 0, 0, 0, 0,
                   0, 0, 0, 0, 0, 0, 0, 0, 0,
                   0, 0, 0, 0, 0, 0, 0, 0, 0,
                   0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    this.moves = new Array();
  }

  makeMove(index_)
  {
    this.moves.push(parseInt(index_));
    var chunkIndex = parseInt(index_/9);
    this.cells[index_] = this.turn;
    this.chunks[chunkIndex] = this.check(chunkIndex*9,this.cells);
    this.turn = -this.turn;
  }

  undoMove()
  {
    var lastMove = this.moves.pop();
    var chunkIndex = parseInt(lastMove/9);
    this.cells[lastMove] = 0;
    this.chunks[chunkIndex] = 0;
    this.turn = -this.turn;
  }

  check(base_,array_)
  {
    return this.#winner(base_,array_,0,1,2) || this.#winner(base_,array_,3,4,5) || this.#winner(base_,array_,6,7,8) ||
           this.#winner(base_,array_,0,3,6) || this.#winner(base_,array_,1,4,7) || this.#winner(base_,array_,2,5,8) ||
           this.#winner(base_,array_,0,4,8) || this.#winner(base_,array_,2,4,6) || this.#stalemate(base_,array_);
  }

  #winner(base_,array_,a_,b_,c_)
  {
    var possWinner = array_[base_+a_];
    if(possWinner == array_[base_+b_] && possWinner == array_[base_+c_])
      return possWinner;
    return 0;
  }

  #stalemate(base_,array_)
  {
    for(var i = base_; i < base_+9; ++i)
      if(array_[i] == 0) return 0;
    return 2;
  }

  generatePossibleMoves()
  {

    var lastMove = this.moves.at(-1);
    var possibleMoves = new Array();
    if(this.check(0,this.chunks) != 0)
      return possibleMoves;

    if(lastMove == undefined)
        for(var i = 0; i < 81; ++i)
          possibleMoves.push(i);
    else
    {
      var enabledChunk = -1;
      if(this.chunks[lastMove%9] == 0)
         enabledChunk = lastMove%9;
      else if(this.chunks[parseInt(lastMove/9)] == 0)
         enabledChunk = parseInt(lastMove/9);

      for(var i = 0; i < 81; ++i)
        if((enabledChunk == -1 || enabledChunk == parseInt(i/9)) && this.cells[i] == 0 && this.chunks[parseInt(i/9)] == 0)
          possibleMoves.push(i);
    }
    return possibleMoves;
  }

  evaluate()
  {
    var xMaterial = this.#countMaterial(this.#player);
    var oMaterial = this.#countMaterial(this.#ai);

    var evaluation = xMaterial - oMaterial;
    return evaluation;
  }

  #countMaterial(color_)
  {
    var score = 0;
    for(var i = 0; i < 9; ++i)
      score += this.#countChunkMaterial(color_,i*9,this.cells);

    score += this.#countChunkMaterial(color_,0,this.chunks) * 100;
    return score;
  }

  #countChunkMaterial(color_, base_, array_)
  {
    var score = 0;
    score += this.#evaluateLine(color_,base_,array_, 0, 0, 0, 1, 0, 2);  // row 0
    score += this.#evaluateLine(color_,base_,array_, 1, 0, 1, 1, 1, 2);  // row 1
    score += this.#evaluateLine(color_,base_,array_, 2, 0, 2, 1, 2, 2);  // row 2
    score += this.#evaluateLine(color_,base_,array_, 0, 0, 1, 0, 2, 0);  // col 0
    score += this.#evaluateLine(color_,base_,array_, 0, 1, 1, 1, 2, 1);  // col 1
    score += this.#evaluateLine(color_,base_,array_, 0, 2, 1, 2, 2, 2);  // col 2
    score += this.#evaluateLine(color_,base_,array_, 0, 0, 1, 1, 2, 2);  // diagonal
    score += this.#evaluateLine(color_,base_,array_, 0, 2, 1, 1, 2, 0);  // alternate diagonal
    return score;
  }

  #evaluateLine(color_, base_, array_, row1_,col1_,row2_,col2_,row3_,col3_)
  {
    var n = (array_[base_+row1_+col1_*3] != 0) +
            (array_[base_+row2_+col2_*3] != 0) +
            (array_[base_+row3_+col3_*3] != 0);

    var nCol = (array_[base_+row1_+col1_*3] == color_) + //- (chunks_[base_+row1_+col1_*3] == 3-color_)+
               (array_[base_+row2_+col2_*3] == color_) + //- (chunks_[base_+row2_+col2_*3] == 3-color_)+
               (array_[base_+row3_+col3_*3] == color_) ;//- (chunks_[base_+row3_+col3_*3] == 3-color_);

    if(nCol == 1 && n == 1)
      return 1;
    else if(nCol == 2 && n != 3)
      return 10;
    else if(nCol == 3)
      return 100;
    return 0;
  }

  generatePossibleTris()
  {
      var lastMove = this.moves.at(-1);
      var possibleTris = this.generatePossibleMoves();
      var base = parseInt(lastMove/9)*9;
      for(var i = 0; i < possibleTris.length; ++i)
      {
        var move = possibleTris[i];
        this.makeMove(move);
        if(this.check(base,this.cells)%2 == 0)
          possibleTris.splice(i,1);
        this.undoMove(move);
      }
      return possibleTris;
  }

}

onmessage = function(e) {
  const result = findBestMove(e.data[0],7);
  postMessage(workerResult);
}


function principalVariationSearch(board_, depth_, alpha_=-9999999, beta_=9999999)
{
  if(depth_ == 0)
    return board_.turn*board_.evaluate();

  var checkResult = board_.check(0,board_.chunks);
  if( checkResult != 0)
    return -9999999*(checkResult != 2); //return 0 if stalemate else 9999999

  var possibleMoves = board_.generatePossibleMoves();
  order(possibleMoves);

  for(var moveIndex = 0; moveIndex < possibleMoves.length; ++moveIndex)
  {
    var move = possibleMoves[moveIndex];
    var score;
    board_.makeMove(move);

    if(moveIndex == 0)
        score = -principalVariationSearch(board_, depth_ - 1, -beta_, -alpha_);
    else
    {
        score = -principalVariationSearch(board_, depth_ - 1, -alpha_ - 1, -alpha_);

        if(alpha_ < score && score < beta_)
          score = -principalVariationSearch(board_, depth_ - 1, -beta_, -score);
    }

    board_.undoMove();

    alpha_ = Math.max(alpha_, score);
    if(alpha_ >= beta_)
      break;
  }

  return alpha_;
}

function findBestMove(board_, depth_)
{
  var bestScore = -9999999;
  var bestMove = undefined;

  var possibleMoves = board_.generatePossibleMoves();
  order(possibleMoves);

  for(var moveIndex = 0; moveIndex < possibleMoves.length; ++moveIndex)
  {
    var move = possibleMoves[moveIndex];
    board_.makeMove(move);
    var score = -principalVariationSearch(board_,depth_);
    board_.undoMove();
    if(score > bestScore)
    {
      bestScore = score;
      bestMove = move;
    }

    //console.log(move,score);
  }

  return [bestMove,bestScore];

}

function order(possibleMoves_){
  var eval = [1,0,1,0,2,0,1,0,1];
  possibleMoves_.sort((a,b) =>
  {
    return eval[b%9]-eval[a%9];
  });
}
