//choose of program rgime: one/more
$('input[@name=regime]').click(function(){
    var regime = $('input[@name=regime]:checked').val();
    $('#more_options').empty();
    if(regime == 'more')
    {
        $('#more_options').append('<p><b>Number of executions:<b>\n\
        <input type="text" size="6" name="num_of_executions" value="5"></input></p>');
    }
});
//execute program
$("button").click(function(){
    $('#field').empty();

    var beams = $('select[@name=beams]').val(); //number of beams
    var regime = $('input[@name=regime]:checked').val();    //type of regime
    var num_of_executions = 0;
    var number_of_boards = 0;
    var number_of_iterations = 0;

    if(regime == 'more')
    {
        num_of_executions = $('input[@name=num_of_executions]').val();
        //execute program num_of_executions times and save statistic results
        for(var i = 0; i < num_of_executions; i++)
        {
            var sched = new Scheduler(beams, regime);
            sched.schedule();
            number_of_boards += sched.number_of_boards;
            number_of_iterations += sched.number_of_iterations;
        }

    }else if(regime == 'one')   
    {
        var sched = new Scheduler(beams, regime);
        sched.schedule();
        num_of_executions = 1;
        number_of_boards = sched.number_of_boards;
        number_of_iterations = sched.number_of_iterations;
    }
    //show statistic of execution
    drawStatistics(beams, num_of_executions, number_of_iterations, number_of_boards);
  });
  var drawStatistics = function(beam, exec, iter, boards)
  {
    var avr_iter = (iter/exec).toFixed(0);
    var avr_boards = (boards/exec).toFixed(0);
    var div = $('<div id="stat"></div>');
    div.append('<h1>Statistics</h1><p></p>');
    div.append('<p></p>');
    div.append('<p><b>Number of beams: </b> ' + beam + '</p><p></p>');
    div.append('<p></p>');
    div.append('<p><b>Number of executions: </b> ' + exec + '</p><p></p>');
    div.append('<p></p>');
    div.append('<p></p>');
    div.append('<p><b>Number of boards:</b> ' + boards + '</p><p></p>');
    div.append('<p></p>');
    div.append('<p><b>Number of iterations: </b> ' + iter + '</p><p></p>');
    div.append('<p></p>');
    div.append('<p><b>Average number of boards: </b> ' + avr_boards + '</p><p></p>');
    div.append('<p></p>');
    div.append('<p><b>Average number of iterations:</b> ' + avr_iter + '</p><p></p>');
    $('#field').append(div);
  }
//class for scheduling all actions of algorithm
function Scheduler (beam, regime)
{
    this.beam = beam;
    this.regime = regime;
    this.successor = new Array();   //array for saving boards(Board class)
    this.number_of_iterations = 0;
    this.number_of_boards = 0;
    this.schedule = function()
    {
        //start - make first board
        this.successor = [];
        this.successor[0] = new Board(0); 
        this.successor[0].generate();   //generate new random board
        this.successor[0].evaluateF();  //count number of mutual hits on this board - f
        if(this.regime == 'one')
            this.successor[0].drawBoard();
        //find successors untill find successor without mutual hits - f
        for(var i = 1; this.successor[0].f != 0 && i < 300; i++)
        {
            this.findSuccessors(i);
            this.number_of_iterations++;      
        }
    };
    this.findSuccessors = function(iter)
    {
        if(this.regime == 'one')
            $('#field').append('<div class="iteration">Iteration#' + iter + '</div>');
        this.makeSuccessors();  //generate new successors
        this.sortSuccessors();  //sort by f
        this.successor.splice(this.beam);   //save only beam number of successors
        for(var i = 0; i < this.successor.length; i++)  //draw this iteration
        {
            this.successor[i].num = i;
            this.successor[i].iteration = iter;
            if(this.regime == 'one')
                this.successor[i].drawBoard();
        }
    };
    //choose figure for new iteration
    this.figureRandom = function()
    {
        if(Math.floor(Math.random()*5) < 3) //queen
        {
            return Math.floor(Math.random()*9);
        }else                           //pawn
        {
            return Math.floor(Math.random()*2)+9;
        }
    };
    this.makeSuccessors = function()
    {
        var ancestor_num = this.successor.length;
        var pos = this.figureRandom();
        for(var i = 0; i < ancestor_num; i++)
        {
            this.successor.push.apply(this.successor, this.successor[0].makeSuccessors(pos));
            this.successor.splice(0,1); //delete ancestor
        }
        this.number_of_boards += this.successor.length;
        this.deleteClones();
    };
    this.deleteClones = function()
    {
            for(var i = 0; i < this.successor.length; i++)
                for(var j = 0; j < this.successor.length; j++)
                    if(this.successor[i].f == this.successor[j].f && this.successor[i].equal(this.successor[j]) && i != j)
                    {
                        this.successor.splice(j,1);
                        j--;
                    }  
    };
    this.sortSuccessors = function()
    {
        var tmp = new Board();
        for(var i = 0; i < this.successor.length; i++)
            for(var j = 0; j < this.successor.length; j++)
                if(this.successor[i].f < this.successor[j].f)
                {
                    tmp = this.successor[i];
                    this.successor[i] = this.successor[j];
                    this.successor[j] = tmp;
                }
    }
}
//class for board
function Board (num)
{
    this.num = num; //number of board
    this.iteration; //number of iteration
    this.div;       //container for drawing
    this.table;     //table for drawing
    //position of queens
    this.xQ = new Array(9);
    this.yQ = new Array(9);
    //position of pawns
    this.xP = new Array(2);
    this.yP = new Array(2);
    //history - positions of figure which position was changed to create this board
    this.lastX;
    this.lastY;
    this.newX;
    this.newY;

    this.f = 0;//assesment of arrangement: the lower-the better->0
    //check if boards are equal
    this.equal = function(board)
    {
        var counter = 0;
        for(var i = 0; i < 9; i++)
            if( board.hasQ(this.xQ[i], this.yQ[i]) )
                counter++;
        for(var i = 0; i < 2; i++)
            if( board.hasP(this.xP[i], this.yP[i]) )
                counter++;
        if(counter == 11)
            return true;
        else
            return false;
    };
    //boards have the same queen
    this.hasQ = function(x,y)
    {
        for(var j = 0; j < 9; j++)
            if(this.xQ[j] == x && this.yQ[j] == y)
                return true;
        return false;
    };
    //boards have the same pawn
    this.hasP = function(x,y)
    {
        for(var j = 0; j < 2; j++)
            if(this.xP[j] == x && this.yP[j] == y)
                return true;
        return false;
    };
    //generate new(first) board
    this.generate = function()
    {
        for(var i = 0; i < 9; i++)
        {
            var check;
            do{
                check = 0;
                
                this.xQ[i] = Math.floor(Math.random() * 8);
                this.yQ[i] = Math.floor(Math.random() * 8);

                //checking for no matches on board
                for(var j = 0; j < i; j++)
                    if(this.xQ[i] == this.xQ[j] && 
                        this.yQ[i] == this.yQ[j])
                    {
                        check = 1;
                    }
            }while(check);
        }

        for(var i = 0; i < 2; i++)
        {
            //var check;
            do{
                check = 0;
            
                this.xP[i] = Math.floor(Math.random() * 8);
                this.yP[i] = Math.floor(Math.random() * 8);
                
                for(var j = 0; j < 9; j++)
                    if(this.xP[i] == this.xQ[j] && 
                        this.yP[i] == this.yQ[j])
                        check = 1;
                
                    if(this.xP[0] == this.xP[1] && 
                        this.yP[0] == this.yP[1])
                        check = 1;
            }while(check);    
        }
    };
    //count mutual hits
    this.evaluateF = function()
    {
        this.f = 0;
        for(var i = 0; i < 9; i++)
        {
            //in row
            this.f += this.hitsInRow(i);
            //in column
            this.f += this.hitsInColumn(i);
            //in diagonal
            this.f += this.hitsInDiagonal(i);
        }
    };
    this.hitsInDiagonal = function(i)
    {
        var hits = 0;
        for(var j = 0; j < 9; j++)
            if(Math.abs(this.xQ[j] - this.xQ[i]) == Math.abs(this.yQ[j] - this.yQ[i])
                    && i != j)
            {
                var bump = 0;
                hits++;
               
                for(var k = 0; k < 2; k++)
                   if(Math.abs(this.xQ[i] - this.xP[k]) == Math.abs(this.yQ[i] - this.yP[k]) &&
                      Math.abs(this.xQ[j] - this.xP[k]) == Math.abs(this.yQ[j] - this.yP[k]) &&
                      this.between(this.yQ[i], this.yQ[j], this.yP[k]))
                   {
                        bump = 1;
                   }
             
                hits -= bump;
                
            }
        return hits;
    };
    this.hitsInRow = function(i)
    {
        var hits = 0;
        for(var j = 0; j < 9; j++)
            if( this.xQ[j] == this.xQ[i] && i != j)
            {
                var bump = 0;
                hits++;
                
                for(var k = 0; k < 2; k++)
                    if(this.xQ[i]==this.xP[k] && 
                    this.between(this.yQ[i], this.yQ[j], this.yP[k]))
                      {
                           bump = 1;
                      }
                       
                
                hits -= bump;
            }
        return hits;
    };
    this.hitsInColumn = function(i)
    {
        var hits = 0;
        for(var j = 0; j < 9; j++)
            if(this.yQ[j] == this.yQ[i] && i != j)
            {
                var bump = 0;
                hits++;
                
                for(var k = 0; k < 2; k++)
                    if(this.yQ[i] == this.yP[k] && 
                       this.between(this.xQ[i], this.xQ[j], this.xP[k]))
                      {
                          bump = 1;
                      }
                        
                
                hits -= bump;
            }
        return hits;
    };
    //check if middle between a and b. Used to check if pawn or queen is between queens
    this.between = function(a,b,middle)
    {
        if(a > middle && middle > b)
            return true;
        else if( b > middle && middle > a)
            return true;
        else
            return false;
    };
    this.drawBoard = function()
    {
        this.createBoard();
        this.addFigures();
        this.showLastStep();
    };
    this.showLastStep = function()
    {
        $('#'+this.table.attr('id')+'_'
                +this.lastX+'_'+this.lastY).addClass(' contour_last');
        $('#'+this.table.attr('id')+'_'
                +this.newX+'_'+this.newY).addClass(' contour_new');
    };
    this.createBoard = function()
    {
        this.div = $('<div></div>').addClass('board'); 
        this.div.append('<p><b>Number of mutual hits:</b>'+this.f+'</p>');
        //------------------board-----------------------
        this.table = $('<table></table>').attr('id', 't'+this.num+'i'+this.iteration);
        for(var i = 0; i < 8; i++)
        {
           var row = $('<tr></tr>');
           for(var j = 0; j < 8; j++)
           {
               var cell = $('<td></td>').attr('id', this.table.attr('id')+'_'+i+'_'+j);
               if( isEven(i + j) )
                   cell.addClass("black");
               else
                   cell.addClass("white");
               row.append(cell);
           }
           this.table.append(row);
        }
        this.div.append(this.table);
        $('#field').append(this.div); 
    };
    this.addFigures = function()
    {
        for(var i = 0; i < 9; i++)
        {
            $('#'+this.table.attr('id')+'_'
                +this.xQ[i]+'_'+this.yQ[i]).addClass(' queen');
        }
        for(var i = 0; i < 2; i++)
        {
            $('#'+this.table.attr('id')+'_'
                +this.xP[i]+'_'+this.yP[i]).addClass(' pawn');
        }
    };
    this.makeSuccessors = function(position)
    {
        var successor = new Array();
        if(position % 11 < 9)//queen
        {
            var pos = position % 11;
            var number = 0;
            for(var m = 0; m < 8; m++)
                for(var n = 0; n < 8; n++)
                    if(this.newPos(m, n))
                    {
                        number++;
                        
                        var new_pos = new Board();
                        //cloning
                        new_pos.xQ = this.xQ.slice(0);
                        new_pos.xP = this.xP.slice(0);
                        new_pos.yQ = this.yQ.slice(0);
                        new_pos.yP = this.yP.slice(0);
                        
                        new_pos.lastX = new_pos.xQ[pos];
                        new_pos.lastY = new_pos.yQ[pos];
                        new_pos.newX = m;
                        new_pos.newY = n;
                        new_pos.xQ[pos] = m;
                        new_pos.yQ[pos] = n;
                        new_pos.evaluateF();
                        successor.push(new_pos);
                    }
             return successor;
        }
        else //pawn
        {
            var pos = position%11 - 9;
            var number=0;
            for(var m = 0; m < 8; m++)
                for(var n = 0; n < 8; n++)
                    if(this.newPos(m, n))
                    {
                        number++;
                        
                        var new_pos = new Board();
                        //cloning
                        new_pos.xQ = this.xQ.slice(0);
                        new_pos.xP = this.xP.slice(0);
                        new_pos.yQ = this.yQ.slice(0);
                        new_pos.yP = this.yP.slice(0);
                        
                        new_pos.lastX = new_pos.xP[pos];
                        new_pos.lastY = new_pos.yP[pos];
                        new_pos.newX = m;
                        new_pos.newY = n;
                        new_pos.xP[pos] = m;
                        new_pos.yP[pos] = n;
                        new_pos.evaluateF();
                        successor.push(new_pos);
                    }
             return successor;
        }
    };
    this.newPos = function(x, y)
    {
        for(var i = 0; i < 9; i++)
            if(this.xQ[i] == x && this.yQ[i] == y)
                return false;
        for(var i = 0; i < 2; i++)
            if(this.xP[i] == x && this.yP[i] == y)
                return false;
        return true;
    };
}
var isEven = function(someNumber){
    return (someNumber%2 == 0) ? true : false;
};