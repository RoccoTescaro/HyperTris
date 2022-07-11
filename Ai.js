importScripts("Board.js");

function makeMove(board_, index_)
{
  board_.moves.push(parseInt(index_));
  var chunkIndex = parseInt(index_/9);
  board_.cells[index_] = board_.turn;
  board_.chunks[chunkIndex] = board_.check(board_,chunkIndex*9,board_.cells);
  board_.turn = -board_.turn;
}

function undoMove(board_)
{
  var lastMove = board_.moves.pop();
  var chunkIndex = parseInt(lastMove/9);
  board_.cells[lastMove] = 0;
  board_.chunks[chunkIndex] = 0;
  board_.turn = -board_.turn;
}

function check(board_,base_,array_)
{
  return winner(base_,array_,0,1,2) || winner(base_,array_,3,4,5) || winner(base_,array_,6,7,8) ||
         winner(base_,array_,0,3,6) || winner(base_,array_,1,4,7) || winner(base_,array_,2,5,8) ||
         winner(base_,array_,0,4,8) || winner(base_,array_,2,4,6) || stalemate(base_,array_);
}

function winner(base_,array_,a_,b_,c_)
{
  var possWinner = array_[base_+a_];
  if(possWinner == array_[base_+b_] && possWinner == array_[base_+c_])
    return possWinner;
  return 0;
}

function stalemate(base_,array_)
{
  for(var i = base_; i < base_+9; ++i)
    if(array_[i] == 0) return 0;
  return 2;
}

function generatePossibleMoves(board_)
{

  var lastMove = board_.moves.at(-1);
  var possibleMoves = new Array();
  if(check(board_,0,board_.chunks) != 0)
    return possibleMoves;

  if(lastMove == undefined)
      for(var i = 0; i < 81; ++i)
        possibleMoves.push(i);
  else
  {
    var enabledChunk = -1;
    if(board_.chunks[lastMove%9] == 0)
       enabledChunk = lastMove%9;
    else if(board_.chunks[parseInt(lastMove/9)] == 0)
       enabledChunk = parseInt(lastMove/9);

    for(var i = 0; i < 81; ++i)
      if((enabledChunk == -1 || enabledChunk == parseInt(i/9)) && board_.cells[i] == 0 && board_.chunks[parseInt(i/9)] == 0)
        possibleMoves.push(i);
  }
  return possibleMoves;
}

function evaluate()
{
  var xMaterial = countMaterial(board_,1);
  var oMaterial = countMaterial(board_,-1);

  var evaluation = xMaterial - oMaterial;
  return evaluation;
}

function countMaterial(board_,color_)
{
  var score = 0;
  for(var i = 0; i < 9; ++i)
    score += countChunkMaterial(color_,i*9,board_.cells);

  score += countChunkMaterial(color_,0,board_.chunks) * 100;
  return score;
}

function countChunkMaterial(color_, base_, array_)
{
  var score = 0;
  score += evaluateLine(color_,base_,array_, 0, 0, 0, 1, 0, 2);  // row 0
  score += evaluateLine(color_,base_,array_, 1, 0, 1, 1, 1, 2);  // row 1
  score += evaluateLine(color_,base_,array_, 2, 0, 2, 1, 2, 2);  // row 2
  score += evaluateLine(color_,base_,array_, 0, 0, 1, 0, 2, 0);  // col 0
  score += evaluateLine(color_,base_,array_, 0, 1, 1, 1, 2, 1);  // col 1
  score += evaluateLine(color_,base_,array_, 0, 2, 1, 2, 2, 2);  // col 2
  score += evaluateLine(color_,base_,array_, 0, 0, 1, 1, 2, 2);  // diagonal
  score += evaluateLine(color_,base_,array_, 0, 2, 1, 1, 2, 0);  // alternate diagonal
  return score;
}

function evaluateLine(color_, base_, array_, row1_,col1_,row2_,col2_,row3_,col3_)
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


onmessage = function(e) {
  const result = findBestMove(JSON.parse(e.data),7);
  postMessage(workerResult);
}


function principalVariationSearch(board_, depth_, alpha_=-9999999, beta_=9999999)
{
  if(depth_ == 0)
    return board_.turn*evaluate(board_);

  var checkResult = check(board_,0,board_.chunks);
  if( checkResult != 0)
    return -9999999*(checkResult != 2); //return 0 if stalemate else 9999999

  var possibleMoves = generatePossibleMoves(board_);
  order(possibleMoves);

  for(var moveIndex = 0; moveIndex < possibleMoves.length; ++moveIndex)
  {
    var move = possibleMoves[moveIndex];
    var score;
    makeMove(board_, move);

    if(moveIndex == 0)
        score = -principalVariationSearch(board_, depth_ - 1, -beta_, -alpha_);
    else
    {
        score = -principalVariationSearch(board_, depth_ - 1, -alpha_ - 1, -alpha_);

        if(alpha_ < score && score < beta_)
          score = -principalVariationSearch(board_, depth_ - 1, -beta_, -score);
    }

    undoMove(board_);

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

  var possibleMoves = generatePossibleMoves(board_);
  order(possibleMoves);

  for(var moveIndex = 0; moveIndex < possibleMoves.length; ++moveIndex)
  {
    var move = possibleMoves[moveIndex];
    makeMove(board_,move);
    var score = -principalVariationSearch(board_,depth_);
    undoMove(board_);
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
