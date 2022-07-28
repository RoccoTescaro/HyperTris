importScripts("Board.js");
var board = new Board();

onmessage = function(e) {
  board.makeMove(e.data);
  var bestMove = findBestMove(board,5);
  board.makeMove(bestMove);
  postMessage(bestMove);
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
    return (eval[b%9]+eval[parseInt(b/9)])-(eval[a%9]+eval[parseInt(a/9)]);
  });
}

function quiesce(board_, alpha_, beta_)
{
  var stand_path = evaluate(board_);
  if(stand_path >= beta_)
    return beta_;
  alpha_ = Math.max(alpha_, stand_path);

  var possibleTris = generatePossibleTris(board_);
  for(var moveIndex = 0; moveIndex < possibleTris.length; ++moveIndex)
  {
    var move = possibleTris[moveIndex];
    makeMove(board_, move);
    var score = -quiesce(board_,-beta_,-alpha_);
    undoMove(board_);
    if(score >= beta_)
      return beta_;
    alpha_ = Math.max(alpha_, score);
  }

  return alpha_;
}

function pvsWithZWSearch( board_, depth_, alpha_=-9999999, beta_=9999999)
{
  if(depth_ == 0)
    return quiesce(board_, alpha_, beta_);

  var bSearchPV = true;
  var possibleMoves = generatePossibleMoves(board_);
  order(possibleMoves);

  for(var moveIndex = 0; moveIndex < possibleMoves.length; ++moveIndex)
  {
      var move = possibleMoves[moveIndex];
      var score;
      makeMove(board_, move);

      if(bSearchPV)
        score = -pvsWithZWSearch(board_, depth_ - 1, -beta_, -alpha_);
      else
      {
        score = -zwSearch(board_, -alpha_, depth_-1);
        if(score > alpha_)
          score = -pvsWithZWSearch(board_, depth_ - 1, -beta_, -alpha_);
      }

      undoMove(board_);

      if(score >= beta_)
        return beta_;

      if(score > alpha_)
      {
          alpha_ = score;
          bSearchPV = false;
      }

  }

  return alpha_;
}

function zwSearch(board_, beta_, depth_)
{
  if(depth_ == 0)
    return quiesce(board_, beta_-1, beta_);

  var possibleMoves = generatePossibleMoves(board_);
  order(possibleMoves);
  for(var moveIndex = 0; moveIndex < possibleMoves.length; ++moveIndex)
  {
      var move = possibleMoves[moveIndex];
      makeMove(board_, move);
      var score = -zwSearch(1 - beta_, depth_ - 1);
      undoMove(board_);
      if(score >= beta_)
        return beta_;
  }
  return beta_ -1;
}
