var g = {};

function makeGround(ctx)
{
    var vertices = new Float32Array([ 100, 0, 100,   100, 0,-100,  -100, 0,-100,  -100, 0, 100 ]);

    var normals = new Float32Array([ 0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0 ]);

    var texCoords = new Float32Array([ 1, 0,   1, 1,   0, 1,   0, 0 ]);

    var indices = new Uint8Array([ 0, 1, 2,   0, 2, 3 ]);

    var retval = { };

    retval.normalObject = ctx.createBuffer();
    ctx.bindBuffer(ctx.ARRAY_BUFFER, retval.normalObject);
    ctx.bufferData(ctx.ARRAY_BUFFER, normals, ctx.STATIC_DRAW);

    retval.texCoordObject = ctx.createBuffer();
    ctx.bindBuffer(ctx.ARRAY_BUFFER, retval.texCoordObject);
    ctx.bufferData(ctx.ARRAY_BUFFER, texCoords, ctx.STATIC_DRAW);

    retval.vertexObject = ctx.createBuffer();
    ctx.bindBuffer(ctx.ARRAY_BUFFER, retval.vertexObject);
    ctx.bufferData(ctx.ARRAY_BUFFER, vertices, ctx.STATIC_DRAW);

    ctx.bindBuffer(ctx.ARRAY_BUFFER, null);

    retval.indexObject = ctx.createBuffer();
    ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, retval.indexObject);
    ctx.bufferData(ctx.ELEMENT_ARRAY_BUFFER, indices, ctx.STATIC_DRAW);
    ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, null);

    retval.numIndices = indices.length;

    return retval;
}

function init()
{
	var gl = initWebGL("canvas");
	if(!gl){return;}
	
	
	
	g.vprogram = simpleSetup
	(
		gl, "vshader", "fshader",
		[ "vNormal", "vTexCoord", "vPosition"],
		[ 0.6, 0.6, 0.8, 1 ], 10000
	);
	
	g.fprogram = simpleSetup
	(
		gl, "ground-vshader", "ground-fshader",
		[ "aVertexPosition", "aVertexNormal", "aTextureCoord"],
		[ 0.5, 0.5, 0.5, 1 ], 10000
	);
	
	g.program = g.vprogram;
	gl.useProgram(g.program);

	gl.uniform3f(gl.getUniformLocation(g.program, "lightDir"), 0.7, 0.7, 0.5);
	gl.uniform1i(gl.getUniformLocation(g.program, "sampler2d"), 0);
	
	
	//g.program.useLightingUniform = gl.getUniformLocation(g.program, "uUseLighting");//
	//gl.uniform1i(g.program.useLightingUniform, 0);//



	g.box = makeBox(gl);
	g.ground = makeGround(gl);

	g.crateTexture = loadImageTexture(gl, "crate.jpg");
	g.crate2Texture = loadImageTexture(gl, "crate2.jpg");
	g.crate3Texture = loadImageTexture(gl, "crate3.png");
	
	g.grassTexture = loadImageTexture(gl, "grass.jpg");
	g.bgTexture = loadImageTexture(gl, "bg2.jpg");

	g.u_normalMatrixLoc = gl.getUniformLocation(g.program, "u_normalMatrix");
	g.u_modelViewProjMatrixLoc = gl.getUniformLocation(g.program, "u_modelViewProjMatrix");


	return gl;
}

	
function audioInit()
{
	try
	{
		window.AudioContext = window.AudioContext||window.webkitAudioContext;
		var audioCtx = new AudioContext();
		return audioCtx;
	}
	catch(e)
	{
		console.log("could not initialize web audio: " + e);
		return null;
	}
}

var requestId;

function reshape(gl)
{
	if(g.canvas.clientWidth == g.canvas.width && g.canvas.clientHeight == g.canvas.height)
		return;

	g.canvas.width = g.canvas.clientWidth;
	g.canvas.height = g.canvas.clientHeight;

	gl.viewport(0, 0, g.canvas.clientWidth, g.canvas.clientHeight);
	
	g.perspectiveMatrix = new J3DIMatrix4();
	g.perspectiveMatrix.perspective(40, g.canvas.clientWidth / g.canvas.clientHeight, 1, 10000);
	g.perspectiveMatrix.lookat(0, 0, 20, 0, 0, 0, 0, 1, 0);
	//lookat = function(eyex, eyey, eyez, centerx, centery, centerz, upx, upy, upz)
}

function drawBox(gl, anglez, angley, x, y, z, scale, texture)
{
	/*
	gl.enableVertexAttribArray(0);
	gl.enableVertexAttribArray(1);
	gl.enableVertexAttribArray(2);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, g.box.vertexObject);
	gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, g.box.normalObject);
	gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, g.box.texCoordObject);
	gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.box.indexObject);
	*/
	
	// generate the model-view matrix
	var mvMatrix = new J3DIMatrix4();
	
	mvMatrix.rotate(anglez, 0,0,1);
	mvMatrix.translate(x,y-1.5,z);
	mvMatrix.rotate(angley, 0,1,0);
	mvMatrix.scale(scale, scale, scale);

	// construct the normal matrix from the model-view matrix
	var normalMatrix = new J3DIMatrix4(mvMatrix);
	normalMatrix.invert();
	normalMatrix.transpose();
	normalMatrix.setUniform(gl, g.u_normalMatrixLoc, false);

	// construct the model-view * projection matrix
	var mvpMatrix = new J3DIMatrix4(g.perspectiveMatrix);
	mvpMatrix.multiply(mvMatrix);
	mvpMatrix.setUniform(gl, g.u_modelViewProjMatrixLoc, false);

	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.drawElements(gl.TRIANGLES, g.box.numIndices, gl.UNSIGNED_BYTE, 0);
}

function drawGround(gl, anglez, angley, x, y, z, scale, texture)
{
	
	//gl.uniform3f(gl.getUniformLocation(g.program, "lightDir"), 0.7, 0.7, 1);
	/*
	gl.enableVertexAttribArray(0);
	gl.enableVertexAttribArray(1);
	gl.enableVertexAttribArray(2);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, g.ground.vertexObject);
	gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, g.ground.normalObject);
	gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, g.ground.texCoordObject);
	gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.ground.indexObject);
	*/
	// generate the model-view matrix
	var mvMatrix = new J3DIMatrix4();
	
	mvMatrix.rotate(anglez, 0,0,1);
	mvMatrix.translate(x,y-2.5,z);
	mvMatrix.rotate(angley, 1,0,0);
	mvMatrix.scale(scale, scale, scale);

	// construct the normal matrix from the model-view matrix
	var normalMatrix = new J3DIMatrix4(mvMatrix);
	normalMatrix.invert();
	normalMatrix.transpose();
	normalMatrix.setUniform(gl, g.u_normalMatrixLoc, false);

	// construct the model-view * projection matrix
	var mvpMatrix = new J3DIMatrix4(g.perspectiveMatrix);
	mvpMatrix.multiply(mvMatrix);
	mvpMatrix.setUniform(gl, g.u_modelViewProjMatrixLoc, false);

	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.drawElements(gl.TRIANGLES, g.ground.numIndices, gl.UNSIGNED_BYTE, 0);
	
	//gl.uniform3f(gl.getUniformLocation(g.program, "lightDir"), 0.7, 0.7, -0.5);
}

function loadSound(ctx, loc)
{
	var request = new XMLHttpRequest();
	request.open('GET', loc, true);
	request.responseType = 'arraybuffer';

	//Decode asynchronously
	request.onload = function()
	{
		ctx.decodeAudioData(request.response, function(buffer) 
		{
			//g.audioBuffer = buffer;
			g.gainNode = ctx.createGain();
			playSound(ctx, buffer, 0);
			console.log(buffer.duration);
			setInterval(function(){playSound(ctx, buffer, 0);}, buffer.duration * 1000);
			
			//return buffer;
		}, function()
		{
			console.log("error loading audio");
		});
	}
	request.send();
}

function playSound(ctx, buffer, delay)
{
	var source = ctx.createBufferSource();
	source.buffer = buffer;
	source.connect(g.gainNode);
	g.gainNode.connect(ctx.destination);
	source.start(delay);
}

function toggleSound()
{
	console.log(g.gainNode.gain.value);
	if(g.gainNode.gain.value != 0)
	{
		g.gainNode.gain.value = 0;
		document.getElementById("button1").style.display = 'none';
		document.getElementById("button2").style.display = 'block';
	}
	else
	{
		g.gainNode.gain.value = 1;
		document.getElementById("button1").style.display = 'block';
		document.getElementById("button2").style.display = 'none';
	}
	console.log(g.gainNode.gain.value);
}

function drawPicture(gl)
{
	reshape(gl);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	/////////////////////////////////////////////////////////////	
	gl.enableVertexAttribArray(0);
	gl.enableVertexAttribArray(1);
	gl.enableVertexAttribArray(2);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, g.ground.vertexObject);
	gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, g.ground.normalObject);
	gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, g.ground.texCoordObject);
	gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.ground.indexObject);
	/////////////////////////////////////////////////////////////	
	
	
	drawGround(gl, g.cam.angle, 90, 0, 150, -250, 2, g.bgTexture);

	drawGround(gl, g.cam.angle, 0, g.groundx, 0, g.groundz, 1, g.grassTexture);
	drawGround(gl, g.cam.angle, 0, g.groundx, 0, g.groundz-200, 1, g.grassTexture);
	drawGround(gl, g.cam.angle, 0, g.groundx, 0, g.groundz-400, 1, g.grassTexture);
	
	drawGround(gl, g.cam.angle, 0, g.groundx+200, 0, g.groundz, 1, g.grassTexture);
	drawGround(gl, g.cam.angle, 0, g.groundx+200, 0, g.groundz-200, 1, g.grassTexture);
	drawGround(gl, g.cam.angle, 0, g.groundx+200, 0, g.groundz-400, 1, g.grassTexture);
	
	drawGround(gl, g.cam.angle, 0, g.groundx-200, 0, g.groundz, 1, g.grassTexture);
	drawGround(gl, g.cam.angle, 0, g.groundx-200, 0, g.groundz-200, 1, g.grassTexture);
	drawGround(gl, g.cam.angle, 0, g.groundx-200, 0, g.groundz-400, 1, g.grassTexture);
	
	/////////////////////////////////////////////////////////////
	gl.enableVertexAttribArray(0);
	gl.enableVertexAttribArray(1);
	gl.enableVertexAttribArray(2);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, g.box.vertexObject);
	gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, g.box.normalObject);
	gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, g.box.texCoordObject);
	gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.box.indexObject);
	/////////////////////////////////////////////////////////////
	
	
	
	for(var i=0; i<80; i++)
	{
		if(g.allboxpos[i].tex == 1)
			drawBox(gl, g.cam.angle, g.allboxpos[i].angle, g.allboxpos[i].x, g.allboxpos[i].y, g.allboxpos[i].z, 1, g.crateTexture);

		else if(g.allboxpos[i].tex == 2)
			drawBox(gl, g.cam.angle, g.allboxpos[i].angle, g.allboxpos[i].x, g.allboxpos[i].y, g.allboxpos[i].z, 1, g.crate2Texture);

		else if(g.allboxpos[i].tex == 3)
			drawBox(gl, g.cam.angle, g.allboxpos[i].angle, g.allboxpos[i].x, g.allboxpos[i].y, g.allboxpos[i].z, 1, g.crate3Texture);
			
		else if(g.allboxpos[i].tex == 0)
			drawBox(gl, g.cam.angle, g.allboxpos[i].angle, g.allboxpos[i].x, g.allboxpos[i].y, g.allboxpos[i].z, 1, null);
	}
	
	gl.bindTexture(gl.TEXTURE_2D, null);

	if(!g.ups)
		framerate.snapshot();

}

function update()
{
	if(g.leftKeyDown)
	{
		g.cam.xv = 0.2 * g.cam.zv;
		if(g.cam.angle > -10 && g.cam.zv != 0)
			g.cam.angle--;
	}
	else if(g.cam.angle < 0)
		g.cam.angle++;
		
	if(g.rightKeyDown)
	{
		g.cam.xv = -0.2 * g.cam.zv;
		if(g.cam.angle < 10 && g.cam.zv != 0)
			g.cam.angle++;
	}
	else if(g.cam.angle > 0)
		g.cam.angle--;
	
	if(g.upKeyDown)
		g.cam.zv -= 0.04;
		
		
	if(g.leftKeyDown && g.rightKeyDown)
	{
		if(g.cam.angle < 0)
			g.cam.angle++;
			
		if(g.cam.angle > 0)
			g.cam.angle--;
		
		g.cam.xv = 0;
	}	
		
		
	if(g.distance > 40 && !g.hitFourty)
	{
		g.hitFourty = true;
		document.getElementById("menu").style.display = 'none';
		document.getElementById("save").style.display = 'none';
		document.getElementById("highscores").style.display = 'none';
	}
	
	for(var i=0; i<80; i++)
	{
		if(g.allboxpos[i].z > 23)
		{
			if(g.distance > 2000)
			{
				g.allboxpos[i].tex = 2;
				if(g.distance > 5000)
				{
					g.allboxpos[i].tex = 3;
					if(g.distance > 10000)
						g.allboxpos[i].tex = 0;
				}
			}
			
			g.allboxpos[i].x = Math.random() * 200 - 100;
			g.allboxpos[i].z = Math.random() * -200 - 150;
			g.allboxpos[i].angle = Math.random() * 90;
			
			g.distance++;
		}
		
		if(g.allboxpos[i].x < 1.7 && g.allboxpos[i].x > -1.7 && g.allboxpos[i].z > 15)
		{
			var avgVelocity = g.avgVelocity;
			var distance = g.distance;
			
			console.log("vel = " + -g.cam.zv);
			console.log("dis = " + g.distance);
			console.log("avgV= " + g.avgVelocity);
			
			g.ups = true;
			setTimeout(function()
			{
				console.log("fps = " + g.framerate);
				if(g.framerate > 55)
				{
					g.score = Math.round(0.05 * distance * avgVelocity * avgVelocity);
					document.getElementById("menu").innerHTML="Game Over<br>Score = " + g.score;
				}
				else
				{
					g.score = Math.round((0.1 * distance * avgVelocity)/(60/g.framerate));
					g.score = 0;
					document.getElementById("menu").innerHTML="Game Over<br>Score = " + g.score;
				}
				
				console.log("score= " + g.score);
				document.getElementById("menu").style.display = 'block';
				getScores();
				document.getElementById("highscores").style.display = 'block';
				document.getElementById("save").style.display = 'block';
				
				
				
			}, 500);
			
			g.avgVelocity = 0;	
			g.distance = 0;
			
			g.ticks = 0;
			g.cam.zv = 0;
			g.allboxpos[i].z = 24;
			for(var j=0; j<80; j++)
			{
				g.allboxpos[j].tex = 1;
			}
			
			g.hitFourty = false;
			g.leftKeyDown = false;
			g.rightKeyDown = false;
			g.upKeyDown = false;
			g.cam.angle = 0;
			g.cam.xv = 0;
			
		}
		
		g.allboxpos[i].x -= g.cam.xv;
		g.allboxpos[i].z -= g.cam.zv;
		
	}
	//console.log(g.avgVelocity);
	g.avgVelocity = (g.avgVelocity*g.ticks - g.cam.zv)/(g.ticks+1);
	if(g.cam.zv != 0)
		g.ticks++;
	
	g.groundx -= g.cam.xv;
	g.groundz -= g.cam.zv;
	if(g.groundz > 200)
		g.groundz = 0;
		
	if(g.groundx > 200 || g.groundx < -200)
		g.groundx = 0;
	
	
	document.getElementById("score").innerHTML="Velocity = " + Math.round(-g.cam.zv * 10);
	document.getElementById("distance").innerHTML="Distance = " + Math.round(g.distance);
	
	if(g.ups)
		framerate.snapshot();
}

function removeDialog()
{
	document.getElementById("save").style.display = 'none';
}


function onKeyPress(e)
{
	var code = e.keyCode;
	switch(code)
	{
		case 27://esc
		{
			e.preventDefault();
			g.hitFourty = true;
			document.getElementById("menu").style.display = 'none';
			document.getElementById("save").style.display = 'none';
			document.getElementById("highscores").style.display = 'none';
			break;
		}
		case 37://Left key
		{
			e.preventDefault();
			g.leftKeyDown = true;
			//g.cam.xv = 0.2 * g.cam.zv;
			break;
		}
		
		case 38: //Up key
		{
			e.preventDefault();
			g.upKeyDown = true;
			break;
		}
		
		case 39: //Right key
		{
			e.preventDefault();
			g.rightKeyDown = true;
			//g.cam.xv = -0.2 * g.cam.zv;
			break;
		}
		case 70:
		{
			g.ups = false;
			break;
		}
		case 72:
		{
			if(document.getElementById("save").style.display == 'none')
			{
				getScores();
				document.getElementById("highscores").style.display = 'block';
			}
			
			break;
		}
		case 85:
		{
			g.ups = true;
			break;
		}
		
		default: console.log(code);
	}
}

function onKeyUp(e)
{
	e.preventDefault();
	var code = e.keyCode;
	switch(code)
	{
		case 37://Left key
		{
			g.leftKeyDown = false;
			g.cam.xv = 0;
			break;
		}
		
		case 38: //Up key
		{
			g.upKeyDown = false;
			break;
		}
		
		case 39: //Right key
		{
			g.rightKeyDown = false;
			g.cam.xv = 0;
			break;
		}
		
		case 72: //Right key
		{
			if(g.hitFourty)
				document.getElementById("highscores").style.display = 'none';
			break;
		}
		
		default: console.log(code);
	}
}




function main()
{
	g.canvas = document.getElementById("canvas");
	document.getElementById("button2").style.display = 'none';
	
	g.cam = {xv:0, zv:0, angle:0};
	g.groundz = 0;
	g.groundx = 0;
	g.leftKeyDown = false;
	g.rightKeyDown = false;
	g.upKeyDown = false;
	
	g.distance = 0;
	g.avgVelocity = 0;
	g.ticks = 0;
	g.score = 0;
	g.hitFourty = false;
	g.framerate = 0;
	
	g.ups = false;
	
	g.audioBuffer = null;
	g.gainNode = null;
	
	g.allboxpos = [];
	
	for(var i=0; i<80; i++)
	{
		var boxpos = {x:0, y:0, z:0, angle:0, tex:1};
		g.allboxpos.push(boxpos);
		
		g.allboxpos[i].x = Math.random() * 200 - 100;
		g.allboxpos[i].z = Math.random() * -200;
		g.allboxpos[i].angle = Math.random() * 90;
	}
	
	//c = WebGLDebugUtils.makeLostContextSimulatingCanvas(c);
	// tell the simulator when to lose context.
	//c.loseContextInNCalls(1);
	
	g.canvas.addEventListener('webglcontextlost', handleContextLost, false);
	g.canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
	
	document.addEventListener('keydown', onKeyPress, false);
	document.addEventListener('keyup', onKeyUp, false);
	

	var audio = audioInit();
	var gl = init();
	if(!gl)
	{
	   return;
	}
	
	//loadSound(audio, "sc.mp3");
	//setTimeout(function(){
	//	playSound(audio, g.audioBuffer, 0);
	//}, 2000);
	
	setInterval(update, 1000/60);

	framerate = new Framerate("framerate");
	var f = function()
	{
		drawPicture(gl);
		requestId = window.requestAnimFrame(f, g.canvas);
		
	};
	f();

	function handleContextLost(e)
	{
		e.preventDefault();
		clearLoadingImages();
		if(requestId !== undefined)
		{
			window.cancelAnimFrame(requestId);
			requestId = undefined;
		}
	}

	function handleContextRestored()
	{
		init();
		f();
	}
}
