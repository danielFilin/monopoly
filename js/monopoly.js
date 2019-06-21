var Monopoly = {};
Monopoly.allowRoll = true;
Monopoly.moneyAtStart = 10;
Monopoly.doubleCounter = 0;


// initiates the game; 
Monopoly.init = function(){
    $(document).ready(function(){
        Monopoly.adjustBoardSize();
        $(window).bind("resize",Monopoly.adjustBoardSize);
        Monopoly.initDice();
        Monopoly.initPopups();
        Monopoly.start();        
    });

    
};

//Show Welcome message
Monopoly.start = function(){
    Monopoly.showPopup("intro")
};


//Initiates the dice board
Monopoly.initDice = function(){
    $(".dice").click(function(){
        if (Monopoly.allowRoll){
            Monopoly.rollDice();
        }
    });
};

// function that checks the current player that is plying at the moment
Monopoly.getCurrentPlayer = function(){
    return $(".player.current-turn");
};

// check whom a certain cell belongs
Monopoly.getPlayersCell = function(player){
    return player.closest(".cell");
 
};

// checks the amount of money that belongs to the active player
Monopoly.getPlayersMoney = function(player){
    return parseInt(player.attr("data-money"));
};

// updates the amount of money of the active player
Monopoly.updatePlayersMoney = function(player,amount, give){
    var playersMoney = parseInt(player.attr("data-money"));
    if(give){
    playersMoney += amount;
    }else {
        playersMoney -= amount;
    }
        if (playersMoney < 4 ){
            console.log(player);
            //player.remove();
            //Monopoly.initDice();
            //Monopoly.initPopups();
            alert("you are broke!")
        }else{
            player.attr("data-money",playersMoney);
            console.log(playersMoney)
            player.attr("title",player.attr("id") + ": $" + playersMoney);
            Monopoly.playSound("chaching");
        }
      
 
   
};

// function that is responsible for rolling the dice, check the result and make the proper action - movement
// that will correspond to it. 
Monopoly.rollDice = function(){
    let players = $('.player');
    if(players.length < 1){
        console.log("player" + players + " won the game");
    }else {
        $('.my-score').empty();
        var result1 = Math.floor(Math.random() * 1) + 1 ;
        var result2 = Math.floor(Math.random() * 1) + 1 ;
        $(".dice").find(".dice-dot").css("opacity",0);
        $(".dice#dice1").attr("data-num",result1).find(".dice-dot.num" + result1).css("opacity",1);
        $(".dice#dice2").attr("data-num",result2).find(".dice-dot.num" + result2).css("opacity",1);
       
        for(let i = 0; i< players.length; i++){
            let li = $("<h3>");
            li.text(`player ${i} has ${players[i].dataset.money} dollars`);
            $('.my-score').append(li);
            console.log(li);
        };
        if (result1 == result2){
     
             var player = Monopoly.getCurrentPlayer();
            Monopoly.handleAction(player,"move",result1 + result2);
            
        }else{
            var currentPlayer = Monopoly.getCurrentPlayer();
            Monopoly.handleAction(currentPlayer,"move",result1 + result2);
            Monopoly.doubleCounter = 0;
        }  
    }
};

// the movement of the active players is handled by this function
Monopoly.movePlayer = function(player,steps){
    console.log("move player")
    Monopoly.allowRoll = false;
    var playerMovementInterval = setInterval(function(){
        if (steps == 0){
            clearInterval(playerMovementInterval);
            Monopoly.handleTurn(player);
        }else{
            var playerCell = Monopoly.getPlayersCell(player);
            var nextCell = Monopoly.getNextCell(playerCell);
            nextCell.find(".content").append(player);
            steps--;
        }
    },200);
};

//check there the players ended his move and reacts accordingly to the tile.
Monopoly.handleTurn = function(){
    var player = Monopoly.getCurrentPlayer();
    var playerCell = Monopoly.getPlayersCell(player);
    if (playerCell.is(".available.property")){
        Monopoly.handleBuyProperty(player,playerCell);
    }else if(playerCell.is(".property:not(.available)") && !playerCell.hasClass(player.attr("id"))){
         Monopoly.handlePayRent(player,playerCell);
    }else if(playerCell.is(".property:not(.available)") && playerCell.hasClass(player.attr("id"))){
        player.addClass("happy")
    } else if(playerCell.is(".go-to-jail")){
        player.addClass("sad-face")
        Monopoly.handleGoToJail(player);
    }else if(playerCell.is(".chance")){
        Monopoly.handleChanceCard(player);
    }else if(playerCell.is(".community")){
        Monopoly.handleCommunityCard(player);
    }else{
        Monopoly.setNextPlayerTurn();
    }
}

// deliveres the active status to the next player
Monopoly.setNextPlayerTurn = function(){
    var currentPlayerTurn = Monopoly.getCurrentPlayer();
    var playerId = parseInt(currentPlayerTurn.attr("id").replace("player",""));
    currentPlayerTurn.remove();
    var nextPlayerId = playerId + 1;
    if (nextPlayerId > $(".player").length){
        nextPlayerId = 1;
    }
    currentPlayerTurn.removeClass("current-turn");
    var nextPlayer = $(".player#player" + nextPlayerId);
    nextPlayer.addClass("current-turn");
    if (nextPlayer.is(".jailed")){
        var currentJailTime = parseInt(nextPlayer.attr("data-jail-time"));
        currentJailTime++;
        nextPlayer.attr("data-jail-time",currentJailTime);
        if (currentJailTime > 3){
            nextPlayer.removeClass("jailed");
            nextPlayer.removeAttr("data-jail-time");
        }
        Monopoly.setNextPlayerTurn();
        return;
    }
    Monopoly.closePopup();
    Monopoly.allowRoll = true;
};

// function responsible for buying property
Monopoly.handleBuyProperty = function(player,propertyCell){
    var propertyCost = Monopoly.calculateProperyCost(propertyCell);
    var popup = Monopoly.getPopup("buy");
    popup.find(".cell-price").text(propertyCost);
    popup.find("button").unbind("click").bind("click",function(){
        var clickedBtn = $(this);
        if (clickedBtn.is("#yes")){
            Monopoly.handleBuy(player,propertyCell,propertyCost);
        }else{
            Monopoly.closeAndNextTurn();
        }
    });
    Monopoly.showPopup("buy");
};
// responsible for checking whom the property belongs, if not to the active player, he will pay a rent to the owner
Monopoly.handlePayRent = function(player,propertyCell){
    var popup = Monopoly.getPopup("pay");
    var currentRent = parseInt(propertyCell.attr("data-rent"));
    var properyOwnerId = propertyCell.attr("data-owner");
    popup.find("#player-placeholder").text(properyOwnerId);
    popup.find("#amount-placeholder").text(currentRent);
    
    popup.find("button").unbind("click").bind("click",function(){
        var properyOwner = $(".player#"+ properyOwnerId);
        console.log(properyOwnerId)
          player.addClass("sad-face");
        Monopoly.updatePlayersMoney(player,currentRent);
        Monopoly.updatePlayersMoney(properyOwner,-1*currentRent);
        Monopoly.closeAndNextTurn();
    });
   Monopoly.showPopup("pay");
};

// activates the function that checks the player that should be sent to jail, show a proper message
Monopoly.handleGoToJail = function(player){
    var popup = Monopoly.getPopup("jail");
    player.addClass("sad-face");
    popup.find("button").unbind("click").bind("click",function(){
        Monopoly.handleAction(player,"jail");
    });
    Monopoly.showPopup("jail");
};

// gets a message from a server with the chance card
Monopoly.handleChanceCard = function(player){
    var popup = Monopoly.getPopup("chance");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com/get_random_chance_card", function(chanceJson){
        popup.find(".popup-content #text-placeholder").text(chanceJson["content"]);
        popup.find(".popup-title").text(chanceJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action",chanceJson["action"]).attr("data-amount",chanceJson["amount"]);
    },"json");
    popup.find("button").unbind("click").bind("click",function(){
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
        console.log("testing the action and amount " + action + " " + amount)
        Monopoly.handleAction(player,action,parseInt(amount));
    });
    Monopoly.showPopup("chance");
};
// gets a message from a server with the community card
Monopoly.handleCommunityCard = function(player){
    var popup = Monopoly.getPopup("chance");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com/get_random_community_card", function(chanceJson){
        popup.find(".popup-content #text-placeholder").text(chanceJson["content"]);
        popup.find(".popup-title").text(chanceJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action",chanceJson["action"]).attr("data-amount",chanceJson["amount"]);
    },"json");
    popup.find("button").unbind("click").bind("click",function(){
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
        console.log("testing the action and amount " + action + " " + amount)
        Monopoly.handleAction(player,action,amount);
    });
    Monopoly.showPopup("chance");
};

// the send to jail
Monopoly.sendToJail = function(player){
    player.addClass("jailed");
    player.addClass('sad-face')
    player.attr("data-jail-time",1);
    $(".corner.game.cell.in-jail").append(player);
    Monopoly.playSound("woopwoop");
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};


Monopoly.getPopup = function(popupId){
    return $(".popup-lightbox .popup-page#" + popupId);
};

Monopoly.calculateProperyCost = function(propertyCell){
    var cellGroup = propertyCell.attr("data-group");
    var cellPrice = parseInt(cellGroup.replace("group","")) * 5;
    if (cellGroup == "rail"){
        cellPrice = 10;
    }
    return cellPrice;
};


Monopoly.calculateProperyRent = function(propertyCost){
    return propertyCost/2;
};


Monopoly.closeAndNextTurn = function(){
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};

Monopoly.initPopups = function(){
    $(".popup-page#intro").find("button").click(function(){
        var numOfPlayers = $(this).closest(".popup-page").find("input").val();
        if (Monopoly.isValidInput("numofplayers",numOfPlayers)){
            Monopoly.createPlayers(numOfPlayers);
            Monopoly.closePopup();
        }
    });
};


Monopoly.handleBuy = function(player,propertyCell,propertyCost){
    var playersMoney = Monopoly.getPlayersMoney(player)
    if (playersMoney < propertyCost){
        Monopoly.showErrorMsg();
        Monopoly.playSound("Computer Error Alert-SoundBible.com-783113881");

    }else{
        Monopoly.updatePlayersMoney(player,propertyCost);
        var rent = Monopoly.calculateProperyRent(propertyCost);

        propertyCell.removeClass("available")
                    .addClass(player.attr("id"))
                    .attr("data-owner",player.attr("id"))
                    .attr("data-rent",rent);
        Monopoly.setNextPlayerTurn();
    }
};


Monopoly.handleAction = function(player,action,amount){
    console.log(action)
    switch(action){
        case "move":
            console.log(amount)
            Monopoly.movePlayer(player,amount);
            player.removeClass("sad-face");
            player.removeClass("happy");
             break;
        case "pay":
            Monopoly.updatePlayersMoney(player,amount);
            Monopoly.setNextPlayerTurn();
            break;
        case "jail":
            Monopoly.sendToJail(player);
            break;
    };
    Monopoly.closePopup();
};



Monopoly.createPlayers = function(numOfPlayers){
    var startCell = $(".go");
    for (var i=1; i<= numOfPlayers; i++){
        var player = $("<div />").addClass("player shadowed").attr("id","player" + i).attr("title","player" + i + ": $" + Monopoly.moneyAtStart);
        startCell.find(".content").append(player);
        if (i==1){
            player.addClass("current-turn");
        }
        player.attr("data-money",Monopoly.moneyAtStart);
    }
};


Monopoly.getNextCell = function(cell){
    var currentCellId = parseInt(cell.attr("id").replace("cell",""));
    console.log(currentCellId)
    var nextCellId = currentCellId + 1
    if (nextCellId > 40){
        console.log("YAY")
        Monopoly.handlePassedGo();
        nextCellId = 1;
    }
    return $(".cell#cell" + nextCellId);
};


Monopoly.handlePassedGo = function(){
    var player = Monopoly.getCurrentPlayer();
    Monopoly.updatePlayersMoney(player,(Monopoly.moneyAtStart)/10, true);
};


Monopoly.isValidInput = function(validate,value){
    var isValid = false;
    switch(validate){
        case "numofplayers":
            if(value > 1 && value <= 6){
                isValid = true;
                break;
            }else{
                console.log("wrong input!!!")
            }
            //TODO: remove when done
            console.log("the val " + value)
            
           
    }

    if (!isValid){
        Monopoly.showErrorMsg();
    }
    return isValid;

}

Monopoly.showErrorMsg = function(){
    $(".popup-page .invalid-error").fadeTo(500,1);
    setTimeout(function(){
            $(".popup-page .invalid-error").fadeTo(500,0);
    },2000);
};


Monopoly.adjustBoardSize = function(){
    var gameBoard = $(".board");
    var boardSize = Math.min($(window).height(),$(window).width());
    boardSize -= parseInt(gameBoard.css("margin-top")) *2;
    $(".board").css({"height":boardSize,"width":boardSize});
}

Monopoly.closePopup = function(){
    $(".popup-lightbox").fadeOut();
};

Monopoly.playSound = function(sound){
    var snd = new Audio("./sounds/" + sound + ".wav"); 
    snd.play();
}

Monopoly.showPopup = function(popupId){
    $(".popup-lightbox .popup-page").hide();
    $(".popup-lightbox .popup-page#" + popupId).show();
    $(".popup-lightbox").fadeIn();
};

Monopoly.init();

