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

const myWorker = new Worker("Ai.js");
var board;
var  names = ["","X","","O"];

window.onload = function(){
  board = new Board()
  initBoard();
};

function initBoard()
{
  document.body.innerHTML = "";
  var board_html = document.createElement("div");
  board_html.id = "board";

  //generate board
  for(var y = 0; y < 3; ++y)
    for(var x = 0; x < 3; ++x)
    {
      var chunk_html = document.createElement("div");
      chunk_html.className = "chunk";
      var chunk_text_html = document.createElement("div");
      chunk_text_html.className = "text";
      chunk_html.appendChild(chunk_text_html);
      for(var j = 0; j < 3; ++j)
        for(var i = 0; i < 3; ++i)
          {
            var cell_html = document.createElement("div");
            cell_html.className = "cell enabledCell";
            cell_html.id = i + j*3 + x*9 + y*27;
            cell_html.onclick = function(){click(this.id)};
            var text_html = document.createElement("div");
            text_html.className = "text";
            cell_html.appendChild(text_html);
            chunk_html.appendChild(cell_html);
          }
      board_html.appendChild(chunk_html);
    }

  evaluationBar_html = document.createElement("div");
  evaluationBar_html.id = "evaluation_bar";
  bar_html = document.createElement("div");
  bar_html.id = "bar";
  evaluationBar_html.appendChild(bar_html);
  var nTick = 5;
  for(var i = 1; i < nTick+1; ++i)
  {
    var tick_html = document.createElement("tick");
    tick_html.style.height = (i*100/(nTick+1)).toString().concat("%");
    evaluationBar_html.appendChild(tick_html);
  }

  board_html.appendChild(evaluationBar_html);

  document.body.appendChild(board_html);
}


function click(index_)
{
  if(!document.getElementById(index_).classList.contains("enabledCell") || board.turn != 1)
    return;

  board.makeMove(index_);
  updateView(board);
  setTimeout("aiMakeMove(board)",0);
}

function updateView(board_)
{
    var lastMove = board_.moves.at(-1);
    var enabledChunks = -1;

    if(lastMove == undefined)
      enabledChunks = -1;
    else if(board_.chunks[lastMove%9] == 0)
      enabledChunks = lastMove%9;
    else if(board.chunks[parseInt(lastMove/9)] == 0)
      enabledChunks = parseInt(lastMove/9);

    var result = board_.check(0,board_.chunks);


    for(var j = 0; j < 9; ++j)
    {
      var chunk_html = document.getElementById("board").childNodes[j];
      chunk_html.childNodes[0].innerHTML = names.at(board_.chunks[j]);
      if(board_.chunks[j] != 0)
        chunk_html.childNodes[0].style.zIndex = "3";
      else
        chunk_html.childNodes[0].style.zIndex = "1";

      for(var i = 0; i < 9; ++i)
      {
        var cell_html = document.getElementById(i+j*9);
        cell_html.childNodes[0].innerHTML = names.at(board_.cells[i+j*9]);
        cell_html.classList.remove("disabledCell");
        cell_html.classList.add("enabledCell");
        if(result != 0 || board_.chunks[j] != 0 || (enabledChunks != -1 && j != enabledChunks) || board_.cells[i+j*9] != 0)
        {
          cell_html.classList.remove("enabledCell");
          cell_html.classList.add("disabledCell");
        }
      }
    }
}

function updateBar(evaluation_)
{
  var evaluationClamp = Math.min(Math.max(evaluation_,-1000),1000);
  var height = 50 + evaluationClamp/20;
  var bar = document.getElementById("bar");
  bar.style.height = height.toString().concat("%");
}

function aiMakeMove(board_)
{
  if(board_.turn == 1)
    return;

  myWorker.postMessage(board_);

  myWorker.onmessage = function(e) {
    var tuple = e.data;
    board_.makeMove(tuple[0]);
    updateView(board_);
    updateBar(tuple[1]);
  }
}
