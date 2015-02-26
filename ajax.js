var error = document.getElementById("error");

function ajaxRequest(){
	var activexmodes=["Msxml2.XMLHTTP", "Microsoft.XMLHTTP"]
	if (window.ActiveXObject){ 
		
	for (var i=0; i<activexmodes.length; i++){
		try{
			return new ActiveXObject(activexmodes[i])
		}
		catch(e){
		}
	}
}
	else if (window.XMLHttpRequest)
		return new XMLHttpRequest()
	else
		return false
}

function saveScore(){
	var mypostrequest=new ajaxRequest()
	mypostrequest.onreadystatechange=function(){
		if (mypostrequest.readyState==4){
			if (mypostrequest.status==200 || window.location.href.indexOf("http")==-1)
			{
				document.getElementById("menu").innerHTML=mypostrequest.responseText
				if(mypostrequest.responseText != "Score successfully saved!")
					document.getElementById("save").style.display = 'block';
				getScores();
			}
			else{
				error.innerHTML = "An error has occured making the request";
			}
		}
	}
	
	var name=encodeURIComponent(document.getElementById("name").value)
	
	if(document.getElementById("name").value.length < 2){
		error.innerHTML = "You must include a name longer than 2 characters.";
	}4

	var parameters="name=" + name + "&score=" + g.score + "&game=velocity"

	mypostrequest.open("POST", "http://www.stewtopia.co.uk/AJAXPHP/SaveHighscore.php", true)
	mypostrequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
	mypostrequest.send(parameters)
}

function getScores()
{
	var scores = new ajaxRequest()
	
	scores.onreadystatechange=function(){
		if (scores.readyState==4){
			if (scores.status==200 || window.location.href.indexOf("http")==-1){
				document.getElementById("highscores").innerHTML=scores.responseText
			}
			else{
				error.innerHTML = "An error has occured making the request";
			}
		}
	}
	
	scores.open("GET", "http://www.stewtopia.co.uk/AJAXPHP/GetHighscores.php", true)
	scores.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
	scores.send()
}
