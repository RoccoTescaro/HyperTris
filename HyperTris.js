const myWorker = new Worker("Ai.js");
var board = new Board();
var  names = ["","X","","O"];
initBoard();


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
  var nTick = 4;
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
  aiMakeMove(index_);
  //setTimeout("aiMakeMove(index_)",0);
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
  var mapEval = 3*Math.pow(Math.abs(evaluation_),0.125) + 4.75*Math.pow(Math.abs(evaluation_),0.25);
  var height = 50 + mapEval*Math.sign(evaluation_);
  var bar = document.getElementById("bar");
  bar.style.height = height.toString().concat("%");
}

function aiMakeMove(index_)
{
  if(board.turn == 1) //make a function to verify if is player turn
    return;

  myWorker.postMessage(index_);

  myWorker.onmessage = function(e) {
    var tuple = e.data;
    if(tuple[0] == "BAR")
      updateBar(tuple[1]);
    else if(tuple[0] == "MOVE")
    {
      board.makeMove(tuple[1]);
      updateView(board);
    }
  }
}
