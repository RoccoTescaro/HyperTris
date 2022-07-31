importScripts("Board.js");
var board = new Board();
var targetDepth = 10;

onmessage = function(e) {
  board.makeMove(e.data);
  var bestMove;
  console.log("new search");
  for(var i = 1; i <= targetDepth; i++){
    bestMove = findBestMove(board,i); //its a tuple
    console.log("depth ", i, ": bestMove = ", bestMove[0], ", evaluation = ", bestMove[1]);
    this.postMessage(["BAR", bestMove[1]])
  }
  board.makeMove(bestMove[0]);
  postMessage(["MOVE", bestMove[0]]);
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
    var score = -pvsWithZWSearch(board_,depth_);
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

function order(possibleMoves_, board_=null){
  var eval = [1,0,1,0,2,0,1,0,1];
  possibleMoves_.sort((a,b) =>
  {
    if(board_ != null)
    {
      board_.makeMove(a);
      var hashA = board_.computeHash();
      board_.undoMove();

      board_.makeMove(b);
      var hashB = board_.computeHash();
      board_.undoMove();

      if(board_.transTable[hashA] != null && board_.transTable[hashB] != null)
        return board_.transTable[hashB].evaluation - board_.transTable[hashA].evaluation;
    }

    return (eval[b%9]+eval[parseInt(b/9)])-(eval[a%9]+eval[parseInt(a/9)]);
  });
}

//PVS SEARCH
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

//PVS with ZWSEARCH AND QUIESCE
function pvsWithZWSearch( board_, depth_, alpha_=-9999999, beta_=9999999)
{
  var score = board_.ttProbe(depth_, alpha_, beta_, null);
  var flag = "TT_ALPHA";
  var bestMove;

  if(depth_ == 0)
    return quiesce(board_, alpha_, beta_);

  var checkResult = board_.check(0,board_.chunks); //maybe its just better to add this to evaluate function
  if( checkResult != 0)
    return (-9999999+board_.moves.length)*(checkResult != 2); 

  if(score != null && score > alpha_ && score < beta_) //TT cutoff
    return score;

  var bSearchPV = true;
  var possibleMoves = board_.generatePossibleMoves();
  order(possibleMoves, board_);
  bestMove = possibleMoves[0];
  for(var moveIndex = 0; moveIndex < possibleMoves.length; ++moveIndex)
  {
    var move = possibleMoves[moveIndex];
    board_.makeMove(move);

    if (bSearchPV)
      score = -pvsWithZWSearch(board_, depth_ - 1, -beta_, -alpha_);
    else {
      score = -zwSearch(board_, -alpha_, depth_ - 1);
      if (score > alpha_)
        score = -pvsWithZWSearch(board_, depth_ - 1, -beta_, -alpha_);
    }

    if (score >= beta_)
    {
      board_.ttSave(depth_,score,"TT_BETA",bestMove);
      board_.undoMove();
      return beta_;
    }

    if (score > alpha_)
    {
      alpha_ = score;
      bestMove = move;
      board_.ttSave(depth_,score,"TT_ALPHA",bestMove);
    }

    bSearchPV = false;
    board_.undoMove();
  }

  board_.ttSave(depth_,score,"TT_EXACT",bestMove);
  return alpha_;
}

function zwSearch(board_, beta_, depth_)
{
  if(depth_ == 0)
    return quiesce(board_, beta_-1, beta_);

  var possibleMoves = board_.generatePossibleMoves();
  order(possibleMoves, board_);
  for(var moveIndex = 0; moveIndex < possibleMoves.length; ++moveIndex)
  {
      var move = possibleMoves[moveIndex];
      board_.makeMove(move);
      var score = -zwSearch(board_, 1 - beta_, depth_ - 1);
      board_.undoMove();
      if(score >= beta_)
        return beta_;
  }
  return beta_ -1;
}

function quiesce(board_, alpha_, beta_)
{
  var eval = board_.turn*board_.evaluate();
  if(eval >= beta_)
    return beta_;
  if(eval > alpha_)
    alpha_ = eval;

  var possibleTris = board_.generatePossibleTris();
  order(possibleTris, board_);
  for(var moveIndex = 0; moveIndex < possibleTris.length; moveIndex++)
  {
    var move = possibleTris[moveIndex];
    board_.makeMove(move);
    eval = -quiesce(board_,-beta_,-alpha_);
    board_.undoMove();
    if(eval >= beta_)
      return beta_;
    if(eval > alpha_)
      alpha_ = eval;
  }

  return alpha_;
}


