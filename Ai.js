importScripts("Board.js");
var board = new Board();

onmessage = function(e) {
  board.makeMove(e.data);
  var bestMove = findBestMove(board,5); //its a tuple
  board.makeMove(bestMove[0]);
  postMessage(bestMove);
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

function order(possibleMoves_){
  var eval = [1,0,1,0,2,0,1,0,1];
  possibleMoves_.sort((a,b) =>
  {
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

//PVS with QUIESCE
/*function pvsWithQuiesceSearch(board_, depth_, alpha_, beta_) {
  if( depth_ == 0 ) 
    return quiesce( board_, alpha_, beta_ );

  var bSearchPv = true;
  var possibleMoves = board_.generatePossibleMoves();
  order(possibleMoves);
  
  for ( all moves)  {
     make
     if ( bSearchPv ) {
        score = -pvSearch(-beta, -alpha, depth - 1);
     } else {
        score = -pvSearch(-alpha-1, -alpha, depth - 1);
        if ( score > alpha ) // in fail-soft ... && score < beta ) is common
           score = -pvSearch(-beta, -alpha, depth - 1); // re-search
     }
     unmake
     if( score >= beta )
        return beta;   // fail-hard beta-cutoff
     if( score > alpha ) {
        alpha = score; // alpha acts like max in MiniMax
        bSearchPv = false;  // *1)
     }
  }
  return alpha; // fail-hard
}*/

//PVS with ZWSEARCH AND QUIESCE
function pvsWithZWSearch( board_, depth_, alpha_=-9999999, beta_=9999999)
{
  if(depth_ == 0)
    return quiesce(board_, alpha_, beta_);

  var bSearchPV = true;
  var possibleMoves = board_.generatePossibleMoves();
  order(possibleMoves);

  for(var moveIndex = 0; moveIndex < possibleMoves.length; ++moveIndex)
  {
    var move = possibleMoves[moveIndex];
    var score;
    board_.makeMove(move);

    if (bSearchPV)
      score = -pvsWithZWSearch(board_, depth_ - 1, -beta_, -alpha_);
    else {
      score = -zwSearch(board_, -alpha_, depth_ - 1);
      if (score > alpha_)
        score = -pvsWithZWSearch(board_, depth_ - 1, -beta_, -alpha_);
    }

    board_.undoMove();

    if (score >= beta_)
      return beta_;

    if (score > alpha_)
      alpha_ = score;

    bSearchPV = false;

  }

  return alpha_;
}

function zwSearch(board_, beta_, depth_)
{
  if(depth_ == 0)
    return quiesce(board_, beta_-1, beta_);

  var possibleMoves = board_.generatePossibleMoves();
  order(possibleMoves);
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
  var checkResult = board_.check(0,board_.chunks);
  if( checkResult != 0)
    return -9999999*(checkResult != 2); 

  var stand_path = board_.evaluate();
  if(stand_path >= beta_)
    return beta_;
  alpha_ = Math.max(alpha_, stand_path);

  var possibleTris = board_.generatePossibleTris();
  //console.log(possibleTris.length);
  for(var moveIndex = 0; moveIndex < possibleTris.length; ++moveIndex)
  {
    var move = possibleTris[moveIndex];
    board_.makeMove(move);
    var score = -quiesce(board_,-beta_,-alpha_);
    board_.undoMove();
    if(score >= beta_)
      return beta_;
    alpha_ = Math.max(alpha_, score);
  }

  return alpha_;
}


