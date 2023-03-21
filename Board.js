class Board
{
  #player = 1;
  #ai = -1;
  turn = 1;
  chunks;
  cells;
  moves;
  #zobristTable;
  transTable;

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
    this.#zobristTable = [[],[]];
    for(var i = 0; i < this.cells.length; ++i){
      this.#zobristTable[0].push(Math.floor(Math.random()*(Math.pow(2,64)-1)));//PLAYER
      this.#zobristTable[1].push(Math.floor(Math.random()*(Math.pow(2,64)-1)));//AI
    }
    this.transTable = new Object();
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

    score += this.#countChunkMaterial(color_,0,this.chunks) * 25;
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
    else if((nCol == 2 && n != 3) || (nCol == 1 && n == 3))
      return 5;
    else if(nCol == 3)
      return 25;
    return 0;
  }

  generatePossibleTris()
  {
    var possibleMoves = this.generatePossibleMoves();
    var possibleTris = new Array();
    for (var i = 0; i < possibleMoves.length; ++i) {
      var move = possibleMoves[i];
      this.makeMove(move);
      if (this.check(parseInt(move/9)*9, this.cells) % 2 != 0)
        possibleTris.push(move);
      this.undoMove();
    }
    //console.log(this.cells,possibleTris.length, possibleTris);
    return possibleTris;
  }

  computeHash(cells_)
  {
    var h = 0;
    for(var i = 0; i < cells_.length; i++)
    {
      if(cells_[i] == this.#player)
        h ^= this.#zobristTable[0][i];
      else if(cells_[i] == this.#ai)
        h ^= this.#zobristTable[1][i];
    }
    return h;
  }
  
  #transposition()
  {
	const transposed = [];

  	// Add the original board
  	transposed.push(this.cells);

  	// Generate the transpositions
  	let currentBoard = this.cells.slice();
  	for (let i = 0; i < 3; i++) 
	{
    		// Rotate the board 90 degrees
    		currentBoard = currentBoard.map((cell, index) => {
      		const row = Math.floor(index / 9);
      		const col = index % 9;
      		const newRow = col;
      		const newCol = 8 - row;
      		const newIndex = newRow * 9 + newCol;
      		return this.cells[newIndex];
    	});
    	transposed.push(currentBoard.slice());

    	// Reflect the board horizontally
    	currentBoard = currentBoard.map((cell, index) => {
      		const row = Math.floor(index / 9);
      		const col = index % 9;
      		const newRow = row;
      		const newCol = 8 - col;
      		const newIndex = newRow * 9 + newCol;
      		return this.cells[newIndex];
    	});
    	transposed.push(currentBoard.slice());
  	}

  	return transposed;
  }

  ttSave(depth_, value_, flag_, move_)
  {
	var boards = this.#transposition();
	boards.push(this.cells);
	boards.forEach(element => 
		{
		  var hash = this.computeHash(element);
    		  if(this.transTable[hash] != null && this.transTable[hash].depth > depth_) 
        		return;
    
    		 this.transTable[hash] = {
      			depth : depth_,
      			evaluation : value_,
      			flag: flag_,
      			bestMove : move_ 
    			};
		});
  }

  ttProbe(depth_, alpha_, beta_, move_)
  {
    var hash = this.computeHash(this.cells);
    if(this.transTable[hash] != null)
    {
      move_ = this.transTable[hash].bestMove;
      
      if (this.transTable[hash].depth >= depth_) 
      {

        if (this.transTable[hash].flag == "TT_EXACT")
          return this.transTable[hash].evaluation;

        if ((this.transTable[hash].flag == "TT_ALPHA") && (this.transTable[hash].evaluation <= alpha_))
          return alpha_;

        if ((this.transTable[hash].flag == "TT_BETA") && (this.transTable[hash].evaluation >= beta_))
          return beta_;

      }
    }

    return null;
  }
}
